
import { LocalQueueItem, TelemetryPacket } from "../types";

// Database Constants
const DB_NAME = 'gov_fleet_db';
const DB_VERSION = 1;
const STORE_NAME = 'telemetry_queue';

let dbInstance: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Create store with 'id' as key path (sessionId_timestamp)
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        // Index for querying by status
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('sessionId', 'sessionId', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const offlineStorage = {
  async addItem(sessionId: string, packet: TelemetryPacket): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      const item: LocalQueueItem = {
        id: `${sessionId}_${packet.timestamp}`,
        sessionId,
        packet,
        status: 'PENDING',
        retryCount: 0,
        createdAt: Date.now()
      };

      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getPendingBatch(limit: number = 50): Promise<LocalQueueItem[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('status');
      
      // Get all PENDING items
      const request = index.getAll('PENDING', limit);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async deleteItems(ids: string[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      ids.forEach(id => store.delete(id));
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async countPending(): Promise<number> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.count('PENDING');
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
};
