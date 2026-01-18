
import { TelemetryPacket, BehaviorEvent, BehaviorType, TrackingSession, DriverScoreProfile } from "../types";

// --- CONFIGURATION ---
const THRESHOLDS = {
  SPEED_LIMIT_KMH: 110, // Default limit
  HARSH_ACCEL_G: 0.3,   // approx 10.8 km/h/s
  HARSH_BRAKE_G: -0.3,
  HARSH_TURN_G: 0.4,
  MIN_SPEED_FOR_TURN_KMH: 15,
  GPS_ACCURACY_LIMIT_M: 20
};

const PENALTY_WEIGHTS = {
  SPEEDING: 20,
  HARSH_BRAKE: 10,
  HARSH_ACCEL: 5,
  HARSH_TURN: 10
};

// In-memory Event Store
let behaviorEvents: BehaviorEvent[] = [];
let sessionContexts: Record<string, { lastPacket: TelemetryPacket, speedingStartTime?: number }> = {};

// Mock Historical Data for Dashboard
const MOCK_DRIVER_SCORES: DriverScoreProfile[] = [
  {
    driverId: 'D-001',
    driverName: 'ส.ต.อ. มานะ (ตัวอย่าง)',
    totalDistanceKm: 1250,
    totalDurationHrs: 45,
    score: 92,
    grade: 'A',
    events: { speeding: 1, harshBrake: 3, harshAccel: 2, harshTurn: 0 },
    trend: [88, 90, 92, 91, 94, 93, 92]
  },
  {
    driverId: 'D-002',
    driverName: 'ร.ต.ท. สมชาย (ตัวอย่าง)',
    totalDistanceKm: 890,
    totalDurationHrs: 32,
    score: 74,
    grade: 'C',
    events: { speeding: 12, harshBrake: 8, harshAccel: 15, harshTurn: 4 },
    trend: [80, 78, 75, 76, 72, 70, 74]
  },
  {
    driverId: 'D-003',
    driverName: 'นาย วิชัย (พขร.)',
    totalDistanceKm: 2100,
    totalDurationHrs: 80,
    score: 85,
    grade: 'B',
    events: { speeding: 5, harshBrake: 5, harshAccel: 5, harshTurn: 1 },
    trend: [82, 84, 85, 85, 86, 84, 85]
  }
];

