
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { updateUserStatus } from '@/lib/firebase/status';
import { GeoPoint, serverTimestamp } from 'firebase/firestore';
import { AlertService } from '@/lib/firebase/alerts';

export function useStatusUpdater() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<'safe' | 'help' | null>(null);

  const handleStatusUpdate = (status: 'safe' | 'help'): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        if (!user) {
            toast({
                variant: "destructive",
                title: "Not Logged In",
                description: "You must be logged in to update your status.",
            });
            return reject(new Error("User not logged in."));
        }

        setIsSubmitting(status);

        const createAlertWithLocation = async (location: GeoPoint | null) => {
            try {
                 if (status === 'help') {
                    const lat = location?.latitude.toFixed(4);
                    const lon = location?.longitude.toFixed(4);
                    const locationString = location ? `at location: ${lat}, ${lon}` : "at an unknown location";

                    await AlertService.createAlert({
                        title: `SOS: Help request from ${user.displayName || 'a user'}`,
                        description: `A user has requested immediate assistance ${locationString}.`,
                        severity: 'Critical',
                        type: 'Other',
                        affectedAreas: location ? [`Lat: ${lat}, Lon: ${lon}`] : ["Location not available"],
                        createdBy: user.uid,
                        acknowledged: false,
                        rescueStatus: null,
                    });
                }

                await updateUserStatus({
                    userId: user.uid,
                    userName: user.displayName || 'Anonymous',
                    userAvatarUrl: user.photoURL || undefined,
                    status,
                    location,
                    timestamp: serverTimestamp(),
                });

                toast({
                    title: "Status Updated",
                    description: `You've been marked as ${status}. Your location has ${location ? '' : 'not '}been shared.`,
                });
                
            } catch (error) {
                 console.error("Error creating alert or updating status: ", error);
                 toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not update your status. Please try again.",
                });
                throw error; // Propagate error
            }
        }

        try {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const { latitude, longitude } = position.coords;
                const geoPoint = new GeoPoint(latitude, longitude);
                await createAlertWithLocation(geoPoint);
                setIsSubmitting(null);
                resolve();
              },
              async (error) => {
                console.warn("Could not get location: ", error.message);
                await createAlertWithLocation(null);
                 setIsSubmitting(null);
                 resolve();
              },
              {
                  enableHighAccuracy: true,
                  timeout: 10000,
                  maximumAge: 0
              }
            );
        } catch (error) {
            setIsSubmitting(null);
            reject(error);
        }
    });
  };

  return { isSubmitting, handleStatusUpdate };
}
