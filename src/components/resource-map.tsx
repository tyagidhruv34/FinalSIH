"use client";

import {
  APIProvider,
  Map,
  AdvancedMarker,
} from "@vis.gl/react-google-maps";
import type { Resource, UserStatus } from "@/lib/types";
import { Card } from "@/components/ui/card";
import * as icons from "lucide-react";

type ResourceMapProps = {
  resources: Resource[];
  userStatuses: UserStatus[];
};

const LucideIcon = ({ name, ...props }: { name: string;[key: string]: any }) => {
  const Icon = icons[name as keyof typeof icons];
  if (!Icon) {
    return null;
  }
  return <Icon {...props} />;
};


export default function ResourceMap({ resources, userStatuses = [] }: ResourceMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const position = { lat: 28.6139, lng: 77.209 }; // Delhi, India

  if (!apiKey) {
    return (
      <Card className="h-[500px] w-full flex items-center justify-center bg-muted/50 rounded-lg border-dashed border-2">
        <div className="text-center text-muted-foreground p-4">
          <h3 className="text-lg font-semibold text-foreground">Map Unavailable</h3>
          <p className="mt-2 text-sm">
            Google Maps API Key is not configured.
          </p>
          <p className="text-xs">
            Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment
            variables.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={position}
          defaultZoom={11}
          mapId="aapda_guide_map"
          gestureHandling={"greedy"}
          disableDefaultUI={true}
        >
          {/* Official Resources Markers */}
          {resources.map((resource) => (
            <AdvancedMarker
              key={`res-${resource.id}`}
              position={resource.position}
              title={resource.name}
            >
              <div className="group">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer transition-transform group-hover:scale-110 shadow-md">
                   <LucideIcon name={resource.icon} className="h-5 w-5 text-primary-foreground" />
                </div>
                 <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 bg-background text-foreground text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <p className="font-bold">{resource.name}</p>
                  <p>{resource.address}</p>
                </div>
              </div>
            </AdvancedMarker>
          ))}

           {/* User Status Markers */}
            {userStatuses.map((status) => {
              const markerColor = status.status === 'safe' ? 'bg-green-500' : 'bg-red-600';
              const markerPosition = { lat: status.location.latitude, lng: status.location.longitude };

              return (
                <AdvancedMarker
                  key={`user-${status.id}`}
                  position={markerPosition}
                  title={`${status.userName} - ${status.status}`}
                >
                  <div className="group">
                    <div className={`w-3 h-3 rounded-full ${markerColor} border-2 border-white shadow-lg`}></div>
                    <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 bg-background text-foreground text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <p className="font-bold">{status.userName}</p>
                      <p>Status: <span className={status.status === 'safe' ? 'text-green-600' : 'text-red-600'}>{status.status}</span></p>
                    </div>
                  </div>
                </AdvancedMarker>
              )
            })}
        </Map>
      </APIProvider>
    </div>
  );
}
