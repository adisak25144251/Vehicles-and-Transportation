
import { PrivacyLevel, UserRole, DataRetentionPolicy, TrackingSession, Location } from '../types';

// Constants
const REDACTION_DECIMAL_PLACES = 2; // approx 1.1km precision
const TIME_DELAY_MINUTES = 5;

// Mock Persistence
let currentRetentionPolicy: DataRetentionPolicy = {
  rawTelemetryDays: 30,
  aggregatedStatsDays: 365,
  incidentLogsDays: 180,
  autoDelete: true
};

export const privacyService = {
  
  getRetentionPolicy(): DataRetentionPolicy {
    const saved = localStorage.getItem('gov_retention_policy');
    if (saved) return JSON.parse(saved);
    return currentRetentionPolicy;
  },

  updateRetentionPolicy(policy: DataRetentionPolicy) {
    currentRetentionPolicy = policy;
    localStorage.setItem('gov_retention_policy', JSON.stringify(policy));
  },

  // --- Visibility Logic ---
  
  // Check if a role can access full data for a given privacy level
  canAccessFullData(role: UserRole, level: PrivacyLevel): boolean {
    if (role === UserRole.ADMIN || role === UserRole.AUDITOR) return true;
    if (role === UserRole.DRIVER) return true; // Driver sees their own data
    
    if (level === 'SECRET') return false; // Only Admin/Auditor see secret
    if (level === 'SENSITIVE') return role === UserRole.MANAGER || role === UserRole.DISPATCHER;
    
    return true; // STANDARD
  },

  // --- Redaction Engine ---

  applyPrivacyToSession(session: TrackingSession, viewerRole: UserRole): TrackingSession {
    // Clone to avoid mutating original state
    const redacted = JSON.parse(JSON.stringify(session)) as TrackingSession;
    const level = session.privacyLevel || 'STANDARD';

    // 1. Secret Mission: Redact almost everything for unauthorized
    if (level === 'SECRET' && !this.canAccessFullData(viewerRole, 'SECRET')) {
      redacted.currentLocation = { lat: 0, lng: 0, speed: 0, heading: 0, accuracy: 0 };
      redacted.pathHistory = [];
      redacted.mission = "CLASSIFIED MISSION";
      redacted.destination = "RESTRICTED";
      redacted.origin = "RESTRICTED";
      return redacted;
    }

    // 2. Sensitive Mission: Fuzz Location & Mask Name
    if (level === 'SENSITIVE' && !this.canAccessFullData(viewerRole, 'SENSITIVE')) {
      // Fuzz Coordinates
      redacted.currentLocation.lat = this.fuzzCoordinate(redacted.currentLocation.lat);
      redacted.currentLocation.lng = this.fuzzCoordinate(redacted.currentLocation.lng);
      redacted.pathHistory = []; // Hide detailed path
      
      // Mask Driver Name
      redacted.driverName = this.maskString(redacted.driverName);
    }

    return redacted;
  },

  fuzzCoordinate(coord: number): number {
    const factor = Math.pow(10, REDACTION_DECIMAL_PLACES);
    return Math.floor(coord * factor) / factor;
  },

  maskString(str: string): string {
    if (!str || str.length < 4) return '***';
    return str.substring(0, 3) + '****';
  },

  // --- Lifecycle Simulation ---
  
  // Simulate cleanup job (would run on backend)
  runRetentionCleanup(trips: any[]) {
    const now = new Date();
    const policy = this.getRetentionPolicy();
    
    return trips.filter(t => {
      const tripDate = new Date(t.startTime);
      const diffDays = (now.getTime() - tripDate.getTime()) / (1000 * 3600 * 24);
      
      if (diffDays > policy.rawTelemetryDays) {
        // In real app: Delete 'routePath' and 'telemetry' collections
        if (t.routePath) t.routePath = []; // Clear path
      }
      
      if (diffDays > policy.aggregatedStatsDays && policy.autoDelete) {
        return false; // Remove trip entirely
      }
      return true;
    });
  }
};
