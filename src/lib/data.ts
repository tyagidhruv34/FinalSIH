import type { Alert, StatusUpdate, Resource, EmergencyContact, AlertSource } from "./types";
import { Shield, Home, Stethoscope, Utensils, Siren, Globe, Building } from "lucide-react";

export const alerts: Alert[] = [
  {
    id: "alert-1",
    title: "Cyclone Warning",
    source: "National Weather Service",
    timestamp: "2 hours ago",
    description: "A severe cyclone is expected to make landfall tomorrow morning. Evacuate low-lying areas.",
    severity: "high",
  },
  {
    id: "alert-2",
    title: "Flash Flood Watch",
    source: "Local Authorities",
    timestamp: "5 hours ago",
    description: "Heavy rainfall may cause flash floods in urban areas. Avoid unnecessary travel.",
    severity: "medium",
  },
  {
    id: "alert-3",
    title: "Power Outage Update",
    source: "City Electric",
    timestamp: "1 hour ago",
    description: "Power restoration efforts are underway. Expected to be resolved by 8 PM.",
    severity: "low",
  },
];

export const statusUpdates: StatusUpdate[] = [
  {
    id: "status-1",
    userName: "Ravi Kumar",
    userAvatarUrl: "https://picsum.photos/seed/avatar1/40/40",
    timestamp: "15 minutes ago",
    message: "I'm safe with my family at home. Water levels are rising slowly in our area.",
  },
  {
    id: "status-2",
    userName: "Priya Sharma",
    userAvatarUrl: "https://picsum.photos/seed/avatar2/40/40",
    timestamp: "30 minutes ago",
    message: "Stuck in traffic near the city center. The roads are completely flooded. Please advise alternate routes.",
  },
  {
    id: "status-3",
    userName: "Amit Singh",
    userAvatarUrl: "https://picsum.photos/seed/avatar3/40/40",
    timestamp: "1 hour ago",
    message: "We've taken shelter at the community hall. It's crowded but we are safe. Need food and water.",
  },
  {
    id: "status-4",
    userName: "Sunita Devi",
    userAvatarUrl: "https://picsum.photos/seed/avatar4/40/40",
    timestamp: "3 hours ago",
    message: "Does anyone have information about the Sector 5 area? My parents are there and I can't reach them.",
  },
];

export const resources: Resource[] = [
  {
    id: "res-1",
    name: "Community Shelter",
    type: "Shelter",
    address: "123, Main Road, New Delhi",
    position: { lat: 28.6139, lng: 77.2090 },
    icon: Home,
  },
  {
    id: "res-2",
    name: "City General Hospital",
    type: "Hospital",
    address: "456, Health Ave, New Delhi",
    position: { lat: 28.6330, lng: 77.2167 },
    icon: Stethoscope,
  },
  {
    id: "res-3",
    name: "Emergency Food Distribution",
    type: "Food & Water",
    address: "789, Park Street, New Delhi",
    position: { lat: 28.6200, lng: 77.2300 },
    icon: Utensils,
  },
   {
    id: "res-4",
    name: "Central Help Center",
    type: "Help Center",
    address: "101, Civic Center, New Delhi",
    position: { lat: 28.6000, lng: 77.2000 },
    icon: Shield,
  },
];

export const emergencyContacts: EmergencyContact[] = [
    {
        id: 'contact-1',
        name: 'National Disaster Response Force (NDRF)',
        description: 'Primary agency for specialized response to natural and man-made disasters.',
        phone: '1078',
        icon: Shield
    },
    {
        id: 'contact-2',
        name: 'Police',
        description: 'For law and order, and immediate on-ground assistance.',
        phone: '100',
        icon: Siren
    },
    {
        id: 'contact-3',
        name: 'Ambulance / Medical Help',
        description: 'For medical emergencies and first aid.',
        phone: '102',
        icon: Stethoscope
    },
    {
        id: 'contact-4',
        name: 'Fire Department',
        description: 'For fire-related emergencies and rescue.',
        phone: '101',
        icon: Utensils
    }
];

export const alertSources: AlertSource[] = [
    {
        id: 'source-1',
        name: 'National Weather Service',
        description: 'Official government source for weather forecasts and warnings.'
    },
    {
        id: 'source-2',
        name: 'Local Police Department',
        description: 'Provides updates on local safety, traffic, and evacuation orders.'
    },
    {
        id: 'source-3',
        name: 'State Disaster Management',
        description: 'State-level agency coordinating disaster response and relief.'
    },
    {
        id: 'source-4',
        name: 'Global Disaster Alert System',
        description: 'International system providing alerts on natural disasters worldwide.'
    },
]
