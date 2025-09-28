import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import type { Alert } from '@/lib/types';

// Service class for handling Firestore operations for alerts
export class AlertService {
  private static alertsCollection = collection(db, 'alerts');

  // Create a new alert in Firestore
  static async createAlert(alertData: Omit<Alert, 'id' | 'timestamp'>): Promise<string> {
    try {
      const docRef = await addDoc(this.alertsCollection, {
        ...alertData,
        timestamp: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating alert: ", error);
      throw new Error("Failed to create alert.");
    }
  }

  // Fetch all alerts from Firestore, ordered by timestamp
  static async getAlerts(): Promise<Alert[]> {
    try {
      const q = query(this.alertsCollection, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const alerts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Alert));
      return alerts;
    } catch (error) {
      console.error("Error fetching alerts: ", error);
      throw new Error("Failed to fetch alerts.");
    }
  }
}