
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
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to update your status.',
      });
      return;
    }

    setIsSubmitting(status);

    try {
      const location = await new Promise<GeoPoint | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve(new GeoPoint(position.coords.latitude, position.coords.longitude));
          },
          (error) => {
            console.warn('Could not get location: ', error.message);
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });

      if (status === 'help') {
        const lat = location?.latitude.toFixed(4);
        const lon = location?.longitude.toFixed(4);
        const locationString = location
          ? `at location: ${lat}, ${lon}`
          : 'at an unknown location';

        await AlertService.createAlert({
          title: `SOS: Help request from ${user.displayName || 'a user'}`,
          description: `A user has requested immediate assistance ${locationString}.`,
          severity: 'Critical',
          type: 'Other',
          affectedAreas: location ? [`Lat: ${lat}, Lon: ${lon}`] : ['Location not available'],
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
        title: 'Status Updated',
        description: `You've been marked as ${status}. Your location has ${location ? '' : 'not '}been shared.`,
      });

    } catch (error) {
      console.error("Error during status update:", error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update your status. Please try again.',
      });
    } finally {
      // This will run regardless of success or failure, ensuring the button resets.
      setIsSubmitting(null);
    }
  };

  return { isSubmitting, handleStatusUpdate };
}
