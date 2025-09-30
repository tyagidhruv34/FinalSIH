

import type { LucideIcon } from "lucide-react";
import type { User as FirebaseUser } from 'firebase/auth';
import type { GeoPoint, Timestamp } from "firebase/firestore";
import type { AssessDamageOutput } from "@/ai/flows/assess-damage-flow";

export type Alert = {
  id: string;
  title: string;
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  affectedAreas: string[];
  type: "Cyclone" | "Flood" | "Earthquake" | "Fire" | "Other";
  timestamp: Timestamp;
  createdBy: string;
  acknowledged?: boolean;
  rescueStatus?: 'Dispatched' | 'In Progress' | 'Completed' | null;
  rescueTeam?: string;
  eta?: string;
};

export type StatusUpdate = {
  id: string;
  userName: string;
  userAvatarUrl: string;
  timestamp: string;
  message: string;
};

export type UserStatus = {
    id: string;
    userId: string;
    userName: string;
    userAvatarUrl?: string;
    status: 'safe' | 'help';
    location?: GeoPoint;
    timestamp: Timestamp;
};

export type ResourceNeed = {
    id?: string;
    userId: string;
    item: 'Food' | 'Water' | 'Medicine' | 'Shelter';
    quantity: number;
    urgency: 'Low' | 'Medium' | 'High';
    location: GeoPoint | null;
    contactInfo: string;
    fulfilled: boolean;
    timestamp: any; // Using 'any' for serverTimestamp compatibility
}

export type ResourceOffer = {
    id: string;
    userId: string;
    item: 'Food' | 'Water' | 'Medicine' | 'Shelter';
    quantity: number;
    location: GeoPoint;
    contactInfo: string;
    timestamp: Timestamp;
}

export type DamageReport = {
    id?: string;
    userId: string;
    description: string;
    imageUrl: string;
    location?: GeoPoint;
    assessment: AssessDamageOutput;
    timestamp: any;
}

export type MissingPerson = {
    id?: string;
    reportedBy: string;
    name: string;
    age: number;
    lastSeenLocation: string;
    contactInfo: string;
    photoUrl: string; // URL from Firebase Storage
    faceEmbedding: number[];
    timestamp: any;
}

export type Feedback = {
    id?: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: any;
}

export type SurvivorStory = {
    id?: string;
    userId: string;
    userName: string;
    userAvatarUrl?: string;
    title: string;
    story: string;
    mediaUrl?: string; // For now, one image. Can be extended to an array.
    heroName?: string;
    heroContact?: string;
    timestamp: any;
}


export type Resource = {
  id: string;
  name: string;
  type: "Shelter" | "Hospital" | "Food & Water" | "Help Center" | "Hotel";
  address: string;
  position: { lat: number; lng: number };
  icon: string;
};

export type EmergencyContact = {
  id:string;
  name: string;
  description: string;
  phone: string;
  icon: string;
};

export type AlertSource = {
  id: string;
  name: string;
  description: string;
};

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  createdAt: Date;
}

export type AuthContextType = {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};
