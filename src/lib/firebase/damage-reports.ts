import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import type { DamageReport } from '@/lib/types';

// Service class for handling Firestore operations for damage reports
export class DamageReportService {
  private static reportsCollection = collection(db, 'damage_reports');

  // Create a new damage report in Firestore
  static async createDamageReport(reportData: Omit<DamageReport, 'id' | 'timestamp'>): Promise<string> {
    try {
      const docRef = await addDoc(this.reportsCollection, {
        ...reportData,
        timestamp: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating damage report: ", error);
      throw new Error("Failed to create damage report.");
    }
  }

  // Fetch all damage reports from Firestore, ordered by timestamp
  static async getDamageReports(): Promise<DamageReport[]> {
    try {
      const q = query(this.reportsCollection, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as DamageReport));
      return reports;
    } catch (error) {
      console.error("Error fetching damage reports: ", error);
      throw new Error("Failed to fetch damage reports.");
    }
  }
}

    