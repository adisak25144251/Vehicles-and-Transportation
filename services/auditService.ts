
import { AuditLogEntry, AuditAction, User, Trip } from '../types';

// Mock Storage
const STORAGE_KEY = 'gov_audit_logs';

// Helper: Simple SHA-256 implementation using Web Crypto API
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const auditService = {
  
  async log(
    action: AuditAction, 
    actor: Partial<User> & { ip?: string, device?: string }, 
    targetId: string, 
    targetType: AuditLogEntry['targetType'], 
    details: string,
    diff?: { before: any, after: any }
  ) {
    const logs = this.getAll();
    const lastLog = logs.length > 0 ? logs[0] : null;
    
    // Construct Log Entry
    const newEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      actor: {
        id: actor.username || 'unknown',
        name: actor.fullName || 'Unknown Actor',
        role: actor.role || 'GUEST',
        ip: actor.ip || '127.0.0.1',
        device: actor.device || navigator.userAgent
      },
      action,
      targetId,
      targetType,
      details,
      diff,
      prevHash: lastLog?.hash || '0000000000000000000000000000000000000000000000000000000000000000'
    };

    // Calculate Hash for Integrity (Chain)
    const contentToHash = `${newEntry.id}|${newEntry.timestamp}|${newEntry.prevHash}|${JSON.stringify(newEntry.diff)}`;
    newEntry.hash = await sha256(contentToHash);

    // Save
    logs.unshift(newEntry); // Newest first
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    
    console.log(`[AUDIT] Logged: ${action} on ${targetType} by ${actor.fullName}`);
  },

  getAll(): AuditLogEntry[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  // --- EVIDENCE INTEGRITY ---

  // Generate a Digital Signature for a Trip
  async generateTripSignature(trip: Trip): Promise<string> {
    // We strictly define what fields constitute the "Truth" of a trip
    const criticalData = [
      trip.id,
      trip.missionName,
      trip.vehicleId,
      trip.driverName,
      trip.startTime,
      trip.endTime,
      trip.distanceKm.toFixed(2),
      // To hash the route, we sample points to avoid massive string (e.g., every 10th point) or hash the full JSON if feasible
      JSON.stringify(trip.routePath?.filter((_, i) => i % 5 === 0) || []) 
    ].join('|');

    return await sha256(criticalData);
  },

  // Verify if a trip has been tampered with
  async verifyTripIntegrity(trip: Trip): Promise<boolean> {
    if (!trip.integrityHash) return false; // Not signed yet
    const calculated = await this.generateTripSignature(trip);
    return calculated === trip.integrityHash;
  },

  // Mock: Export logs to CSV
  exportLogsToCSV() {
    const logs = this.getAll();
    const headers = ['Timestamp', 'Action', 'Actor', 'Role', 'Target Type', 'Target ID', 'Details', 'Hash'];
    const rows = logs.map(l => [
      l.timestamp,
      l.action,
      l.actor.name,
      l.actor.role,
      l.targetType,
      l.targetId,
      `"${l.details.replace(/"/g, '""')}"`,
      l.hash
    ]);
    
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_log_export_${Date.now()}.csv`);
    link.click();
  }
};
