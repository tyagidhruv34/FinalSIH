import type { LucideIcon } from "lucide-react";

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
