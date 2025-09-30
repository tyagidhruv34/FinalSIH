
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

  const handleStatusUpdate = async (status: 'safe' | 'help'): Promise<string | null> => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to update your status.',
      });
      throw new Error('User not logged in.');
    }

    setIsSubmitting(status);

    const createAlertWithLocation = async (location: GeoPoint | null) => {
      let alertId: string | null = null;
      if (status === 'help') {
        const lat = location?.latitude.toFixed(4);
        const lon = location?.longitude.toFixed(4);
        const locationString = location
          ? `at location: ${lat}, ${lon}`
          : 'at an unknown location';

        alertId = await AlertService.createAlert({
          title: `SOS: Help request from ${user.displayName || 'a user'}`,
          description: `A user has requested immediate assistance ${locationString}.`,
          severity: 'Critical',
          type: 'Other',
          affectedAreas: location
            ? [`Lat: ${lat}, Lon: ${lon}`]
            : ['Location not available'],
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
        description: `You've been marked as ${status}. Your location has ${
          location ? '' : 'not '
        }been shared.`,
      });
      return alertId;
    };

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      
      const { latitude, longitude } = position.coords;
      const geoPoint = new GeoPoint(latitude, longitude);
      return await createAlertWithLocation(geoPoint);

    } catch (error: any) {
      console.warn('Could not get location: ', error.message);
      return await createAlertWithLocation(null);
    } finally {
      setIsSubmitting(null);
    }
  };

  return { isSubmitting, handleStatusUpdate };
}
