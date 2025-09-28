// src/lib/firebase/auth.ts
import { 
  getAuth, 
  onAuthStateChanged,
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import app, { db } from './firebase';
import type { UserProfile } from '@/lib/types';

export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export const createUserProfileDocument = async (user: User) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { uid, email, displayName, photoURL, phoneNumber } = user;
    const createdAt = new Date();
    
    const userProfile: UserProfile = {
      uid,
      email,
      displayName,
      photoURL,
      phoneNumber,
      createdAt,
    };

    try {
      await setDoc(userRef, userProfile);
    } catch (error) {
      console.error("Error creating user profile", error);
    }
  }
  return userRef;
};


export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await createUserProfileDocument(result.user);
  } catch (error) {
    console.error('Error signing in with Google', error);
  }
};

export const signInWithPhone = async (phoneNumber: string, verifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
    return signInWithPhoneNumber(auth, phoneNumber, verifier);
};

export const verifyOtp = async (confirmationResult: ConfirmationResult, otp: string) => {
    const result = await confirmationResult.confirm(otp);
    await createUserProfileDocument(result.user);
};


export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out', error);
  }
};

export const onAuthUserChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
