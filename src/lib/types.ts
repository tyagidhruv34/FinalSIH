

import type { LucideIcon } from "lucide-react";
import type { User as FirebaseUser, ConfirmationResult, RecaptchaVerifier, Timestamp } from 'firebase/auth';
import type { GeoPoint } from "firebase/firestore";

export type Alert = {
  id: string;
  title: string;
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  affectedAreas: string[];
  type: "Cyclone" | "Flood" | "Earthquake" | "Fire" | "Other";
  timestamp: Timestamp;
  createdBy: string;
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
    location: GeoPoint;
    timestamp: Timestamp;
};

export type ResourceNeed = {
    id: string;
    userId: string;
    item: 'Food' | 'Water' | 'Medicine' | 'Shelter';
    quantity: number;
    urgency: 'Low' | 'Medium' | 'High';
    location: GeoPoint;
    contactInfo: string;
    fulfilled: boolean;
    timestamp: Timestamp;
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
  signInWithPhone: (phoneNumber: string, verifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyOtp: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
};
