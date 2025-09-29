import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Feedback } from '@/lib/types';

// Service class for handling Firestore operations for feedback
export class FeedbackService {
  private static feedbackCollection = collection(db, 'feedback');

  // Submit new feedback to Firestore
  static async submitFeedback(feedbackData: Omit<Feedback, 'id' | 'timestamp'>): Promise<string> {
    try {
      const docRef = await addDoc(this.feedbackCollection, {
        ...feedbackData,
        timestamp: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error submitting feedback: ", error);
      throw new Error("Failed to submit feedback.");
    }
  }
}
