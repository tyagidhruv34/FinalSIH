
'use client';

import { useEffect, useState } from 'react';
import { Clock, Map, ListFilter, ServerCrash, Users, LifeBuoy, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Alert, UserStatus } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { collection, onSnapshot, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Building2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';

const severityStyles: { [key in Alert['severity']]: string } = {
  "Critical": "border-accent text-accent-foreground bg-accent/10",
  "High": "border-destructive text-destructive-foreground bg-destructive/10",
  "Medium": "border-yellow-500 text-yellow-600 bg-yellow-500/10",
  "Low": "border-primary text-primary bg-primary/10"
};

const severityOrder: { [key in Alert['severity']]: number } = {
  "Critical": 4,
  "High": 3,
  "Medium": 2,
  "Low": 1
};


export default function DashboardPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [helpRequests, setHelpRequests] = useState<UserStatus[]>([]);
  const [damageReports, setDamageReports] = useState<any[]>([]); // Using any to avoid type issues with firebase data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userSosAlert = user ? alerts.find(a => a.createdBy === user.uid && a.severity === 'Critical' && a.rescueStatus !== 'Completed') : undefined;

  useEffect(() => {
    setLoading(true);

    const alertsQuery = query(
        collection(db, 'alerts'),
        orderBy('timestamp', 'desc'),
        limit(20) // Fetch more to find user's SOS
    );

    const unsubscribeAlerts = onSnapshot(alertsQuery, async (querySnapshot) => {
        const fetchedAlertsPromises: Promise<Alert>[] = querySnapshot.docs.map(async (docSnapshot) => {
            let alertData = docSnapshot.data() as Alert;
            
            // If language is not English, try to fetch translation
            if (language !== 'en') {
                const translationRef = doc(db, 'alerts', docSnapshot.id, 'translations', language);
                const translationSnap = await getDoc(translationRef);
                if (translationSnap.exists()) {
                    const translationData = translationSnap.data();
                    alertData.title = translationData.title;
                    alertData.description = translationData.description;
                }
            }

            return { id: docSnapshot.id, ...alertData };
        });
        
        const fetchedAlerts = await Promise.all(fetchedAlertsPromises);

        const sortedAlerts = fetchedAlerts.sort((a, b) => {
            const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
            if (severityDiff !== 0) return severityDiff;
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return b.timestamp.toMillis() - a.timestamp.toMillis();
        });

        setAlerts(sortedAlerts);
        setLoading(false);
    }, (err) => {
        console.error("Error fetching alerts:", err);
        setError("Failed to load alerts.");
        setLoading(false);
    });

    const helpRequestQuery = query(
        collection(db, 'user_status'), 
        where('status', '==', 'help'),
        orderBy('timestamp', 'desc'),
        limit(5)
    );

    const unsubscribeHelpRequests = onSnapshot(helpRequestQuery, (querySnapshot) => {
        const requests: UserStatus[] = [];
        querySnapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() } as UserStatus);
        });
        setHelpRequests(requests);
    }, (err) => {
        console.error("Error fetching help requests:", err);
        setError("Failed to load community help requests.");
    });
    
    const reportsQuery = query(collection(db, 'damage_reports'));
    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
        const fetchedReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDamageReports(fetchedReports);
    });


    return () => {
        unsubscribeAlerts();
        unsubscribeHelpRequests();
        unsubscribeReports();
    };

  }, [language]);

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
            <Button variant="outline"><ListFilter className="mr-2 h-4 w-4"/> Filter</Button>
            <Button asChild><Link href="/resource-locator"><Map className="mr-2 h-4 w-4"/> Map View</Link></Button>
        </div>
      </div>
      
      {userSosAlert && (
          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-blue-800 dark:text-blue-300">
                    <LifeBuoy className="h-6 w-6 animate-pulse" />
                    Your SOS Rescue Status
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-lg font-semibold">
                    {userSosAlert.acknowledged ? 
                     `Status: ${userSosAlert.rescueStatus || 'Acknowledged'}` :
                     'SOS Sent. Awaiting Acknowledgement.'}
                </p>
                <p className="text-muted-foreground mt-1">
                    {userSosAlert.acknowledged ? 
                     'A rescue team has been notified. Help is on the way.' : 
                     'Your request has been received. An admin will review it shortly.'}
                </p>
                {userSosAlert.rescueTeam && (
                    <div className="flex items-center gap-4 pt-2 border-t border-blue-200 dark:border-blue-700">
                        <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
                        <div>
                            <p className="font-semibold">{userSosAlert.rescueTeam} is on the way.</p>
                            {userSosAlert.eta && <p className="text-sm text-muted-foreground">Estimated arrival: {userSosAlert.eta}</p>}
                        </div>
                    </div>
                )}
            </CardContent>
          </Card>
      )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Total Alerts
                </CardTitle>
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12" /> : alerts.length}</div>
                <p className="text-xs text-muted-foreground">
                Live and recent alerts
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Active Help Requests
                </CardTitle>
                <Users className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-destructive">{loading ? <Skeleton className="h-8 w-12" /> : helpRequests.length}</div>
                <p className="text-xs text-muted-foreground">
                Users requesting immediate help
                </p>
            </CardContent>
            </Card>
             <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Damage Reports
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12" /> : damageReports.length}</div>
                <p className="text-xs text-muted-foreground">
                Total damage reports submitted
                </p>
            </CardContent>
            </Card>
        </div>

      <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
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

              {!loading && !error && alerts.filter(a => a.id !== userSosAlert?.id).length === 0 && (
                <Card className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <CardTitle>All Clear!</CardTitle>
                        <CardDescription>There are no active alerts right now.</CardDescription>
                    </div>
                </Card>
              )}

              {!loading && !error && alerts.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2">
                  {alerts.filter(a => a.id !== userSosAlert?.id).slice(0, 10).map((alert) => (
                    <Card key={alert.id} className={cn("flex flex-col border-l-4", severityStyles[alert.severity].split(' ')[0].replace('bg-','border-'))}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                            <CardTitle className="text-lg font-medium">
                                {alert.title}
                            </CardTitle>
                            <Badge variant={alert.severity === 'Critical' || alert.severity === 'High' ? 'destructive' : 'secondary'} className={cn(severityStyles[alert.severity], 'rounded-md')}>
                                {alert.severity}
                            </Badge>
                        </div>
                         <p className="text-sm font-medium text-muted-foreground pt-1">{alert.type}</p>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col pt-2">
                        <p className="mt-2 text-sm text-foreground/80 flex-1">
                          {alert.description}
                        </p>
                        {alert.affectedAreas && alert.affectedAreas.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-xs font-semibold text-muted-foreground mb-2">AFFECTED AREAS</h4>
                                <div className="flex flex-wrap gap-1">
                                    {alert.affectedAreas.map(area => <Badge key={area} variant="secondary">{area}</Badge>)}
                                </div>
                            </div>
                        )}
                      </CardContent>
                       {alert.timestamp && (
                            <div className="px-6 pb-4 flex items-center text-xs text-muted-foreground">
                              <Clock className="mr-1.5 h-3 w-3" />
                              <span>{formatDistanceToNow(alert.timestamp.toDate())} ago</span>
                            </div>
                        )}
                    </Card>
                  ))}
                </div>
              )}
          </div>

          <div className="lg:col-span-1 space-y-6">
              <h2 className="text-2xl font-semibold tracking-tight">Community Needs</h2>
               <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary"/>
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
                                    <div className='flex-1'>
                                        <p className="font-semibold text-sm">{req.userName}</p>
                                        <p className="text-xs text-destructive font-semibold">Needs Help</p>
                                    </div>
                                     {req.timestamp && (
                                        <p className="text-xs text-muted-foreground self-start">
                                            {formatDistanceToNow(req.timestamp.toDate(), { addSuffix: true })}
                                        </p>
                                    )}
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
