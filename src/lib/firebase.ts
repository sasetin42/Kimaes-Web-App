// Firebase App, Firestore, and Authentication initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';

// Environment variables with exact user Firebase project fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDQyvtup6By3rIpK4ymyNOcEHoSjBclnNE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "kimae-s-web-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "kimae-s-web-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "kimae-s-web-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "116986834615",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:116986834615:web:1d8521aa2b75371f036732",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-TNN6WNM9RL"
};

// Initialize Firebase once
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore with multi-tab offline persistence enabled
export const db = (() => {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch {
    // If already initialized, fetch default instance
    return getFirestore(app);
  }
})();

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey
);
