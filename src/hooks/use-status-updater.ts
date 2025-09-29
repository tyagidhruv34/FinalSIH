
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
    
    return new Promise<void>((resolve) => {
        const submitStatus = async (location?: GeoPoint) => {
            try {
                // Update user's personal status on the map
                await updateUserStatus({
                    userId: user.uid,
                    userName: user.displayName || 'Anonymous',
                    userAvatarUrl: user.photoURL || undefined,
                    status,
                    location,
                    timestamp: serverTimestamp(),
                });

                // If it's a help request, also create a system-wide alert
                if (status === 'help') {
                    await AlertService.createAlert({
                        title: `SOS: Help request from ${user.displayName || 'a user'}`,
                        description: `A user has requested immediate assistance. Check the Community Map for their location.`,
                        severity: 'Critical',
                        type: 'Other',
                        affectedAreas: ['User Location'], // Generic area for SOS
                        createdBy: user.uid,
                    })
                }

                toast({
                    title: "Status Updated",
                    description: `You've been marked as ${status === 'safe' ? 'safe' : 'needing help'}. ${location ? 'Your location has been shared.' : ''}`,
                });
            } catch (error) {
                console.error("Error updating status: ", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not update your status. Please try again.",
                });
            } finally {
                setIsSubmitting(null);
                resolve();
            }
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            submitStatus(new GeoPoint(latitude, longitude));
          },
          (error) => {
            console.warn("Could not get location: ", error.message);
            toast({
              variant: "destructive",
              title: "Location Error",
              description: "Could not get your location. Submitting status without location data.",
            });
            // Proceed without location
            submitStatus(undefined);
          },
          {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
          }
        );
    });
  };

  return { isSubmitting, handleStatusUpdate };
}
