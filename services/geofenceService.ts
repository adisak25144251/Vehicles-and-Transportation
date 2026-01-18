
import { Geofence, TrackingSession, SecurityAlert, Trip } from "../types";
import L from 'leaflet';

// Mock Geofences
export let activeGeofences: Geofence[] = [
  {
    id: 'GF-001',
    name: 'พื้นที่หวงห้ามเขต 1 (Red Zone)',
    type: 'CIRCLE',
    coordinates: [13.7800, 100.5500],
    radius: 1000,
    triggers: ['ENTER'],
    severity: 'HIGH',
    active: true,
    description: 'พื้นที่ความมั่นคง ห้ามเข้าโดยไม่ได้รับอนุญาต'
  },
  {
    id: 'GF-002',
    name: 'จุดพักรถ (Safe House)',
    type: 'POLYGON',
    coordinates: [
      [13.7500, 100.5000],
      [13.7550, 100.5000],
      [13.7550, 100.5100],
      [13.7500, 100.5100]
    ],
    triggers: ['EXIT', 'DWELL'],
    dwellTimeMinutes: 30,
    severity: 'MEDIUM',
    active: true
  }
];

// Alert State (In-memory)
let activeAlerts: SecurityAlert[] = [];
let listeners: ((alerts: SecurityAlert[]) => void)[] = [];

// Dwell Tracking: vehicleId -> { zoneId: enterTime }
const dwellTracker: Record<string, Record<string, number>> = {};

// --- GEOMETRY HELPERS ---

// Haversine Distance (Meters)
const getDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Point inside Polygon (Ray-casting)
const isPointInPolygon = (lat: number, lng: number, polygon: [number, number][]) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > lng) !== (yj > lng)) &&
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Distance from Point to Line Segment
const distToSegment = (p: {x:number, y:number}, v: {x:number, y:number}, w: {x:number, y:number}) => {
  const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
  if (l2 === 0) return Math.sqrt((p.x - v.x)**2 + (p.y - v.y)**2);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
  return Math.sqrt((p.x - proj.x)**2 + (p.y - proj.y)**2);
};

// --- CORE SERVICE ---

