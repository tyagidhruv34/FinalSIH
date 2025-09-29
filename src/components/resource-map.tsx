
'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import type { Resource, UserStatus, ResourceNeed, DamageReport } from "@/lib/types";
import * as icons from "lucide-react";
import { UserCheck, AlertTriangle, PackageOpen, Building2 } from "lucide-react";
import ReactDOMServer from 'react-dom/server';

// This is a workaround for a known issue with react-leaflet and Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
  iconUrl: require('leaflet/dist/images/marker-icon.png').default,
  shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
});


type ResourceMapProps = {
  resources: Resource[];
  userStatuses: UserStatus[];
  resourceNeeds: ResourceNeed[];
  damageReports?: DamageReport[];
  center?: [number, number];
  zoom?: number;
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

export default function ResourceMap({ resources, userStatuses = [], resourceNeeds = [], damageReports = [], center = [28.6139, 77.2090], zoom = 11 }: ResourceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(new L.LayerGroup());

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) { // Only initialize map once
        const map = L.map(mapContainerRef.current).setView(center, zoom);
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        markersRef.current.addTo(map);
    }
    
    // Cleanup function to run when component unmounts
    return () => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
    };
  }, []); // Empty dependency array ensures this runs only once on mount and cleanup on unmount

  useEffect(() => {
    if(mapRef.current) {
        mapRef.current.setView(center, zoom);
    }
  }, [center, zoom])

  useEffect(() => {
      const markers = markersRef.current;
      if (!markers) return;

      // Clear existing markers before adding new ones
      markers.clearLayers();
      
      // Add new markers
      resources.forEach((resource) => {
          L.marker([resource.position.lat, resource.position.lng], { icon: getResourceMarkerIcon(resource) })
              .addTo(markers)
              .bindPopup(`<p class="font-bold">${resource.name}</p><p>${resource.address}</p>`);
      });

      userStatuses.forEach((status) => {
          if (!status.location) return;
          const isSafe = status.status === 'safe';
          L.marker([status.location.latitude, status.location.longitude], { icon: isSafe ? userSafeIcon : userHelpIcon })
              .addTo(markers)
              .bindPopup(`<p class="font-bold">${status.userName}</p><p>Status: <span class="${isSafe ? 'text-green-600' : 'text-red-600'}">${status.status}</span></p>`);
      });

      resourceNeeds.forEach((need) => {
          if (!need.location) return;
          const isHighUrgency = need.urgency === 'High';
          L.marker([need.location.latitude, need.location.longitude], { icon: isHighUrgency ? needHighUrgencyIcon : needLowUrgencyIcon })
              .addTo(markers)
              .bindPopup(`<p class="font-bold">${need.quantity}x ${need.item}</p><p>Urgency: ${need.urgency}</p><p>Contact: ${need.contactInfo}</p>`);
      });

      damageReports.forEach((report) => {
        if (!report.location) return;
        L.marker([report.location.latitude, report.location.longitude], { icon: damageReportIcon })
            .addTo(markers)
            .bindPopup(`<p class="font-bold">Damage Report</p><p>Severity: ${report.assessment.severity}</p><p>${report.description}</p>`);
      });

  }, [resources, userStatuses, resourceNeeds, damageReports]);


  return (
    <div id="map" ref={mapContainerRef} className="h-[500px] w-full rounded-lg overflow-hidden border" />
  );
}
