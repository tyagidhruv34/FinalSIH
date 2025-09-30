
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

  const handleStatusUpdate = async (status: 'safe' | 'help') => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Not Logged In",
            description: "You must be logged in to update your status.",
        });
        return;
    }

    setIsSubmitting(status);

    try {
        let alertId: string | null = null;
        // For 'help' status, create the alert immediately for speed.
        if (status === 'help') {
            alertId = await AlertService.createAlert({
                title: `SOS: Help request from ${user.displayName || 'a user'}`,
                description: `A user has requested immediate assistance. Their location is being fetched.`,
                severity: 'Critical',
                type: 'Other',
                affectedAreas: [], // Will be updated with location later if possible
                createdBy: user.uid,
            });
        }
        
        // Now, get location and update statuses/alerts.
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const geoPoint = new GeoPoint(latitude, longitude);

            // Update the user's own status document
            await updateUserStatus({
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userAvatarUrl: user.photoURL || undefined,
                status,
                location: geoPoint,
                timestamp: serverTimestamp(),
            });

            // If it was a help request, update the alert with location info
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

          },
          async (error) => {
            console.warn("Could not get location: ", error.message);
            // Still update status, just without location
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
          },
          {
              enableHighAccuracy: true,
              timeout: 10000, // Increased timeout for better location accuracy
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
    }
  };

  return { isSubmitting, handleStatusUpdate };
}
