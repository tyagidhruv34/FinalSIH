import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, setDoc, where } from 'firebase/firestore';

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  type: string;
  location: string;
  issuedBy: string;
  validUntil: string;
  timestamp: string;
  source: 'IMD' | 'OpenMeteo' | 'WeatherAPI';
  syncedAt?: any;
  temperature?: number;
  precipitation?: number;
  windSpeed?: number;
}

export interface NDMAAlert {
  id: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  category: string;
  affectedStates: string[];
  issuedBy: string;
  issuedDate: string;
  validUntil?: string;
  link?: string;
  source: 'NDMA';
  syncedAt?: any;
}

export class AdvisoryService {
  private static weatherAlertsCollection = collection(db, 'weather_alerts');
  private static ndmaAlertsCollection = collection(db, 'ndma_alerts');

  // Sync weather alerts to Firestore
  static async syncWeatherAlerts(alerts: WeatherAlert[]): Promise<void> {
    try {
      const batch = [];
      for (const alert of alerts) {
        const docRef = doc(this.weatherAlertsCollection, alert.id);
        batch.push(
          setDoc(docRef, {
            ...alert,
            syncedAt: serverTimestamp(),
          }, { merge: true })
        );
      }
      await Promise.all(batch);
    } catch (error) {
      console.error('Error syncing weather alerts:', error);
      throw error;
    }
  }

  // Sync NDMA alerts to Firestore
  static async syncNDMAAlerts(alerts: NDMAAlert[]): Promise<void> {
    try {
      const batch = [];
      for (const alert of alerts) {
        const docRef = doc(this.ndmaAlertsCollection, alert.id);
        batch.push(
          setDoc(docRef, {
            ...alert,
            syncedAt: serverTimestamp(),
          }, { merge: true })
        );
      }
      await Promise.all(batch);
    } catch (error) {
      console.error('Error syncing NDMA alerts:', error);
      throw error;
    }
  }

  // Get weather alerts from Firestore
  static async getWeatherAlerts(limitCount: number = 50): Promise<WeatherAlert[]> {
    try {
      // Fetch all documents without orderBy to avoid index requirements
      // This works even if collection is empty or index doesn't exist
      const querySnapshot = await getDocs(this.weatherAlertsCollection);
      const alerts = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as WeatherAlert))
        .sort((a, b) => {
          // Sort by timestamp in memory (newest first)
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeB - timeA;
        })
        .slice(0, limitCount);
      return alerts;
    } catch (error: any) {
      // If permission denied, return empty array
      if (error.code === 'permission-denied') {
        console.warn('Permission denied for weather alerts. User may not be authenticated.');
        return [];
      }
      console.error('Error fetching weather alerts:', error);
      return []; // Return empty array on error
    }
  }

  // Get NDMA alerts from Firestore
  static async getNDMAAlerts(limitCount: number = 50): Promise<NDMAAlert[]> {
    try {
      // Fetch all documents without orderBy to avoid index requirements
      // This works even if collection is empty or index doesn't exist
      const querySnapshot = await getDocs(this.ndmaAlertsCollection);
      const alerts = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as NDMAAlert))
        .sort((a, b) => {
          // Sort by issuedDate in memory (newest first)
          const timeA = a.issuedDate ? new Date(a.issuedDate).getTime() : 0;
          const timeB = b.issuedDate ? new Date(b.issuedDate).getTime() : 0;
          return timeB - timeA;
        })
        .slice(0, limitCount);
      return alerts;
    } catch (error: any) {
      // If permission denied, return empty array
      if (error.code === 'permission-denied') {
        console.warn('Permission denied for NDMA alerts. User may not be authenticated.');
        return [];
      }
      console.error('Error fetching NDMA alerts:', error);
      return []; // Return empty array on error
    }
  }
}
