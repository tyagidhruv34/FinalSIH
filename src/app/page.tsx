'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Map, ListFilter, ServerCrash } from "lucide-react";
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
import type { Alert } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const severityStyles = {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const fetchedAlerts = await AlertService.getAlerts();
        const sortedAlerts = fetchedAlerts.sort((a, b) => {
            const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
            if (severityDiff !== 0) return severityDiff;
            return b.timestamp.toMillis() - a.timestamp.toMillis();
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
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Live Alerts</h1>
          <p className="text-muted-foreground">
            Real-time disaster alerts from official sources.
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline"><ListFilter className="mr-2"/> Filter</Button>
            <Button variant="outline"><Map className="mr-2"/> Map View</Button>
        </div>
      </div>

      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
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
              <CardTitle className="text-destructive">Failed to Load Alerts</CardTitle>
              <CardDescription className="text-destructive/80">{error}</CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      {!loading && !error && alerts.length === 0 && (
        <Card>
            <CardHeader>
                <CardTitle>All Clear!</CardTitle>
                <CardDescription>There are no active alerts in your area right now.</CardDescription>
            </CardHeader>
        </Card>
      )}

      {!loading && !error && alerts.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
  );
}