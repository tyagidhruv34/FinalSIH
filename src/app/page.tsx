
'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Map, ListFilter, ServerCrash, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertService } from '@/lib/firebase/alerts';
import type { Alert, UserStatus } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

const severityStyles: { [key in Alert['severity']]: string } = {
  "Critical": "bg-red-600 text-white",
  "High": "bg-destructive text-destructive-foreground",
  "Medium": "bg-yellow-500 text-black",
  "Low": "bg-blue-500 text-white"
};

const severityOrder: { [key in Alert['severity']]: number } = {
  "Critical": 4,
  "High": 3,
  "Medium": 2,
  "Low": 1
};


export default function DashboardPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [helpRequests, setHelpRequests] = useState<UserStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const fetchedAlerts = await AlertService.getAlerts();
        const sortedAlerts = fetchedAlerts.sort((a, b) => {
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
        setAlerts(sortedAlerts);
        setError(null);
      } catch (e) {
        setError("Failed to load alerts. Please try again later.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();

    // Listen for real-time help requests
    const helpRequestQuery = query(
        collection(db, 'user_status'), 
        where('status', '==', 'help'),
        orderBy('timestamp', 'desc'),
        limit(5)
    );

    const unsubscribe = onSnapshot(helpRequestQuery, (querySnapshot) => {
        const requests: UserStatus[] = [];
        querySnapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() } as UserStatus);
        });
        setHelpRequests(requests);
    }, (err) => {
        console.error("Error fetching help requests:", err);
        setError("Failed to load community help requests.");
    });


    return () => unsubscribe();

  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Live alerts from officials and immediate needs from the community.
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline"><ListFilter className="mr-2"/> Filter</Button>
            <Button variant="outline" asChild><Link href="/resource-locator"><Map className="mr-2"/> Map View</Link></Button>
        </div>
      </div>
      
      <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-semibold tracking-tight">Live Alerts</h2>
             {loading && (
                <div className="grid gap-6 md:grid-cols-2">
                  {[...Array(2)].map((_, i) => (
                     <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-4 w-1/4 mt-4" />
                        </CardContent>
                     </Card>
                  ))}
                </div>
              )}

              {error && (
                <Card className="bg-destructive/10 border-destructive">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <ServerCrash className="h-8 w-8 text-destructive"/>
                    <div>
                      <CardTitle className="text-destructive">Failed to Load Data</CardTitle>
                      <CardDescription className="text-destructive/80">{error}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              )}

              {!loading && !error && alerts.length === 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>All Clear!</CardTitle>
                        <CardDescription>There are no active alerts right now.</CardDescription>
                    </CardHeader>
                </Card>
              )}

              {!loading && !error && alerts.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2">
                  {alerts.map((alert) => (
                    <Card key={alert.id} className="flex flex-col">
                      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-medium">
                                {alert.title}
                            </CardTitle>
                            <Badge className={cn(severityStyles[alert.severity])}>
                                {alert.severity}
                            </Badge>
                        </div>
                        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                         <p className="text-sm font-medium text-muted-foreground">{alert.type}</p>
                        <p className="mt-2 text-sm text-foreground/80 flex-1">
                          {alert.description}
                        </p>
                        <div className="mt-4">
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2">AFFECTED AREAS</h4>
                            <div className="flex flex-wrap gap-1">
                                {alert.affectedAreas.map(area => <Badge key={area} variant="outline">{area}</Badge>)}
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          <span>{formatDistanceToNow(alert.timestamp.toDate())} ago</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
          </div>

          <div className="lg:col-span-1 space-y-8">
              <h2 className="text-2xl font-semibold tracking-tight">Community Needs</h2>
               <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-6 w-6"/>
                        Recent Help Requests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading && (
                         <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                            ))}
                         </div>
                    )}
                    {!loading && helpRequests.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No active help requests from the community.</p>
                    )}
                    {!loading && helpRequests.length > 0 && (
                        <ul className="space-y-4">
                            {helpRequests.map(req => (
                                <li key={req.id} className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={req.userAvatarUrl} alt={req.userName} />
                                        <AvatarFallback>{req.userName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{req.userName}</p>
                                        <p className="text-xs text-destructive font-semibold">Needs Help</p>
                                        <p className="text-xs text-muted-foreground">
                                           {formatDistanceToNow(req.timestamp.toDate())} ago
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
          </div>
      </div>
    </div>
  );
}
