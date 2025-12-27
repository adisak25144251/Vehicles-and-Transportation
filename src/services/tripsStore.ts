import { db } from "../firebase";
import {
  addDoc,
  collection,
  doc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

export type Trip = {
  id?: string;
  title: string;
  startAt: string; // ISO string
  endAt?: string;
  note?: string;
  createdAt?: unknown;
};

const tripsCol = (uid: string) => collection(db, "users", uid, "trips");

export async function addTrip(uid: string, data: Omit<Trip, "id" | "createdAt">) {
  return addDoc(tripsCol(uid), { ...data, createdAt: serverTimestamp() });
}

export async function updateTrip(uid: string, id: string, patch: Partial<Trip>) {
  return updateDoc(doc(db, "users", uid, "trips", id), patch);
}

export async function deleteTrip(uid: string, id: string) {
  return deleteDoc(doc(db, "users", uid, "trips", id));
}

export function subscribeTrips(uid: string, cb: (rows: Trip[]) => void) {
  const q = query(tripsCol(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Trip) })));
  });
}
