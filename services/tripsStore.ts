import { db } from "../firebase";
import type { Trip } from "../types";
import { collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";

export function subscribeTrips(uid: string, cb: (rows: Trip[]) => void) {
  const col = collection(db, "users", uid, "trips");
  return onSnapshot(col, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  });
}

export async function upsertTrip(uid: string, trip: Trip) {
  const id = trip.id || String(Date.now());
  await setDoc(doc(db, "users", uid, "trips", id), { ...trip, id }, { merge: true });
}

export async function removeTrip(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "trips", id));
}
