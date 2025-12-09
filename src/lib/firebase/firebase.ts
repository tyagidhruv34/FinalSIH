// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase with performance optimizations
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with optimized settings
const db = getFirestore(app);

// Enable offline persistence for better performance (client-side only)
// Must be enabled immediately before any Firestore operations
if (typeof window !== 'undefined') {
  import('firebase/firestore').then(({ enableIndexedDbPersistence }) => {
    enableIndexedDbPersistence(db).catch((err: any) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab
        console.warn('Firestore persistence: Multiple tabs detected');
      } else if (err.code === 'unimplemented') {
        // Browser doesn't support persistence
        console.warn('Firestore persistence not available');
      } else if (err.code === 'unavailable') {
        // Persistence already enabled or Firestore already started
        // This is okay - just means persistence is already active
        console.warn('Firestore persistence already enabled or unavailable');
      } else {
        // Other errors - log but don't break the app
        console.warn('Firestore persistence error:', err.code);
      }
    });
  }).catch(() => {
    // If import fails, continue without persistence
    console.warn('Could not enable Firestore persistence');
  });
}

const storage = getStorage(app);

export default app;
export { db, storage };
