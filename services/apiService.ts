
import { Trip, VehicleProfile, CostConfig } from "../types";
import { db } from "./firebaseConfig";
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
  CONFIG: 'config'
};

// Helper to remove undefined values which Firebase doesn't support
const cleanData = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};

export const tripService = {
  async getAll(): Promise<Trip[]> {
    try {
      const q = query(collection(db, COLLECTIONS.TRIPS), orderBy("startTime", "desc"));
      const querySnapshot = await getDocs(q);
      const trips: Trip[] = [];
      querySnapshot.forEach((doc) => {
        trips.push(doc.data() as Trip);
      });
      return trips;
    } catch (error) {
      console.warn("Firestore access failed (Offline or Config missing), using LocalStorage fallback.");
      const saved = localStorage.getItem('bpp_trips_data');
      return saved ? JSON.parse(saved) : [];
    }
  },

  async save(trips: Trip[]): Promise<void> {
    try {
      // Use batch for better performance and atomicity
      const batch = writeBatch(db);
      trips.forEach(trip => {
        const tripRef = doc(db, COLLECTIONS.TRIPS, trip.id);
        batch.set(tripRef, cleanData(trip));
      });
      await batch.commit();
    } catch (error) {
      console.error("Cloud save failed, saving locally:", error);
      localStorage.setItem('bpp_trips_data', JSON.stringify(trips));
    }
  }
};

export const vehicleService = {
  async getAll(): Promise<VehicleProfile[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.VEHICLES));
      const vehicles: VehicleProfile[] = [];
      querySnapshot.forEach((doc) => {
        vehicles.push(doc.data() as VehicleProfile);
      });
      return vehicles;
    } catch (error) {
      const saved = localStorage.getItem('bpp_vehicles_data');
      return saved ? JSON.parse(saved) : [];
    }
  },

  async save(vehicles: VehicleProfile[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      vehicles.forEach(v => {
        const ref = doc(db, COLLECTIONS.VEHICLES, v.id);
        batch.set(ref, cleanData(v));
      });
      await batch.commit();
    } catch (error) {
      localStorage.setItem('bpp_vehicles_data', JSON.stringify(vehicles));
    }
  }
};

export const configService = {
  async get(): Promise<CostConfig | null> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.CONFIG));
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as CostConfig;
      }
      return null;
    } catch {
      const saved = localStorage.getItem('bpp_cost_config');
      return saved ? JSON.parse(saved) : null;
    }
  },
  async save(config: CostConfig): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.CONFIG, 'global_settings'), cleanData(config));
    } catch {
      localStorage.setItem('bpp_cost_config', JSON.stringify(config));
    }
  }
};
