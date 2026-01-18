
import { Incident, IncidentType, IncidentStatus } from '../types';

// In-memory Incident Store
let activeIncidents: Incident[] = [];
let listeners: ((incidents: Incident[]) => void)[] = [];

// --- MOCK CRASH DETECTION LOGIC ---
// In a real app, this would interface with DeviceMotion API or Native Modules
const CRASH_G_FORCE_THRESHOLD = 2.5; // G-Force threshold for crash

export const safetyService = {
  subscribe(cb: (incidents: Incident[]) => void) {
    listeners.push(cb);
    cb([...activeIncidents]);
    return () => { listeners = listeners.filter(l => l !== cb); };
  },

  reportIncident(incident: Omit<Incident, 'id' | 'status' | 'timestamp'>) {
    const newIncident: Incident = {
      id: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      status: 'REPORTED',
      ...incident
    };

    activeIncidents = [newIncident, ...activeIncidents];
    this.notify();
    
    // Simulate API Call
    console.log('[SAFETY] Incident Reported:', newIncident);
    
    // In production: Persist to local storage for offline support
    localStorage.setItem('gov_safety_buffer', JSON.stringify(activeIncidents));
  },

  updateIncidentStatus(id: string, status: IncidentStatus, resolverInfo?: { name: string, note: string }) {
    activeIncidents = activeIncidents.map(inc => {
      if (inc.id === id) {
        return {
          ...inc,
          status,
          ...(status === 'RESOLVED' && resolverInfo ? {
            resolverName: resolverInfo.name,
            resolutionNote: resolverInfo.note,
            resolutionTime: new Date().toISOString()
          } : {})
        };
      }
      return inc;
    });
    this.notify();
  },

  // Simulate a crash event (for testing purposes)
  simulateCrash(vehicleId: string, lat: number, lng: number) {
    const crashEvent: Omit<Incident, 'id' | 'status' | 'timestamp'> = {
      type: 'CRASH',
      severity: 'CRITICAL',
      vehicleId,
      driverName: 'ระบบตรวจจับอัตโนมัติ',
      location: { lat, lng, accuracy: 10 },
      description: 'ตรวจพบแรงกระแทกสูงเกินกำหนด (Simulated)',
      sensorData: {
        gForce: 3.8, // Simulated high G-force
        speed: 0
      }
    };
    this.reportIncident(crashEvent);
  },

  notify() {
    listeners.forEach(cb => cb([...activeIncidents]));
  },

  getActiveIncidents() {
    return activeIncidents;
  }
};
