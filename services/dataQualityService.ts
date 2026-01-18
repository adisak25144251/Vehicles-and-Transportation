
import { TelemetryPacket, QualityMetric } from '../types';

interface QualityContext {
  lastPacketTime: number;
  packets: TelemetryPacket[]; // Small buffer for jitter calc
  history: {
    totalPackets: number;
    dropoutEvents: number;
    maxDropout: number;
    accSum: number;
    buckets: { e: number; g: number; f: number; p: number };
  };
}

const sessionQualityContexts: Record<string, QualityContext> = {};

const DROPOUT_THRESHOLD_MS = 10000; // 10 seconds considered a dropout
const BUFFER_SIZE = 10;

export const dataQualityService = {
  
  analyze(sessionId: string, packet: TelemetryPacket): QualityMetric {
    let ctx = sessionQualityContexts[sessionId];
    if (!ctx) {
      ctx = {
        lastPacketTime: packet.timestamp,
        packets: [],
        history: {
          totalPackets: 0,
          dropoutEvents: 0,
          maxDropout: 0,
          accSum: 0,
          buckets: { e: 0, g: 0, f: 0, p: 0 }
        }
      };
      sessionQualityContexts[sessionId] = ctx;
    }

    const now = packet.timestamp;
    const timeDiff = now - ctx.lastPacketTime;

    // 1. Update History
    ctx.history.totalPackets++;
    ctx.history.accSum += packet.accuracy;

    // 2. Accuracy Bucket
    if (packet.accuracy <= 10) ctx.history.buckets.e++;
    else if (packet.accuracy <= 20) ctx.history.buckets.g++;
    else if (packet.accuracy <= 50) ctx.history.buckets.f++;
    else ctx.history.buckets.p++;

    // 3. Dropout Detection
    if (timeDiff > DROPOUT_THRESHOLD_MS && ctx.packets.length > 0) {
      ctx.history.dropoutEvents++;
      ctx.history.maxDropout = Math.max(ctx.history.maxDropout, timeDiff / 1000);
    }

    // 4. Buffer Management for Jitter
    ctx.packets.push(packet);
    if (ctx.packets.length > BUFFER_SIZE) ctx.packets.shift();

    // 5. Jitter Calculation (Variance of time intervals)
    let jitter = 0;
    if (ctx.packets.length > 2) {
      const intervals = [];
      for (let i = 1; i < ctx.packets.length; i++) {
        intervals.push(ctx.packets[i].timestamp - ctx.packets[i-1].timestamp);
      }
      const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
      jitter = Math.sqrt(variance);
    }

    // 6. Flag Detection
    const flags: QualityMetric['flags'] = [];
    if (timeDiff > DROPOUT_THRESHOLD_MS * 3) flags.push('SIGNAL_BLACKOUT');
    if (packet.accuracy > 50) flags.push('LOW_ACCURACY');
    if (jitter > 2000) flags.push('DEVICE_LAG');
    
    // Simple drift check: impossible speed > 200km/h with poor accuracy
    if (packet.speed > 200 && packet.accuracy > 20) flags.push('GPS_DRIFT');

    // 7. Score Calculation (0-100)
    // Base 100
    // - Accuracy Penalty: (Avg Accuracy - 10) * 0.5
    // - Dropout Penalty: Count * 5
    // - Jitter Penalty: Jitter(ms) / 1000 * 2
    const avgAcc = ctx.history.accSum / ctx.history.totalPackets;
    let score = 100;
    score -= Math.max(0, (avgAcc - 10) * 0.5);
    score -= ctx.history.dropoutEvents * 5;
    score -= (jitter / 1000) * 2;
    
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Update Context
    ctx.lastPacketTime = now;

    return {
      score,
      accuracyAvg: Number(avgAcc.toFixed(1)),
      dropoutCount: ctx.history.dropoutEvents,
      maxDropoutDuration: Math.round(ctx.history.maxDropout),
      jitter: Math.round(jitter),
      batteryTrend: 'STABLE', // Simplified for now
      lastNetworkType: packet.networkType || 'unknown',
      flags,
      accuracyDistribution: {
        excellent: ctx.history.buckets.e,
        good: ctx.history.buckets.g,
        fair: ctx.history.buckets.f,
        poor: ctx.history.buckets.p
      }
    };
  },

  // For debugging: Get poor quality points for map visualization
  getDriftHotspots(sessionId: string) {
    // In a real app, this would query a spatial DB. 
    // Here we return mock "bad spots" based on the session ID to simulate field debugging.
    return [
      { lat: 13.7580, lng: 100.5050, intensity: 0.8 }, // Near tall building
      { lat: 13.7600, lng: 100.5100, intensity: 0.5 }  // Underpass
    ];
  }
};