export const scoringService = {
  
  processTelemetry(sessionId: string, current: TelemetryPacket): BehaviorEvent | null {
    // 1. Data Quality Gate
    if (current.accuracy > THRESHOLDS.GPS_ACCURACY_LIMIT_M) return null;

    const context = sessionContexts[sessionId];
    if (!context) {
      sessionContexts[sessionId] = { lastPacket: current };
      return null;
    }

    const prev = context.lastPacket;
    const timeDelta = (current.timestamp - prev.timestamp) / 1000; // seconds
    if (timeDelta <= 0) return null;

    let detectedEvent: BehaviorEvent | null = null;

    // 2. SPEEDING CHECK
    // Logic: Must speed for > 5 seconds to trigger event (ignore overtaking bursts)
    const currentSpeedKmh = current.speed;
    if (currentSpeedKmh > THRESHOLDS.SPEED_LIMIT_KMH) {
      if (!context.speedingStartTime) {
        context.speedingStartTime = current.timestamp;
      } else if (current.timestamp - context.speedingStartTime > 5000) {
        // Trigger Event if sustained > 5s (and debounce: only trigger once per burst, or every X sec)
        // For simplicity, we trigger and reset start time to avoid spam, or we could track "in_speeding_state"
        // Here we just return event if it's the first time crossing the 5s threshold
        if (current.timestamp - context.speedingStartTime < 6000) { // Just crossed 5s
             detectedEvent = this.createEvent(sessionId, 'SPEEDING', currentSpeedKmh, THRESHOLDS.SPEED_LIMIT_KMH, current);
        }
      }
    } else {
      context.speedingStartTime = undefined;
    }

    // 3. HARSH BRAKE / ACCEL CHECK
    // Calculate G-Force: (Delta V m/s) / Delta T / 9.81
    const deltaV_ms = (current.speed - prev.speed) / 3.6;
    const gForceLong = deltaV_ms / timeDelta / 9.81;

    if (gForceLong > THRESHOLDS.HARSH_ACCEL_G) {
      detectedEvent = this.createEvent(sessionId, 'HARSH_ACCEL', gForceLong, THRESHOLDS.HARSH_ACCEL_G, current);
    } else if (gForceLong < THRESHOLDS.HARSH_BRAKE_G) {
      detectedEvent = this.createEvent(sessionId, 'HARSH_BRAKE', Math.abs(gForceLong), Math.abs(THRESHOLDS.HARSH_BRAKE_G), current);
    }

    // 4. HARSH TURN CHECK
    // Approximate lateral G: (v^2 / r) or v * (delta_heading / delta_t)
    // Using Heading change: LatG ~= (v_ms * delta_heading_rad) / delta_t / 9.81
    if (current.speed > THRESHOLDS.MIN_SPEED_FOR_TURN_KMH) {
      let deltaHeading = Math.abs(current.heading - prev.heading);
      if (deltaHeading > 180) deltaHeading = 360 - deltaHeading; // Shortest path
      
      const turnRateRad = (deltaHeading * Math.PI / 180) / timeDelta;
      const gForceLat = (current.speed / 3.6 * turnRateRad) / 9.81;

      if (gForceLat > THRESHOLDS.HARSH_TURN_G) {
         detectedEvent = this.createEvent(sessionId, 'HARSH_TURN', gForceLat, THRESHOLDS.HARSH_TURN_G, current);
      }
    }

    // Update Context
    sessionContexts[sessionId].lastPacket = current;

    if (detectedEvent) {
      behaviorEvents.push(detectedEvent);
    }

    return detectedEvent;
  },

  createEvent(sessionId: string, type: BehaviorType, value: number, threshold: number, loc: TelemetryPacket): BehaviorEvent {
    return {
      id: `BEV-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      sessionId,
      type,
      timestamp: loc.timestamp,
      value: Number(value.toFixed(2)),
      threshold,
      location: { lat: loc.lat, lng: loc.lng },
      severity: value > threshold * 1.5 ? 'HIGH' : 'MEDIUM'
    };
  },

  calculateSessionScore(sessionId: string, distanceKm: number): number {
    const events = behaviorEvents.filter(e => e.sessionId === sessionId);
    if (distanceKm < 1) return 100; // Too short to score

    let totalPenalty = 0;
    events.forEach(e => {
      totalPenalty += PENALTY_WEIGHTS[e.type];
    });

    // Normalize per 100km
    // Score = 100 - (Penalty per 100km)
    // Example: 20 penalty points in 10km -> 200 pts/100km -> Score -100 (Min 0)
    // Let's use a milder formula: Score = 100 - (Penalty / Distance * 10)
    
    // Formula: Deduct points directly but capped by distance factor
    // Adjusted: 100 - (TotalPenalty) for short trips? No, unfair.
    // Standard Fleet Formula: Events per 100km.
    // Let's say 20 penalty points per 100km is Acceptable (Score 80).
    // So PenaltyIndex = (TotalPenalty / DistanceKm) * 100
    // Score = max(0, 100 - PenaltyIndex)
    
    const penaltyIndex = (totalPenalty / distanceKm) * 10; // *10 scaling factor for sensitivity
    return Math.max(0, Math.round(100 - penaltyIndex));
  },

  // Mock Aggregation for Dashboard
  getAllDriverScores(): DriverScoreProfile[] {
    // In real app, calculate from DB
    return MOCK_DRIVER_SCORES;
  },

  getSessionEvents(sessionId: string) {
    return behaviorEvents.filter(e => e.sessionId === sessionId);
  }
};
