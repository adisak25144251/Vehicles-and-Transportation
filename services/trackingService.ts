
import { TrackingSession, TelemetryPacket, UserRole } from '../types';
import { geofenceService } from './geofenceService';
import { tripService } from './apiService'; 
import { scoringService } from './scoringService';
import { dataQualityService } from './dataQualityService';
import { offlineStorage } from './offlineStorage';
import { auditService } from './auditService'; // Imported

// --- CONFIGURATION ---
const SYNC_INTERVAL_MS = 5000; // Check queue every 5s
const BATCH_SIZE = 20;
const MAX_RETRY_DELAY = 30000; // 30s max backoff

// Mock DB (In-memory)
let activeSessions: TrackingSession[] = [];
let wakeLock: any = null;
let syncInterval: any = null;
let isSyncing = false;
let retryDelay = 1000;

// Subscribers
const subscribers: ((sessions: TrackingSession[]) => void)[] = [];

const notifySubscribers = () => {
  subscribers.forEach(cb => cb([...activeSessions]));
};

// --- HELPER: WAKE LOCK ---
const requestWakeLock = async () => {
  if ('wakeLock' in navigator) {
    try {
      // @ts-ignore
      wakeLock = await navigator.wakeLock.request('screen');
    } catch (err) {
      console.warn(`Wake Lock Error: ${err}`);
    }
  }
};

const releaseWakeLock = async () => {
  if (wakeLock) {
    try {
      await wakeLock.release();
      wakeLock = null;
    } catch (err) {
      console.warn(`Wake Lock Release Error: ${err}`);
    }
  }
};

const getRouteForSession = async (tripId: string) => {
  try {
     const trips = await tripService.getAll();
     const trip = trips.find(t => t.id === tripId);
     return trip?.routePath;
  } catch(e) { console.error(e); }
  return undefined;
};

