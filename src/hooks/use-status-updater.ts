
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

        try {
            let alertId: string | null = null;
            if (status === 'help') {
                alertId = await AlertService.createAlert({
                    title: `SOS: Help request from ${user.displayName || 'a user'}`,
                    description: `A user has requested immediate assistance. Their location is being fetched.`,
                    severity: 'Critical',
                    type: 'Other',
                    affectedAreas: [],
                    createdBy: user.uid,
                    acknowledged: false,
                    rescueStatus: null,
                });
            }
            
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const { latitude, longitude } = position.coords;
                const geoPoint = new GeoPoint(latitude, longitude);

                await updateUserStatus({
                    userId: user.uid,
                    userName: user.displayName || 'Anonymous',
                    userAvatarUrl: user.photoURL || undefined,
                    status,
                    location: geoPoint,
                    timestamp: serverTimestamp(),
                });

                if (status === 'help' && alertId) {
                    await AlertService.updateAlert(alertId, { 
                        description: `A user has requested immediate assistance at the location marked on the map.`,
                        affectedAreas: [`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`]
                    });
                }
                
                toast({
                    title: "Status Updated",
                    description: `You've been marked as ${status}. Your location has been shared.`,
                });
                setIsSubmitting(null);
                resolve();
              },
              async (error) => {
                console.warn("Could not get location: ", error.message);
                 await updateUserStatus({
                    userId: user.uid,
                    userName: user.displayName || 'Anonymous',
                    userAvatarUrl: user.photoURL || undefined,
                    status,
                    timestamp: serverTimestamp(),
                });
                toast({
                  title: "Status Updated",
                  description: `You've been marked as ${status}. Your location could not be shared.`,
                  variant: "default",
                });
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
            console.error("Error updating status: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not update your status. Please try again.",
            });
            setIsSubmitting(null);
            reject(error);
        }
    });
  };

  return { isSubmitting, handleStatusUpdate };
}
