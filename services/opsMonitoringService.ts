
import { OpsAlert, OpsMetricType, OpsStats } from '../types';

// Ring Buffer for metrics
const LATENCY_BUFFER_SIZE = 100;
const latencyBuffer: number[] = [];
let errorCount = 0;
let requestCount = 0;
let ingestionCount = 0;
let lastIngestionCheck = Date.now();
let activeWebSockets = 0;
let opsAlerts: OpsAlert[] = [];

// Mock DB Limit
const DB_QUOTA_LIMIT = 50000; // reads/day
let currentDbUsage = 15000; // Simulated start

export const opsMonitoringService = {
  
  // Record API Latency
  recordLatency(ms: number) {
    latencyBuffer.push(ms);
    if (latencyBuffer.length > LATENCY_BUFFER_SIZE) {
      latencyBuffer.shift();
    }
    requestCount++;
    this.checkThresholds();
  },

  // Record Errors
  recordError() {
    errorCount++;
    requestCount++; // Count error as a request too
    this.checkThresholds();
  },

  // Record Telemetry Ingestion
  recordIngestion(points: number = 1) {
    ingestionCount += points;
    currentDbUsage += points; // Assume 1 point = 1 DB write
  },

  updateConnectionStatus(count: number) {
    activeWebSockets = count;
  },

  // Calculate Stats
  getStats(): OpsStats {
    // Latency P50/P95
    const sorted = [...latencyBuffer].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const max = sorted[sorted.length - 1] || 0;

    // Error Rate
    const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;

    // Throughput (Points per Sec)
    const now = Date.now();
    const durationSec = (now - lastIngestionCheck) / 1000;
    let throughput = 0;
    if (durationSec > 0) {
      throughput = ingestionCount / durationSec;
      // Reset counters periodically for rate calculation
      if (durationSec > 5) {
        ingestionCount = 0;
        lastIngestionCheck = now;
      }
    }

    return {
      apiLatency: { p50, p95, max },
      errorRate: parseFloat(errorRate.toFixed(2)),
      ingestionThroughput: parseFloat(throughput.toFixed(1)),
      activeConnections: activeWebSockets,
      batteryDrainAvg: 4.5, // Mocked % per hour
      dbQuotaUsage: parseFloat(((currentDbUsage / DB_QUOTA_LIMIT) * 100).toFixed(1))
    };
  },

  getAlerts(): OpsAlert[] {
    return opsAlerts;
  },

  // Internal Logic to Trigger Alerts
  checkThresholds() {
    const stats = this.getStats();
    const alerts: OpsAlert[] = [];

    // 1. Latency Alert
    if (stats.apiLatency.p95 > 2000) {
      alerts.push({
        id: 'ALT-LAT-' + Date.now(),
        severity: 'WARNING',
        message: `High API Latency (P95): ${stats.apiLatency.p95}ms`,
        timestamp: Date.now(),
        metric: 'API_LATENCY',
        value: stats.apiLatency.p95
      });
    }

    // 2. Error Rate Alert
    if (stats.errorRate > 5) { // > 5% error rate
      alerts.push({
        id: 'ALT-ERR-' + Date.now(),
        severity: 'CRITICAL',
        message: `High Error Rate: ${stats.errorRate}%`,
        timestamp: Date.now(),
        metric: 'ERROR_RATE',
        value: stats.errorRate
      });
    }

    // 3. DB Quota Alert
    if (stats.dbQuotaUsage > 80) {
      alerts.push({
        id: 'ALT-DB-' + Date.now(),
        severity: 'WARNING',
        message: `Firestore Quota Near Limit: ${stats.dbQuotaUsage}%`,
        timestamp: Date.now(),
        metric: 'INGESTION_RATE',
        value: stats.dbQuotaUsage
      });
    }

    // Dedup and merge alerts (keep last 10)
    alerts.forEach(newAlert => {
      const exists = opsAlerts.find(a => a.message === newAlert.message && Date.now() - a.timestamp < 60000);
      if (!exists) opsAlerts.unshift(newAlert);
    });
    
    if (opsAlerts.length > 20) opsAlerts = opsAlerts.slice(0, 20);
  }
};