export const trackingService = {
  subscribeToFleet(callback: (sessions: TrackingSession[]) => void) {
    subscribers.push(callback);
    callback([...activeSessions]);
    return () => {
      const idx = subscribers.indexOf(callback);
      if (idx > -1) subscribers.splice(idx, 1);
    };
  },

  // New method for AI Bot access
  getSessionSnapshot(): TrackingSession[] {
    return [...activeSessions];
  },

  async startSession(sessionId: string, initialData?: { driverName: string, vehicleId: string, mission: string }): Promise<void> {
    await requestWakeLock();
    
    // Log Audit
    auditService.log(
      'TRIP_START', 
      { fullName: initialData?.driverName || 'Driver', role: UserRole.DRIVER }, 
      sessionId, 
      'TRIP', 
      'Driver started the trip via mobile app'
    );

    // CRITICAL: Register session IMMEDIATELY so Fleet Command sees it instantly
    // Check if exists
    const existingIndex = activeSessions.findIndex(s => s.sessionId === sessionId);
    if (existingIndex === -1) {
        // Create initial placeholder session
        activeSessions.push({
            sessionId,
            tripId: 'T-' + sessionId,
            vehicleId: initialData?.vehicleId || 'VEH-' + sessionId.slice(0,4),
            driverName: initialData?.driverName || 'Unknown Driver',
            department: 'Pending...',
            mission: initialData?.mission || 'Active Mission',
            origin: 'Starting...',
            destination: '...',
            status: 'SETUP', // Initial status before GPS
            startTime: Date.now(),
            lastUpdate: new Date().toISOString(),
            currentLocation: { lat: 13.7563, lng: 100.5018, speed: 0, heading: 0, accuracy: 0 }, // Default BKK
            pathHistory: [],
            totalDistance: 0,
            currentScore: 100,
            pendingQueueSize: 0,
            signalStrength: 'GOOD'
        });
        notifySubscribers();
    }

    // Start Sync Loop
    if (!syncInterval) {
      this.triggerSync(); // Immediate check
      syncInterval = setInterval(() => {
         this.triggerSync();
      }, SYNC_INTERVAL_MS);
    }
  },

  async endSession(sessionId: string): Promise<void> {
    await releaseWakeLock();
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
    const idx = activeSessions.findIndex(s => s.sessionId === sessionId);
    if (idx > -1) {
      const session = activeSessions[idx];
      activeSessions[idx].status = 'ENDED';
      notifySubscribers();

      // Log Audit
      auditService.log(
        'TRIP_END', 
        { fullName: session.driverName, role: UserRole.DRIVER }, 
        sessionId, 
        'TRIP', 
        `Driver ended the trip. Total Distance: ${session.totalDistance.toFixed(2)}m`
      );
    }
  },

  async pushTelemetry(sessionId: string, packet: TelemetryPacket) {
    // 1. Save to IndexedDB (Queue) - Always saves locally first (Offline-first)
    await offlineStorage.addItem(sessionId, packet);

    // 2. Update In-Memory State (Optimistic UI)
    const existingIndex = activeSessions.findIndex(s => s.sessionId === sessionId);
    let updatedSession: TrackingSession;
    
    if (existingIndex > -1) {
      updatedSession = { ...activeSessions[existingIndex] };
    } else {
      // Fallback if startSession wasn't called or failed (Shouldn't happen often)
      updatedSession = {
        sessionId,
        tripId: 'T-' + sessionId,
        vehicleId: 'DEVICE-' + sessionId.substring(0,4),
        driverName: 'Mobile Driver',
        department: '-',
        mission: '-',
        origin: '-',
        destination: '-',
        status: 'ACTIVE',
        startTime: Date.now(),
        lastUpdate: new Date().toISOString(),
        currentLocation: { lat: 0, lng: 0, speed: 0, heading: 0, accuracy: 0 },
        pathHistory: [],
        totalDistance: 0,
        currentScore: 100,
        pendingQueueSize: 0
      };
    }

    // Update location details
    updatedSession.currentLocation = {
        lat: packet.lat,
        lng: packet.lng,
        speed: packet.speed,
        heading: packet.heading,
        accuracy: packet.accuracy,
        altitude: packet.altitude
    };
    updatedSession.lastUpdate = new Date(packet.timestamp).toISOString();
    updatedSession.batteryLevel = packet.batteryLevel;
    updatedSession.status = !navigator.onLine ? 'OFFLINE' : 'ACTIVE';
    updatedSession.networkType = packet.networkType as any;
    updatedSession.totalDistance += (packet.speed * 1000 / 3600) * 1; // Approx distance
    
    // Services Analysis
    const route = await getRouteForSession(updatedSession.tripId);
    geofenceService.checkCompliance(updatedSession, route);
    
    const event = scoringService.processTelemetry(sessionId, packet);
    if (event) {
       const score = scoringService.calculateSessionScore(sessionId, updatedSession.totalDistance / 1000);
       updatedSession.currentScore = score;
    }

    const quality = dataQualityService.analyze(sessionId, packet);
    updatedSession.qualityProfile = quality;

    // Update Queue Count in UI
    const pendingCount = await offlineStorage.countPending();
    updatedSession.pendingQueueSize = pendingCount;

    if (existingIndex > -1) {
      activeSessions[existingIndex] = updatedSession;
    } else {
      activeSessions.push(updatedSession);
    }
    
    notifySubscribers();
    
    // Trigger sync immediately if online
    if (navigator.onLine) {
        this.triggerSync();
    }
  },

  // --- SYNC ENGINE ---
  async triggerSync() {
    if (isSyncing || !navigator.onLine) return;
    
    try {
      isSyncing = true;
      const batch = await offlineStorage.getPendingBatch(BATCH_SIZE);
      
      if (batch.length === 0) {
        isSyncing = false;
        retryDelay = 1000; // Reset backoff
        return;
      }

      console.log(`[Sync] Uploading batch of ${batch.length} items...`);

      // Simulate API Upload (Latency)
      await new Promise((resolve, reject) => {
         // 10% chance of random failure to test retry logic
         if (Math.random() < 0.1) return setTimeout(() => reject('Network Glitch'), 500);
         setTimeout(resolve, 800); 
      });

      // On Success: Delete from DB
      const ids = batch.map(i => i.id);
      await offlineStorage.deleteItems(ids);
      console.log(`[Sync] Success. Cleared ${ids.length} items.`);
      
      // Update UI Queue Count
      const pendingCount = await offlineStorage.countPending();
      activeSessions.forEach(s => {
         if (s.status === 'ACTIVE') s.pendingQueueSize = pendingCount;
         s.lastSyncTime = Date.now();
      });
      notifySubscribers();

      // Recursive call for next batch (if any)
      isSyncing = false;
      retryDelay = 1000; // Reset backoff
      if (pendingCount > 0) {
         this.triggerSync();
      }

    } catch (e) {
      console.error(`[Sync] Failed: ${e}. Retrying in ${retryDelay}ms`);
      isSyncing = false;
      // Exponential Backoff
      setTimeout(() => this.triggerSync(), retryDelay);
      retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
    }
  },

  async getHistory(sessionId: string): Promise<TelemetryPacket[]> {
     return []; // Mock
  }
};
