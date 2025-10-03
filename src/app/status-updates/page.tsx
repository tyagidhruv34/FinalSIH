
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
import { useStatusUpdater } from '@/hooks/use-status-updater';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function StatusUpdatesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { handleStatusUpdate } = useStatusUpdater();
  const [isSubmittingPage, setIsSubmittingPage] = useState<'safe' | 'help' | null>(null);


  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }
  
  const onStatusUpdate = async (status: 'safe' | 'help') => {
      setIsSubmittingPage(status);
      await handleStatusUpdate(status);
      setIsSubmittingPage(null);
      router.push('/');
  }


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
                onClick={() => onStatusUpdate('safe')}
                disabled={!!isSubmittingPage}
              >
                 {isSubmittingPage === 'safe' ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <><CheckCircle className="mr-2 h-8 w-8" /> I'M SAFE</>
                )}
              </Button>
              <Button
                variant="destructive"
                className="h-24 text-xl"
                onClick={() => onStatusUpdate('help')}
                disabled={!!isSubmittingPage}
              >
                {isSubmittingPage === 'help' ? (
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
