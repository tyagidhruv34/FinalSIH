
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { UserStatus, DamageReport, Resource } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Building, LifeBuoy, MapPin } from 'lucide-react';
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
  
  const [helpRequests, setHelpRequests] = useState<UserStatus[]>([]);
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const helpRequestQuery = query(
        collection(db, 'user_status'), 
        where('status', '==', 'help'),
        orderBy('timestamp', 'desc')
    );

    const unsubscribeHelp = onSnapshot(helpRequestQuery, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserStatus));
        setHelpRequests(requests);
        setLoading(false);
    }, (err) => {
        console.error("Error fetching help requests:", err);
    });

    const damageReportQuery = query(
        collection(db, 'damage_reports'),
        orderBy('timestamp', 'desc')
    );

    const unsubscribeDamage = onSnapshot(damageReportQuery, (snapshot) => {
        const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DamageReport));
        setDamageReports(reports);
        setLoading(false);
    }, (err) => {
        console.error("Error fetching damage reports:", err);
    });

    return () => {
      unsubscribeHelp();
      unsubscribeDamage();
    };
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return null;
  }
  
  // Create a combined list of map markers
  const userStatusesForMap = helpRequests; // only show help requests on rescue map
  const damageReportsForMap = damageReports.map(dr => ({
    ...dr,
    // Add a markerType to distinguish in the map component if needed
    // This is a pattern to consider if you want different icons/popups
  }));
  
  const mapCenter = helpRequests.length > 0 && helpRequests[0].location
    ? [helpRequests[0].location.latitude, helpRequests[0].location.longitude] as [number, number]
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
            <div className="text-2xl font-bold text-destructive">{helpRequests.length}</div>
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Location</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {helpRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={req.userAvatarUrl} />
                                                <AvatarFallback>{req.userName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            {req.userName}
                                        </div>
                                    </TableCell>
                                    <TableCell>{req.timestamp ? formatDistanceToNow(req.timestamp.toDate(), {addSuffix: true}) : 'N/A'}</TableCell>
                                    <TableCell>{req.location ? 'Available' : 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {helpRequests.length === 0 && <p className="text-center text-muted-foreground py-4">No active SOS requests.</p>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Damage Reports</CardTitle>
                    <CardDescription>AI-Assessed structural damage reports from the field.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Image</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Reasoning</TableHead>
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
                                    <TableCell className="max-w-[250px] truncate">{report.assessment.reasoning}</TableCell>
                                    <TableCell>{report.timestamp ? formatDistanceToNow(report.timestamp.toDate(), {addSuffix: true}) : 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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
                </CardHeader>
                <CardContent>
                     <ResourceMap 
                        resources={resources as Resource[]} 
                        userStatuses={userStatusesForMap} 
                        resourceNeeds={[]} 
                        damageReports={damageReportsForMap}
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
