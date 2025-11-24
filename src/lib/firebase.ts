import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase configuration
// 🔥 สำคัญ: ต้องตั้งค่า Environment Variables ใน .env.local หรือ hosting platform
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// ตรวจสอบว่ามีการตั้งค่า Firebase config หรือไม่
if (!firebaseConfig.apiKey) {
  console.error("❌ Firebase configuration is missing. Please set up environment variables.");
  console.log("📝 Required environment variables:");
  console.log("   - VITE_FIREBASE_API_KEY");
  console.log("   - VITE_FIREBASE_AUTH_DOMAIN");
  console.log("   - VITE_FIREBASE_PROJECT_ID");
  console.log("   - VITE_FIREBASE_STORAGE_BUCKET");
  console.log("   - VITE_FIREBASE_MESSAGING_SENDER_ID");
  console.log("   - VITE_FIREBASE_APP_ID");
  console.log("\n📖 See FIREBASE_SETUP.md for more information.");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only if supported - for browser environment)
let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { analytics };

// Export app instance
export default app;



