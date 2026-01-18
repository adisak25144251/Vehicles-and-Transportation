
import { Trip, VehicleProfile, CostConfig, VehicleRequest, RequestStatus } from "../types";
import { db, isConfigValid } from "./firebaseConfig";
import { MOCK_TRIPS, MOCK_VEHICLES } from "../constants";
import { opsMonitoringService } from "./opsMonitoringService"; // Imported
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  query, 
  orderBy, 
  writeBatch
} from "firebase/firestore";

const COLLECTIONS = {
  TRIPS: 'trips',
  VEHICLES: 'vehicles',
  CONFIG: 'config',
  REQUESTS: 'vehicle_requests'
};

// Helper to remove undefined values which Firebase doesn't support
const cleanData = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};

// --- MOCK REQUEST DATA ---
const MOCK_REQUESTS: VehicleRequest[] = [
  {
    id: 'REQ-001',
    requesterName: 'ร.ต.อ. สมชาย (งานสืบสวน)',
    department: 'กองกำกับการ 1',
    mission: 'สืบสวนหาข่าวพื้นที่สีแดง',
    destination: 'อ.เมือง จ.ยะลา',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    endTime: new Date(Date.now() + 172800000).toISOString(),
    passengers: 4,
    status: RequestStatus.SUBMITTED,
    requestDate: new Date().toISOString()
  },
  {
    id: 'REQ-002',
    requesterName: 'นางสาว พรทิพย์ (ธุรการ)',
    department: 'งานบริหารงานทั่วไป',
    mission: 'ส่งเอกสารด่วนกรมบัญชีกลาง',
    destination: 'กทม.',
    startTime: new Date(Date.now() + 3600000).toISOString(),
    endTime: new Date(Date.now() + 18000000).toISOString(),
    passengers: 1,
    status: RequestStatus.APPROVED,
    approverName: 'พ.ต.ท. วิชัย',
    approvalDate: new Date().toISOString(),
    requestDate: new Date().toISOString()
  }
];

// Helper to measure latency
const withMonitoring = async <T>(operationName: string, fn: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    opsMonitoringService.recordLatency(duration);
    return result;
  } catch (error) {
    opsMonitoringService.recordError();
    console.error(`API Error [${operationName}]:`, error);
    throw error;
  }
};

export const tripService = {
  async getAll(): Promise<Trip[]> {
    return withMonitoring('tripService.getAll', async () => {
      if (!isConfigValid || !db) {
        const saved = localStorage.getItem('bpp_trips_data');
        return saved ? JSON.parse(saved) : MOCK_TRIPS;
      }
      try {
        const q = query(collection(db, COLLECTIONS.TRIPS), orderBy("startTime", "desc"));
        const querySnapshot = await getDocs(q);
        const trips: Trip[] = [];
        querySnapshot.forEach((doc) => {
          trips.push(doc.data() as Trip);
        });
        return trips.length > 0 ? trips : MOCK_TRIPS;
      } catch (error) {
        const saved = localStorage.getItem('bpp_trips_data');
        return saved ? JSON.parse(saved) : MOCK_TRIPS;
      }
    });
  },

  async save(trips: Trip[]): Promise<void> {
    return withMonitoring('tripService.save', async () => {
      localStorage.setItem('bpp_trips_data', JSON.stringify(trips));
      if (!isConfigValid || !db) return;
      try {
        const batch = writeBatch(db);
        trips.forEach(trip => {
          const tripRef = doc(db, COLLECTIONS.TRIPS, trip.id);
          batch.set(tripRef, cleanData(trip));
        });
        await batch.commit();
      } catch (error) {
        throw error;
      }
    });
  }
};

export const vehicleService = {
  async getAll(): Promise<VehicleProfile[]> {
    return withMonitoring('vehicleService.getAll', async () => {
      if (!isConfigValid || !db) {
        const saved = localStorage.getItem('bpp_vehicles_data');
        return saved ? JSON.parse(saved) : MOCK_VEHICLES;
      }
      try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.VEHICLES));
        const vehicles: VehicleProfile[] = [];
        querySnapshot.forEach((doc) => {
          vehicles.push(doc.data() as VehicleProfile);
        });
        return vehicles.length > 0 ? vehicles : MOCK_VEHICLES;
      } catch (error) {
        const saved = localStorage.getItem('bpp_vehicles_data');
        return saved ? JSON.parse(saved) : MOCK_VEHICLES;
      }
    });
  },

  async save(vehicles: VehicleProfile[]): Promise<void> {
    return withMonitoring('vehicleService.save', async () => {
      localStorage.setItem('bpp_vehicles_data', JSON.stringify(vehicles));
      if (!isConfigValid || !db) return;
      try {
        const batch = writeBatch(db);
        vehicles.forEach(v => {
          const ref = doc(db, COLLECTIONS.VEHICLES, v.id);
          batch.set(ref, cleanData(v));
        });
        await batch.commit();
      } catch (error) { throw error; }
    });
  }
};

export const configService = {
  async get(): Promise<CostConfig | null> {
    return withMonitoring('configService.get', async () => {
      const saved = localStorage.getItem('bpp_cost_config');
      const localConfig = saved ? JSON.parse(saved) : null;
      if (!isConfigValid || !db) return localConfig;
      try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.CONFIG));
        if (!querySnapshot.empty) return querySnapshot.docs[0].data() as CostConfig;
        return localConfig;
      } catch { return localConfig; }
    });
  },
  async save(config: CostConfig): Promise<void> {
    return withMonitoring('configService.save', async () => {
      localStorage.setItem('bpp_cost_config', JSON.stringify(config));
      if (!isConfigValid || !db) return;
      try { await setDoc(doc(db, COLLECTIONS.CONFIG, 'global_settings'), cleanData(config)); } catch { throw new Error('Save failed'); }
    });
  }
};

// --- NEW REQUEST SERVICE ---
export const requestService = {
  async getAll(): Promise<VehicleRequest[]> {
    return withMonitoring('requestService.getAll', async () => {
      const saved = localStorage.getItem('bpp_requests_data');
      return saved ? JSON.parse(saved) : MOCK_REQUESTS;
    });
  },

  async save(requests: VehicleRequest[]): Promise<void> {
    return withMonitoring('requestService.save', async () => {
      localStorage.setItem('bpp_requests_data', JSON.stringify(requests));
    });
  },

  async create(req: Omit<VehicleRequest, 'id' | 'status' | 'requestDate'>): Promise<VehicleRequest> {
    return withMonitoring('requestService.create', async () => {
      const newReq: VehicleRequest = {
        id: `REQ-${Date.now().toString().slice(-6)}`,
        status: RequestStatus.SUBMITTED,
        requestDate: new Date().toISOString(),
        ...req
      };
      const current = await this.getAll();
      await this.save([newReq, ...current]);
      return newReq;
    });
  },

  async updateStatus(id: string, status: RequestStatus, extraData: Partial<VehicleRequest> = {}): Promise<void> {
    return withMonitoring('requestService.updateStatus', async () => {
      const current = await this.getAll();
      const updated = current.map(r => r.id === id ? { ...r, status, ...extraData } : r);
      await this.save(updated);
    });
  }
};
