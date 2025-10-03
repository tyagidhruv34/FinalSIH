
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { updateUserStatus } from '@/lib/firebase/status';
import { GeoPoint, serverTimestamp } from 'firebase/firestore';
import { AlertService } from '@/lib/firebase/alerts';

// Helper function to get location with a Promise-based approach
const getLocation = (): Promise<GeoPoint | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(new GeoPoint(position.coords.latitude, position.coords.longitude));
      },
      (error) => {
        console.warn('Could not get location: ', error.message);
        resolve(null); // Resolve with null if there's an error or permission is denied
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
};


export function useStatusUpdater() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleStatusUpdate = async (status: 'safe' | 'help') => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to update your status.',
      });
      return;
    }

    try {
      const location = await getLocation();

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
          location: location || undefined,
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
      // Re-throw the error if you want the calling component to handle it
      throw error;
    }
  };

  return { handleStatusUpdate };
}
