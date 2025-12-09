
// src/lib/firebase/auth.ts
import { 
  getAuth, 
  onAuthStateChanged,
  GoogleAuthProvider, 
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import app, { db } from './firebase';
import type { UserProfile, UserType } from '@/lib/types';

export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export const createUserProfileDocument = async (user: User, additionalData: { displayName?: string; userType?: UserType } = {}) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { uid, email, photoURL, phoneNumber } = user;
    const createdAt = new Date();
    
    // Use displayName from additionalData if available (for email/pass signup)
    const displayName = additionalData.displayName || user.displayName;
    const userType = additionalData.userType || 'citizen'; // Default to citizen if not provided

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
            userType,
            createdAt,
        };
        await setDoc(userRef, userProfile);

    } catch (error) {
      console.error("Error creating user profile", error);
    }
  } else {
    // If user exists but userType is being updated
    if (additionalData.userType) {
      try {
        await setDoc(userRef, { userType: additionalData.userType }, { merge: true });
      } catch (error) {
        console.error("Error updating user type", error);
      }
    }
  }
  return userRef;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      return snapshot.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile", error);
    return null;
  }
};


export const signInWithGoogle = async (userType: UserType) => {
    const result = await signInWithPopup(auth, googleProvider);
    await createUserProfileDocument(result.user, { userType });
};

export const signUpWithEmail = async (email: string, password: string, displayName: string, userType: UserType) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await createUserProfileDocument(user, { displayName, userType });
};

export const signInWithEmail = async (email: string, password: string, userType: UserType) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    // Update user type if it's different (for existing users)
    await createUserProfileDocument(user, { userType });
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out', error);
  }
};
