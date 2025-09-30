// src/lib/firebase/auth.ts
import { 
  getAuth, 
  onAuthStateChanged,
  GoogleAuthProvider, 
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut as firebaseSignOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import app, { db } from './firebase';
import type { UserProfile } from '@/lib/types';

export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export const createUserProfileDocument = async (user: User, additionalData: { displayName?: string } = {}) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { uid, email, photoURL, phoneNumber } = user;
    const createdAt = new Date();
    
    // Use displayName from additionalData if available (for email/pass signup)
    const displayName = additionalData.displayName || user.displayName;

    try {
        // If a display name was provided, update the user's auth profile first
        if (displayName && !user.displayName) {
            await updateProfile(user, { displayName });
        }
        
        // Now create the document in firestore
        const userProfile: UserProfile = {
            uid,
            email,
            displayName,
            photoURL,
            phoneNumber,
            createdAt,
        };
        await setDoc(userRef, userProfile);

    } catch (error) {
      console.error("Error creating user profile", error);
    }
  }
  return userRef;
};


export const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await createUserProfileDocument(result.user);
};

export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await createUserProfileDocument(user, { displayName });
};

export const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
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

// New function to handle redirect result
export const handleRedirectResult = async () => {
    try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
            await createUserProfileDocument(result.user);
        }
    } catch (error) {
        console.error("Error handling redirect result", error);
    }
}
