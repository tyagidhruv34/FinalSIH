
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { Alert, DamageReport, Resource } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Building, LifeBuoy, MapPin, User } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { resources } from '@/lib/data';
import Image from 'next/image';

const ResourceMap = dynamic(() => import('@/components/resource-map'), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />
});

const severityStyles: { [key: string]: string } = {
  'Destroyed': 'bg-red-800 text-white',
  'Severe': 'bg-red-600 text-white',
  'Moderate': 'bg-orange-500 text-white',
  'Minor': 'bg-yellow-400 text-black',
  'No Damage': 'bg-green-500 text-white'
};

export default function RescueDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [sosAlerts, setSosAlerts] = useState<Alert[]>([]);
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);

    const sosAlertsQuery = query(
        collection(db, 'alerts'), 
        where('severity', '==', 'Critical'),
        orderBy('timestamp', 'desc')
    );

    const unsubscribeSosAlerts = onSnapshot(sosAlertsQuery, (snapshot) => {
        const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
        setSosAlerts(alerts);
        setLoading(false);
    }, (err) => {
        console.error("Error fetching SOS alerts:", err);
        setLoading(false);
    });

    const damageReportQuery = query(
        collection(db, 'damage_reports'),
        orderBy('timestamp', 'desc')
    );

    const unsubscribeDamage = onSnapshot(damageReportQuery, (snapshot) => {
        const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DamageReport));
        setDamageReports(reports);
    }, (err) => {
        console.error("Error fetching damage reports:", err);
    });

    return () => {
      unsubscribeSosAlerts();
      unsubscribeDamage();
    };
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return null;
  }
  
  const mapCenter = sosAlerts.length > 0 && sosAlerts[0].affectedAreas[0]?.startsWith('Lat:')
    ? [parseFloat(sosAlerts[0].affectedAreas[0].split(', ')[0].replace('Lat: ', '')), parseFloat(sosAlerts[0].affectedAreas[0].split(', ')[1].replace('Lon: ', ''))] as [number, number]
    : damageReports.length > 0 && damageReports[0].location
    ? [damageReports[0].location.latitude, damageReports[0].location.longitude] as [number, number]
    : [28.6139, 77.2090] as [number, number];


  return (
    <div className="space-y-8">
       <div className="flex items-center gap-4">
        <LifeBuoy className="h-10 w-10 text-primary" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Rescue Operations Dashboard</h1>
            <p className="text-muted-foreground">
                Real-time overview of active incidents and requests.
            </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active SOS Signals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{sosAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Users actively requesting help.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Damage Reports</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{damageReports.length}</div>
            <p className="text-xs text-muted-foreground">
              Structural damage reports submitted.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Active SOS Requests</CardTitle>
                    <CardDescription>Users who have signaled they need help.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[300px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sosAlerts.map(alert => (
                                    <TableRow key={alert.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <User className="h-6 w-6" />
                                                {alert.title.replace('SOS: Help request from ', '')}
                                            </div>
                                        </TableCell>
                                        <TableCell>{alert.timestamp ? formatDistanceToNow(alert.timestamp.toDate(), {addSuffix: true}) : 'N/A'}</TableCell>
                                        <TableCell>{alert.affectedAreas.join(', ')}</TableCell>
                                        <TableCell><Badge variant={alert.acknowledged ? 'secondary' : 'destructive'}>{alert.acknowledged ? alert.rescueStatus || 'Acknowledged' : 'New'}</Badge></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {sosAlerts.length === 0 && <p className="text-center text-muted-foreground py-4">No active SOS requests.</p>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Damage Reports</CardTitle>
                    <CardDescription>AI-Assessed structural damage reports from the field.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[300px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Image</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead className="hidden md:table-cell">Reasoning</TableHead>
                                    <TableHead>Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {damageReports.slice(0,5).map(report => (
                                    <TableRow key={report.id}>
                                        <TableCell>
                                            <Image src={report.imageUrl} alt="Damage report" width={64} height={48} className="rounded-md object-cover aspect-video"/>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={severityStyles[report.assessment.severity]}>
                                                {report.assessment.severity}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[250px] truncate hidden md:table-cell">{report.assessment.reasoning}</TableCell>
                                        <TableCell>{report.timestamp ? formatDistanceToNow(report.timestamp.toDate(), {addSuffix: true}) : 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {damageReports.length === 0 && <p className="text-center text-muted-foreground py-4">No damage reports submitted yet.</p>}
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin />
                        Operations Map
                    </CardTitle>
                     <CardDescription>Live view of SOS requests and damage reports.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ResourceMap 
                        resources={resources as Resource[]} 
                        userStatuses={[]} 
                        resourceNeeds={[]} 
                        damageReports={damageReports}
                        center={mapCenter}
                        zoom={12}
                    />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