export const geofenceService = {
  subscribeToAlerts(cb: (alerts: SecurityAlert[]) => void) {
    listeners.push(cb);
    cb(activeAlerts);
    return () => { listeners = listeners.filter(l => l !== cb); };
  },

  addGeofence(gf: Geofence) {
    activeGeofences.push(gf);
  },

  removeGeofence(id: string) {
    activeGeofences = activeGeofences.filter(g => g.id !== id);
  },

  // Main Analysis Loop
  checkCompliance(session: TrackingSession, tripRoute?: [number, number][]) {
    const { lat, lng, accuracy } = session.currentLocation;
    
    // 1. Accuracy Gate (Prevent GPS Drift False Positives)
    if (accuracy > 50) return; // Skip if accuracy is too low

    const now = Date.now();

    // 2. CHECK GEOFENCES
    activeGeofences.filter(g => g.active).forEach(gf => {
      let isInside = false;

      if (gf.type === 'CIRCLE') {
        const center = gf.coordinates as [number, number];
        const dist = getDistanceMeters(lat, lng, center[0], center[1]);
        isInside = dist <= (gf.radius || 0);
      } else {
        // Simple mapping for point in poly (Note: coordinates usually [lat, lng])
        // Algorithm expects [x, y], mapping lat->x, lng->y is fine for topology check
        isInside = isPointInPolygon(lat, lng, gf.coordinates as [number, number][]);
      }

      // Handle Events
      const vehicleDwell = dwellTracker[session.vehicleId] || {};
      const enterTime = vehicleDwell[gf.id];

      if (isInside) {
        // ENTER EVENT
        if (!enterTime) {
          vehicleDwell[gf.id] = now;
          if (gf.triggers.includes('ENTER')) {
            this.createAlert({
              type: 'GEOFENCE_BREACH',
              severity: gf.severity,
              message: `ยานพาหนะเข้าสู่พื้นที่: ${gf.name}`,
              vehicleId: session.vehicleId,
              tripId: session.tripId,
              location: { lat, lng }
            });
          }
        } else {
          // DWELL EVENT
          const minutesInZone = (now - enterTime) / 60000;
          if (gf.triggers.includes('DWELL') && gf.dwellTimeMinutes && minutesInZone > gf.dwellTimeMinutes) {
             // Debounce: Alert only once every 10 mins for dwell
             const lastAlert = activeAlerts.find(a => 
               a.vehicleId === session.vehicleId && 
               a.type === 'DWELL_LIMIT' && 
               a.status === 'NEW' &&
               (Date.now() - new Date(a.timestamp).getTime() < 600000)
             );
             
             if (!lastAlert) {
                this.createAlert({
                  type: 'DWELL_LIMIT',
                  severity: 'HIGH',
                  message: `จอดค้างในพื้นที่ ${gf.name} เกิน ${gf.dwellTimeMinutes} นาที`,
                  vehicleId: session.vehicleId,
                  tripId: session.tripId,
                  location: { lat, lng }
                });
             }
          }
        }
      } else {
        // EXIT EVENT
        if (enterTime) {
          delete vehicleDwell[gf.id];
          if (gf.triggers.includes('EXIT')) {
            this.createAlert({
              type: 'GEOFENCE_BREACH',
              severity: 'LOW',
              message: `ยานพาหนะออกจากพื้นที่: ${gf.name}`,
              vehicleId: session.vehicleId,
              tripId: session.tripId,
              location: { lat, lng }
            });
          }
        }
      }
      dwellTracker[session.vehicleId] = vehicleDwell;
    });

    // 3. CHECK ROUTE DEVIATION
    if (tripRoute && tripRoute.length > 1) {
       // Convert to simpler Cartesian for short distance calculation (Spherical approximation)
       // 1 deg lat ~= 111km, 1 deg lng ~= 111km * cos(lat)
       const ky = 111000;
       const kx = Math.cos(lat * Math.PI / 180) * 111000;
       
       const p = { x: lng * kx, y: lat * ky };
       let minDistance = Infinity;

       for (let i = 0; i < tripRoute.length - 1; i++) {
          const v = { x: tripRoute[i][1] * kx, y: tripRoute[i][0] * ky };
          const w = { x: tripRoute[i+1][1] * kx, y: tripRoute[i+1][0] * ky };
          const d = distToSegment(p, v, w);
          if (d < minDistance) minDistance = d;
       }

       // Threshold (Default 500m)
       const threshold = 500; 
       
       if (minDistance > threshold) {
          // Debounce Route Alert (Avoid spamming every second)
          const lastRouteAlert = activeAlerts.find(a => 
             a.vehicleId === session.vehicleId && 
             a.type === 'ROUTE_DEVIATION' && 
             a.status === 'NEW'
          );

          if (!lastRouteAlert) {
             this.createAlert({
               type: 'ROUTE_DEVIATION',
               severity: 'MEDIUM',
               message: `ออกนอกเส้นทางกำหนด ${Math.round(minDistance)} เมตร`,
               vehicleId: session.vehicleId,
               tripId: session.tripId,
               location: { lat, lng },
               meta: { distance: minDistance }
             });
          }
       }
    }
  },

  createAlert(params: Omit<SecurityAlert, 'id' | 'timestamp' | 'status'>) {
    const newAlert: SecurityAlert = {
      id: `ALT-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      timestamp: new Date().toISOString(),
      status: 'NEW',
      ...params
    };
    activeAlerts = [newAlert, ...activeAlerts];
    listeners.forEach(cb => cb(activeAlerts));
    
    // Play Sound or Browser Notification here
    if (Notification.permission === 'granted' && newAlert.severity === 'HIGH') {
       new Notification('Security Alert', { body: newAlert.message });
    }
  },

  ackAlert(id: string) {
    activeAlerts = activeAlerts.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a);
    listeners.forEach(cb => cb(activeAlerts));
  },

  getAlerts() {
    return activeAlerts;
  },
  
  getGeofences() {
    return activeGeofences;
  }
};
