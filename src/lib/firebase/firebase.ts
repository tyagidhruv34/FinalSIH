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

// Only initialize Firebase if we have valid config (prevents build-time errors)
let app: any = null;
let db: any = null;
let storage: any = null;

if (
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
) {
  try {
    // Initialize Firebase with performance optimizations
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    
    // Initialize Firestore with optimized settings
    db = getFirestore(app);
    
    // Initialize Storage
    storage = getStorage(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    // Continue without Firebase - app will work but Firebase features won't
  }
} else {
  console.warn('Firebase environment variables not set. Firebase features will be disabled.');
}

// Enable offline persistence for better performance (client-side only)
// Must be enabled immediately before any Firestore operations
if (typeof window !== 'undefined' && db) {
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

export default app;
export { db, storage };
