
"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { Resource, UserStatus, ResourceNeed } from "@/lib/types";
import { Card } from "@/components/ui/card";
import * as icons from "lucide-react";
import { UserCheck, AlertTriangle, PackageOpen, MapPinOff } from "lucide-react";
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';

type ResourceMapProps = {
  resources: Resource[];
  userStatuses: UserStatus[];
  resourceNeeds: ResourceNeed[];
};

const LucideIcon = ({ name, ...props }: { name: string;[key: string]: any }) => {
  const Icon = icons[name as keyof typeof icons];
  if (!Icon) {
    return null;
  }
  return <Icon {...props} />;
};

const createMarkerIcon = (icon: React.ReactElement) => {
    return L.divIcon({
        html: ReactDOMServer.renderToString(icon),
        className: 'bg-transparent border-0',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
};

const resourceIcon = createMarkerIcon(
    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-md">
        <icons.Home className="h-5 w-5 text-primary-foreground" />
    </div>
);

const userSafeIcon = createMarkerIcon(
    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center cursor-pointer shadow-md">
        <UserCheck className="h-5 w-5 text-white" />
    </div>
);
const userHelpIcon = createMarkerIcon(
    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center cursor-pointer shadow-md">
        <AlertTriangle className="h-5 w-5 text-white" />
    </div>
);

const needLowUrgencyIcon = createMarkerIcon(
    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer shadow-md">
        <PackageOpen className="h-5 w-5 text-white" />
    </div>
);
const needHighUrgencyIcon = createMarkerIcon(
    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center cursor-pointer shadow-md">
        <PackageOpen className="h-5 w-5 text-white" />
    </div>
);

const getResourceMarkerIcon = (resource: Resource) => {
    return createMarkerIcon(
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-md">
            <LucideIcon name={resource.icon} className="h-5 w-5 text-primary-foreground" />
        </div>
    );
};

export default function ResourceMap({ resources, userStatuses = [], resourceNeeds = [] }: ResourceMapProps) {
  const position: [number, number] = [28.6139, 77.2090]; // Delhi, India

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border">
        <MapContainer center={position} zoom={11} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Official Resources Markers */}
            {resources.map((resource) => (
                <Marker key={`res-${resource.id}`} position={[resource.position.lat, resource.position.lng]} icon={getResourceMarkerIcon(resource)}>
                    <Popup>
                        <p className="font-bold">{resource.name}</p>
                        <p>{resource.address}</p>
                    </Popup>
                </Marker>
            ))}

            {/* User Status Markers */}
            {userStatuses.map((status) => {
              if (!status.location) return null;
              const markerPosition: [number, number] = [status.location.latitude, status.location.longitude];
              const isSafe = status.status === 'safe';

              return (
                <Marker key={`user-${status.id}`} position={markerPosition} icon={isSafe ? userSafeIcon : userHelpIcon}>
                   <Popup>
                      <p className="font-bold">{status.userName}</p>
                      <p>Status: <span className={isSafe ? 'text-green-600' : 'text-red-600'}>{status.status}</span></p>
                    </Popup>
                </Marker>
              )
            })}

            {/* Resource Need Markers */}
            {resourceNeeds.map((need) => {
                if (!need.location) return null;
                const markerPosition: [number, number] = [need.location.latitude, need.location.longitude];
                const isHighUrgency = need.urgency === 'High';
                
                return (
                    <Marker key={`need-${need.id}`} position={markerPosition} icon={isHighUrgency ? needHighUrgencyIcon : needLowUrgencyIcon}>
                        <Popup>
                            <p className="font-bold">{need.quantity}x {need.item}</p>
                            <p>Urgency: <span className={isHighUrgency ? 'text-orange-600' : 'text-blue-600'}>{need.urgency}</span></p>
                            <p>Contact: {need.contactInfo}</p>
                        </Popup>
                    </Marker>
                )
            })}
        </MapContainer>
    </div>
  );
}
