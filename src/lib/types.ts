import type { LucideIcon } from "lucide-react";
import type { User as FirebaseUser } from 'firebase/auth';

export type Alert = {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  description: string;
  severity: "low" | "medium" | "high";
};

export type StatusUpdate = {
  id: string;
  userName: string;
  userAvatarUrl: string;
  timestamp: string;
  message: string;
};

export type Resource = {
  id: string;
  name: string;
  type: "Shelter" | "Hospital" | "Food & Water" | "Help Center";
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
  signInWithPhone: (phoneNumber: string) => Promise<any>;
  verifyOtp: (confirmationResult: any, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
};
