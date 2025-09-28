import { db } from './firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import type { UserStatus } from '@/lib/types';

const userStatusCollection = collection(db, 'user_status');

export const updateUserStatus = async (statusData: Omit<UserStatus, 'id'>) => {
    try {
        // Use the user's UID as the document ID to ensure one status per user
        const statusDocRef = doc(userStatusCollection, statusData.userId);
        await setDoc(statusDocRef, statusData, { merge: true });
        return statusData.userId;
    } catch (error) {
        console.error("Error updating user status: ", error);
        throw new Error("Failed to update user status.");
    }
}
