
'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import type { Resource, UserStatus, ResourceNeed, DamageReport, Alert } from "@/lib/types";
import * as icons from "lucide-react";
import { UserCheck, AlertTriangle, PackageOpen, Building2, User as UserIcon } from "lucide-react";
import ReactDOMServer from 'react-dom/server';
import { cn } from '@/lib/utils';

// This is a workaround for a known issue with react-leaflet and Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
  iconUrl: require('leaflet/dist/images/marker-icon.png').default,
  shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
});


type ResourceMapProps = {
  resources: Resource[];
  userStatuses?: UserStatus[];
  resourceNeeds?: ResourceNeed[];
  damageReports?: DamageReport[];
  center?: [number, number];
  zoom?: number;
  currentUserId?: string;
  className?: string;
};

const LucideIcon = ({ name, ...props }: { name: string;[key: string]: any }) => {
  const Icon = icons[name as keyof typeof icons];
  if (!Icon) {
    return null;
  }
  return <Icon {...props} />;
};

const createMarkerIcon = (icon: React.ReactElement, size: [number, number] = [32, 32]) => {
    return L.divIcon({
        html: ReactDOMServer.renderToString(icon),
        className: 'bg-transparent border-0',
        iconSize: size,
        iconAnchor: [size[0]/2, size[1]],
        popupAnchor: [0, -size[1]],
    });
};

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
const currentUserHelpIcon = createMarkerIcon(
    <div className="relative flex items-center justify-center">
        <div className="absolute w-10 h-10 rounded-full bg-blue-500 animate-ping"></div>
        <div className="relative w-10 h-10 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center cursor-pointer shadow-lg">
            <UserIcon className="h-6 w-6 text-white" />
        </div>
    </div>,
    [40, 40]
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

const damageReportIcon = createMarkerIcon(
    <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center cursor-pointer shadow-md">
        <Building2 className="h-5 w-5 text-white" />
    </div>
);

const getResourceMarkerIcon = (resource: Resource) => {
    return createMarkerIcon(
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-md">
            <LucideIcon name={resource.icon} className="h-5 w-5 text-primary-foreground" />
        </div>
    );
};

export default function ResourceMap({ resources, userStatuses = [], resourceNeeds = [], damageReports = [], center = [28.6139, 77.2090], zoom = 11, currentUserId, className }: ResourceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current).setView(center, zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapRef.current);

        markersRef.current = new L.LayerGroup().addTo(mapRef.current);
    } else {
        mapRef.current.setView(center, zoom);
    }
    
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;

    markers.clearLayers();
    
    resources.forEach((resource) => {
        L.marker([resource.position.lat, resource.position.lng], { icon: getResourceMarkerIcon(resource) })
            .addTo(markers)
            .bindPopup(`<p class="font-bold">${resource.name}</p><p>${resource.address}</p>`);
    });

    userStatuses.forEach((status) => {
        if (!status.location) return;
        const isCurrentUser = status.userId === currentUserId;
        const isHelp = status.status === 'help';

        let icon;
        let popupContent;

        if (isCurrentUser && isHelp) {
            icon = currentUserHelpIcon;
            popupContent = `<p class="font-bold text-blue-600">You Are Here (SOS)</p><p>Status: <span class="font-semibold">${status.status}</span></p>`;
        } else if (isHelp) {
            icon = userHelpIcon;
            popupContent = `<p class="font-bold">${status.userName}</p><p>Status: <span class="text-red-600 font-semibold">${status.status}</span></p>`;
        } else {
            icon = userSafeIcon;
            popupContent = `<p class="font-bold">${status.userName}</p><p>Status: <span class="text-green-600">${status.status}</span></p>`;
        }
        
        L.marker([status.location.latitude, status.location.longitude], { icon })
            .addTo(markers)
            .bindPopup(popupContent);
    });

    resourceNeeds.forEach((need) => {
        if (!need.location) return;
        const isHighUrgency = need.urgency === 'High';
        L.marker([need.location.latitude, need.location.longitude], { icon: isHighUrgency ? needHighUrgencyIcon : needLowUrgencyIcon })
            .addTo(markers)
            .bindPopup(`<p class="font-bold">${need.quantity}x ${need.item}</p><p>Urgency: ${need.urgency}</p><p>Contact: ${need.contactInfo}</p>`);
    });

    (damageReports || []).forEach((report) => {
      if (!report.location) return;
      L.marker([report.location.latitude, report.location.longitude], { icon: damageReportIcon })
          .addTo(markers)
          .bindPopup(`<p class="font-bold">Damage Report</p><p>Severity: ${report.assessment.severity}</p><p>${report.description}</p>`);
    });
    
    // Clean up map instance on component unmount
    return () => {
        if (mapRef.current && mapContainerRef.current) {
            // Check if map container is still in DOM, to avoid errors during hot-reloads
            if (document.body.contains(mapContainerRef.current)) {
                // Don't remove map, just clear markers for next update
            } else {
                 if (mapRef.current) {
                    mapRef.current.remove();
                    mapRef.current = null;
                }
            }
        }
    };
  }, [resources, userStatuses, resourceNeeds, damageReports, center, zoom, currentUserId]);


  return (
    <div id="map" ref={mapContainerRef} className={cn("h-[500px] w-full rounded-lg overflow-hidden border min-h-[500px] z-0", className)} />
  );
}

