
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// Config สำหรับเชื่อมต่อ Firebase
// ในการใช้งานจริง (Production) ควรย้ายค่าเหล่านี้ไปไว้ใน Environment Variables
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // ใส่ API Key ของคุณที่นี่
  authDomain: "bpp-fleet.firebaseapp.com",
  projectId: "bpp-fleet",
  storageBucket: "bpp-fleet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// ตรวจสอบว่าเป็น Config ตัวอย่างหรือไม่?
export const isConfigValid = firebaseConfig.apiKey !== "YOUR_API_KEY";

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

if (isConfigValid) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
  } catch (e) {
    console.warn("Firebase initialization failed:", e);
  }
} else {
  console.info("⚠️ Running in DEMO MODE (Offline). Firebase connection disabled due to placeholder config.");
}

export { app, db };
