
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
