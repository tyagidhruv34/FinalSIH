'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { updateUserStatus } from '@/lib/firebase/status';
import { GeoPoint, serverTimestamp } from 'firebase/firestore';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function StatusUpdatesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<'safe' | 'help' | null>(null);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleStatusUpdate = (status: 'safe' | 'help') => {
    setIsSubmitting(status);
    
    const submitStatus = async (location?: GeoPoint) => {
        try {
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
                description: `You've been marked as ${status === 'safe' ? 'safe' : 'needing help'}. ${location ? 'Your location has been shared.' : ''}`,
            });
            router.push('/resource-locator');
        } catch (error) {
            console.error("Error updating status: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not update your status. Please try again.",
            });
        } finally {
            setIsSubmitting(null);
        }
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        submitStatus(new GeoPoint(latitude, longitude));
      },
      (error) => {
        console.error("Error getting location: ", error);
        toast({
          variant: "destructive",
          title: "Location Error",
          description: "Could not get your location. Submitting status without location data.",
        });
        // Proceed without location
        submitStatus(undefined);
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
       <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Update Your Status</h1>
        <p className="text-muted-foreground mt-2">
          Let your community and rescue teams know your current situation.
        </p>
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Are you safe?</CardTitle>
            <CardDescription>
              Press one of the buttons below. Your location will be recorded to help rescuers and coordinators if available.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                className="h-24 text-xl"
                onClick={() => handleStatusUpdate('safe')}
                disabled={!!isSubmitting}
              >
                 {isSubmitting === 'safe' ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <><CheckCircle className="mr-2 h-8 w-8" /> I'M SAFE</>
                )}
              </Button>
              <Button
                variant="destructive"
                className="h-24 text-xl"
                onClick={() => handleStatusUpdate('help')}
                disabled={!!isSubmitting}
              >
                {isSubmitting === 'help' ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <><AlertTriangle className="mr-2 h-8 w-8" /> NEED HELP</>
                )}
              </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-accent/20 border-accent">
            <CardHeader>
                <CardTitle>Privacy Note</CardTitle>
                <CardDescription>
                    If available, your location will be shared on the community map for disaster response purposes. Your status will be visible to other users of this app.
                </CardDescription>
            </CardHeader>
        </Card>

    </div>
  );
}
