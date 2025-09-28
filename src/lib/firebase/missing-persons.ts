import { db, storage } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, query } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import type { MissingPerson } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export class MissingPersonService {
  private static reportsCollection = collection(db, 'missing_persons');

  // Upload image to Firebase Storage and return the URL
  static async uploadPhoto(photoDataUri: string, userId: string): Promise<string> {
    const storageRef = ref(storage, `missing-persons/${userId}/${uuidv4()}`);
    try {
      const snapshot = await uploadString(storageRef, photoDataUri, 'data_url');
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading photo: ", error);
      throw new Error("Failed to upload photo.");
    }
  }

  // Create a new missing person report
  static async createReport(reportData: Omit<MissingPerson, 'id' | 'timestamp'>): Promise<string> {
    try {
      const docRef = await addDoc(this.reportsCollection, {
        ...reportData,
        timestamp: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating missing person report: ", error);
      throw new Error("Failed to create report.");
    }
  }

  // Fetch all missing person reports
  static async getReports(): Promise<MissingPerson[]> {
    try {
      const q = query(this.reportsCollection);
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as MissingPerson));
      return reports;
    } catch (error) {
      console.error("Error fetching missing person reports: ", error);
      throw new Error("Failed to fetch reports.");
    }
  }
}
