import { auth } from "../firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";

const provider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) return signInWithRedirect(auth, provider);
  return signInWithPopup(auth, provider);
}

export function logout() {
  return signOut(auth);
}
