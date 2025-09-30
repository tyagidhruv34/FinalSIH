
import { db, storage } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import type { SurvivorStory } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export class SurvivorStoryService {
  private static storiesCollection = collection(db, 'survivor_stories');

  // Upload media to Firebase Storage and return the URL
  static async uploadMedia(mediaDataUri: string, userId: string): Promise<string> {
    const storageRef = ref(storage, `survivor-stories/${userId}/${uuidv4()}`);
    try {
      const snapshot = await uploadString(storageRef, mediaDataUri, 'data_url');
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading media: ", error);
      throw new Error("Failed to upload media.");
    }
  }

  // Create a new survivor story
  static async createStory(storyData: Omit<SurvivorStory, 'id' | 'timestamp'>): Promise<string> {
    try {
      const docRef = await addDoc(this.storiesCollection, {
        ...storyData,
        timestamp: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating survivor story: ", error);
      throw new Error("Failed to create story.");
    }
  }

  // Fetch recent survivor stories
  static async getStories(count: number = 20): Promise<SurvivorStory[]> {
    try {
      const q = query(this.storiesCollection, orderBy('timestamp', 'desc'), limit(count));
      const querySnapshot = await getDocs(q);
      const stories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as SurvivorStory));
      return stories;
    } catch (error) {
      console.error("Error fetching survivor stories: ", error);
      throw new Error("Failed to fetch stories.");
    }
  }
}
