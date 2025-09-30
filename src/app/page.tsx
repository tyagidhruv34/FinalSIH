

'use client';

import { useEffect, useState } from 'react';
import { Clock, Map, ListFilter, ServerCrash, Users, LifeBuoy, Truck, MapPin } from "lucide-react";
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
import dynamic from 'next/dynamic';

const ResourceMap = dynamic(() => import('@/components/resource-map'), { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full rounded-lg" />
});


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
  const { language, t } = useLanguage();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [helpRequests, setHelpRequests] = useState<UserStatus[]>([]);
  const [damageReports, setDamageReports] = useState<any[]>([]); // Using any to avoid type issues with firebase data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    const alertsQuery = query(
        collection(db, 'alerts'),
        orderBy('timestamp', 'desc'),
        limit(20)
    );

    const unsubscribeAlerts = onSnapshot(alertsQuery, async (querySnapshot) => {
        const fetchedAlertsPromises: Promise<Alert>[] = querySnapshot.docs.map(async (docSnapshot) => {
            let alertData = docSnapshot.data() as Alert;
            
            if (language !== 'en') {
                try {
                    const translationRef = doc(db, 'alerts', docSnapshot.id, 'translations', language);
                    const translationSnap = await getDoc(translationRef);
                    if (translationSnap.exists()) {
                        const translationData = translationSnap.data();
                        alertData.title = translationData.title;
                        alertData.description = translationData.description;
                    }
                } catch (e) {
                    // This can happen if the translation subcollection isn't created yet, which is fine.
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
        setError(t('error_failed_to_load_alerts'));
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
        setError(t('error_failed_to_load_community_requests'));
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

  }, [language, t, user]);


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard_title')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard_description')}
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline"><ListFilter className="mr-2 h-4 w-4"/>{t('dashboard_filter')}</Button>
            <Button asChild><Link href="/resource-locator"><Map className="mr-2 h-4 w-4"/>{t('dashboard_map_view')}</Link></Button>
        </div>
      </div>
      
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                {t('dashboard_total_alerts_title')}
                </CardTitle>
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12" /> : alerts.length}</div>
                <p className="text-xs text-muted-foreground">
                {t('dashboard_total_alerts_desc')}
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                {t('dashboard_help_requests_title')}
                </CardTitle>
                <Users className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-destructive">{loading ? <Skeleton className="h-8 w-12" /> : helpRequests.length}</div>
                <p className="text-xs text-muted-foreground">
                {t('dashboard_help_requests_desc')}
                </p>
            </CardContent>
            </Card>
             <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                {t('dashboard_damage_reports_title')}
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12" /> : damageReports.length}</div>
                <p className="text-xs text-muted-foreground">
                {t('dashboard_damage_reports_desc')}
                </p>
            </CardContent>
            </Card>
        </div>

      <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight">{t('dashboard_live_alerts_title')}</h2>
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
                      <CardTitle className="text-destructive">{t('error_failed_to_load_title')}</CardTitle>
                      <CardDescription className="text-destructive/80">{error}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              )}

              {!loading && !error && alerts.length === 0 && (
                <Card className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <CardTitle>{t('dashboard_all_clear_title')}</CardTitle>
                        <CardDescription>{t('dashboard_all_clear_desc')}</CardDescription>
                    </div>
                </Card>
              )}

              {!loading && !error && alerts.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2">
                  {alerts.slice(0, 10).map((alert) => (
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
                                <h4 className="text-xs font-semibold text-muted-foreground mb-2">{t('dashboard_affected_areas_title')}</h4>
                                <div className="flex flex-wrap gap-1">
                                    {alert.affectedAreas.map(area => <Badge key={area} variant="secondary">{area}</Badge>)}
                                </div>
                            </div>
                        )}
                      </CardContent>
                       {alert.timestamp && (
                            <div className="px-6 pb-4 flex items-center text-xs text-muted-foreground">
                              <Clock className="mr-1.5 h-3 w-3" />
                              <span>{t('dashboard_time_ago').replace('{time}', formatDistanceToNow(alert.timestamp.toDate()))}</span>
                            </div>
                        )}
                    </Card>
                  ))}
                </div>
              )}
          </div>

          <div className="lg:col-span-1 space-y-6">
              <h2 className="text-2xl font-semibold tracking-tight">{t('dashboard_community_needs_title')}</h2>
               <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary"/>
                        {t('dashboard_recent_help_requests_title')}
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
                        <p className="text-sm text-muted-foreground text-center py-4">{t('dashboard_no_help_requests')}</p>
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
                                        <p className="text-xs text-destructive font-semibold">{t('dashboard_user_needs_help')}</p>
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

    

    