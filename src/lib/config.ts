// src/lib/config.ts

// IMPORTANT: Replace this with the actual Firebase UID of your admin users.
// You can find a user's UID in the Firebase Console under Authentication > Users.
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// IMPORTANT: Replace this with the actual Firebase UID of your admin users.
// You can find a user's UID in the Firebase Console under Authentication > Users.
export const ADMIN_USER_IDS = [
  'REPLACE_WITH_YOUR_ADMIN_USER_ID'
];

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8ODNtvz2hj3oJfUo37RELdXLi7u_3es4",
  authDomain: "studio-3943344881-ba365.firebaseapp.com",
  projectId: "studio-3943344881-ba365",
  storageBucket: "studio-3943344881-ba365.firebasestorage.app",
  messagingSenderId: "959280320369",
  appId: "1:959280320369:web:6e3736aefbf09d5a03b0d0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
