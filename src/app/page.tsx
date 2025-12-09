

'use client';

import { useEffect, useState, useMemo } from 'react';
import { Clock, ListFilter, ServerCrash, Users, Truck, MapPin, Siren, Building2, ShieldAlert, Mic, MicOff, PlayCircle, Loader2, GraduationCap, Film, Gamepad2, ArrowRight, Calendar, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Alert, UserStatus, ResourceNeed } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { collection, onSnapshot, query, where, orderBy, limit, doc, getDoc, GeoPoint } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { resources } from '@/lib/data';
import { useStatusUpdater } from '@/hooks/use-status-updater';
import { useVoiceRecognition } from '@/hooks/use-voice-recognition';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


// Lazy load ResourceMap only when needed - defer initial load
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

// Calculate distance between two GeoPoints in kilometers using Haversine formula
function calculateDistance(geoPoint1: GeoPoint, geoPoint2: GeoPoint): number {
  const R = 6371; // Earth's radius in kilometers
  const lat1 = geoPoint1.latitude * Math.PI / 180;
  const lat2 = geoPoint2.latitude * Math.PI / 180;
  const deltaLat = (geoPoint2.latitude - geoPoint1.latitude) * Math.PI / 180;
  const deltaLon = (geoPoint2.longitude - geoPoint1.longitude) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}


export default function DashboardPage() {
  const { user, userType, loading: authLoading } = useAuth();
  const { language, t } = useLanguage();
  const router = useRouter();
  const { handleStatusUpdate } = useStatusUpdater();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [userStatuses, setUserStatuses] = useState<UserStatus[]>([]);
  const [resourceNeeds, setResourceNeeds] = useState<ResourceNeed[]>([]);
  const [damageReports, setDamageReports] = useState<any[]>([]); // Using any to avoid type issues with firebase data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSosAlerts, setActiveSosAlerts] = useState<Alert[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [currentUserLocation, setCurrentUserLocation] = useState<GeoPoint | null>(null);
  
  const handleVoiceCommand = (command: string) => {
    const lowerCaseCommand = command.toLowerCase();
    if (lowerCaseCommand.includes('save me')) {
        toast({ title: "Voice command recognized", description: "Sending SOS..." });
        handleSos();
    }
  };
  
  const handleSos = async () => {
    setIsSubmitting(true);
    try {
        await handleStatusUpdate('help');
    } finally {
        setIsSubmitting(false);
    }
  }

  const { isListening, isSupported, startListening, stopListening } = useVoiceRecognition({
    onCommand: handleVoiceCommand,
    onError: (error) => {
        if (error !== 'not-allowed' && error !== 'no-speech') {
             toast({
                variant: "destructive",
                title: "Voice Error",
                description: `Could not start voice recognition: ${error}`,
            });
        }
    }
  });
  
  const toggleListening = () => {
      if (isListening) {
          stopListening();
      } else {
          startListening();
      }
  }
  
  const handleDemo = () => {
    toast({
        title: "Voice Demo Started",
        description: "Simulating: Now say 'save me'.",
    });

    setTimeout(() => {
       toast({
           title: "Command 'save me' recognized!",
           description: "Sending SOS...",
       });
       handleSos();
    }, 2500);
  }
  
  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login');
      return;
    }
  }, [user, authLoading, router]);
  
  // Early return to prevent unnecessary rendering
  if (!user || authLoading) {
    return null;
  }
  
  // Filter help requests based on user type and distance
  const allHelpRequests = userStatuses.filter(s => s.status === 'help');
  
  const helpRequests = useMemo(() => {
    // Admin sees all SOS alerts
    if (userType === 'admin') {
      return allHelpRequests;
    }
    
    // Citizens only see SOS alerts within 25 km
    if (userType === 'citizen' && currentUserLocation) {
      return allHelpRequests.filter(req => {
        if (!req.location) return false; // Exclude requests without location
        const distance = calculateDistance(currentUserLocation, req.location);
        return distance <= 25; // 25 km radius
      });
    }
    
    // If no location available for citizen, show no requests
    if (userType === 'citizen' && !currentUserLocation) {
      return [];
    }
    
    // For rescue agencies, show all (or you can customize this)
    return allHelpRequests;
  }, [allHelpRequests, userType, currentUserLocation]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    };
    
    setLoading(true);

    // Limit initial load to 20 most recent alerts for faster loading
    const alertsQuery = query(
        collection(db, 'alerts'),
        orderBy('timestamp', 'desc'),
        limit(20)
    );

    const unsubscribeAlerts = onSnapshot(alertsQuery, async (querySnapshot) => {
        // Batch translation fetching - only fetch if language is not English
        const alertsToTranslate = language !== 'en' ? querySnapshot.docs : [];
        const translationPromises = alertsToTranslate.map(async (docSnapshot) => {
                try {
                    const translationRef = doc(db, 'alerts', docSnapshot.id, 'translations', language);
                    const translationSnap = await getDoc(translationRef);
                return translationSnap.exists() ? { id: docSnapshot.id, data: translationSnap.data() } : null;
                } catch (e) {
                return null;
            }
        });
        
        const translations = await Promise.all(translationPromises);
        const translationMap = new Map(translations.filter(t => t !== null).map(t => [t!.id, t!.data]));
        
        const fetchedAlerts: Alert[] = querySnapshot.docs.map((docSnapshot) => {
            let alertData = docSnapshot.data() as Alert;
            const translation = translationMap.get(docSnapshot.id);
            if (translation) {
                alertData.title = translation.title;
                alertData.description = translation.description;
            }
            return { id: docSnapshot.id, ...alertData };
        });

        const sortedAlerts = fetchedAlerts.sort((a, b) => {
            const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
            if (severityDiff !== 0) return severityDiff;
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return b.timestamp.toMillis() - a.timestamp.toMillis();
        });
        
        const userSosAlerts = sortedAlerts.filter(a => a.severity === 'Critical' && a.createdBy === user.uid && a.rescueStatus !== 'Completed');
        setActiveSosAlerts(userSosAlerts);

        setAlerts(sortedAlerts);
        setFilteredAlerts(sortedAlerts);
        setLoading(false);
    }, (err: any) => {
        console.error("Error fetching alerts:", err);
        if (err.code === 'permission-denied') {
            setError('Permission denied. Please check Firestore security rules.');
        } else {
        setError(t('error_failed_to_load_alerts'));
        }
        setLoading(false);
    });
    
    // Limit user statuses to recent ones only
    const userStatusQuery = query(
        collection(db, 'user_status'),
        orderBy('timestamp', 'desc'),
        limit(50)
    );
    const unsubscribeUserStatuses = onSnapshot(userStatusQuery, (querySnapshot) => {
        const statuses: UserStatus[] = [];
        querySnapshot.forEach((doc) => {
            statuses.push({ id: doc.id, ...doc.data() } as UserStatus);
        });
        setUserStatuses(statuses);
        
        // Get current user's location from their latest status
        const currentUserStatus = statuses.find(s => s.userId === user.uid);
        if (currentUserStatus?.location) {
            setCurrentUserLocation(currentUserStatus.location);
        } else {
            // Try to get location from browser if not in status
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setCurrentUserLocation(new GeoPoint(position.coords.latitude, position.coords.longitude));
                    },
                    (error) => {
                        console.warn('Could not get current location:', error);
                        setCurrentUserLocation(null);
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
                );
            }
        }
    }, (err: any) => {
        if (err.code !== 'permission-denied') {
            console.error("Error fetching user statuses:", err);
        }
    });

    // Limit resource needs - fetch all and filter/sort in memory to avoid index requirement
    const resourceNeedsQuery = query(
        collection(db, 'resource_needs'),
        limit(100) // Fetch more to filter
    );
    const unsubscribeResourceNeeds = onSnapshot(resourceNeedsQuery, (querySnapshot) => {
        const allNeeds: ResourceNeed[] = [];
        querySnapshot.forEach((doc) => {
            allNeeds.push({ id: doc.id, ...doc.data() } as ResourceNeed);
        });
        // Filter and sort in memory
        const filteredNeeds = allNeeds
            .filter(need => need.fulfilled === false)
            .sort((a, b) => {
                if (!a.timestamp || !b.timestamp) return 0;
                return b.timestamp.toMillis() - a.timestamp.toMillis();
            })
            .slice(0, 30); // Limit to 30
        setResourceNeeds(filteredNeeds);
    }, (err: any) => {
        if (err.code !== 'permission-denied') {
            console.error("Error fetching resource needs:", err);
        }
    });
    
    // Limit damage reports
    const reportsQuery = query(
        collection(db, 'damage_reports'),
        orderBy('timestamp', 'desc'),
        limit(20)
    );
    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
        const fetchedReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDamageReports(fetchedReports);
    }, (err: any) => {
        if (err.code !== 'permission-denied') {
            console.error("Error fetching damage reports:", err);
        }
    });


    return () => {
        unsubscribeAlerts();
        unsubscribeUserStatuses();
        unsubscribeResourceNeeds();
        unsubscribeReports();
    };

  }, [language, t, user]);

  // Filter alerts by location and date
  useEffect(() => {
    let filtered = [...alerts];
    
    if (filterLocation) {
      filtered = filtered.filter(alert => {
        const location = alert.location?.toLowerCase() || '';
        const affectedAreas = alert.affectedAreas?.map(area => area.toLowerCase()) || [];
        return location.includes(filterLocation.toLowerCase()) || 
               affectedAreas.some(area => area.includes(filterLocation.toLowerCase()));
      });
    }
    
    if (filterDate) {
      const filterDateObj = new Date(filterDate);
      filterDateObj.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      
      filtered = filtered.filter(alert => {
        if (!alert.timestamp) return false;
        const alertDate = alert.timestamp.toDate();
        return alertDate >= filterDateObj && alertDate < nextDay;
      });
    }
    
    setFilteredAlerts(filtered);
  }, [alerts, filterLocation, filterDate]);

  const handleClearFilters = () => {
    setFilterLocation('');
    setFilterDate('');
  };


  return (
    <div className="space-y-8">
        {user && activeSosAlerts.length > 0 && (
             <Card className="bg-gradient-to-r from-destructive/20 via-destructive/10 to-destructive/5 border-destructive border-2 pulse-glow animate-fade-in">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center">
                        <Siren className="h-6 w-6 text-destructive animate-pulse"/>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-destructive">{t('dashboard_sos_status_title')}</div>
                            <CardDescription className="text-destructive/80 mt-1">
                                A rescue team has been notified and is on the way.
                            </CardDescription>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {activeSosAlerts.map((activeSosAlert, index) => (
                        <div key={activeSosAlert.id} className="p-4 rounded-lg bg-background/50 border border-destructive/20 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                             <p className="font-semibold text-lg text-destructive">
                                {t('dashboard_sos_status_acknowledged').replace('{status}', activeSosAlert.rescueStatus || t('dashboard_sos_status_awaiting'))}
                            </p>
                             <p className="text-sm text-muted-foreground mt-1">
                                Requested {activeSosAlert.timestamp ? formatDistanceToNow(activeSosAlert.timestamp.toDate(), {addSuffix: true}) : 'just now'}
                            </p>
                            {activeSosAlert.rescueTeam && (
                                <div className="mt-3 p-2 rounded-md bg-destructive/5 border border-destructive/10">
                                     <p className="text-sm font-medium text-destructive">{t('dashboard_sos_rescue_team_title').replace('{team}', activeSosAlert.rescueTeam)}</p>
                                     <p className="text-xs text-muted-foreground mt-1">A rescue team has been notified and is on the way.</p>
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
        )}

      {/* Dashboard Title - Cornered, not main focus */}
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-medium text-foreground/80">{t('dashboard_title')}</h1>
      </div>

      {/* SOS and Voice Alert Buttons - FOCUS OF THE PAGE */}
      {user && userType === 'citizen' && (
        <div className="flex flex-col items-center justify-center gap-8 py-8 px-4 bg-gradient-to-b from-gray-100 via-background to-background rounded-2xl border-2 border-gray-300 shadow-2xl mb-8">
          <div className="text-center space-y-2">
            <h2 className="text-5xl font-bold text-foreground">Emergency Assistance</h2>
            <p className="text-foreground/70 text-xl">Get help immediately when you need it</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center w-full max-w-4xl">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  size="lg" 
                  variant="destructive" 
                  disabled={!!isSubmitting} 
                  className="h-24 w-full sm:w-auto min-w-[280px] px-12 text-2xl font-extrabold shadow-2xl hover:shadow-3xl hover:bg-destructive/90 transition-all duration-300 hover:scale-110 pulse-glow rounded-full border-4 border-destructive/50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-4 h-10 w-10 animate-spin" />
                      <span>Sending SOS...</span>
                    </>
                  ) : (
                    <>
                      <Siren className="mr-4 h-10 w-10 animate-pulse" />
                      <span className="text-3xl">{t('header_sos')}</span>
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl">{t('header_sos_confirm_title')}</AlertDialogTitle>
                  <AlertDialogDescription className="text-base">
                    {t('header_sos_confirm_description')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('header_sos_confirm_cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSos} className="bg-destructive hover:bg-destructive/90">{t('header_sos_confirm_action')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            {isSupported && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={toggleListening} 
                className={`h-24 w-full sm:w-auto min-w-[280px] px-12 text-2xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 rounded-full border-4 ${
                  isListening ? 'text-destructive border-destructive animate-pulse bg-destructive/10 border-destructive/50' : 'border-primary/50'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="mr-4 h-10 w-10" />
                    <span className="text-xl">Stop Listening</span>
                  </>
                ) : (
                  <>
                    <Mic className="mr-4 h-10 w-10" />
                    <span className="text-xl">Voice Alert</span>
                  </>
                )}
              </Button>
            )}
            {!isSupported && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleDemo}
                className="h-24 w-full sm:w-auto min-w-[280px] px-12 text-2xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 rounded-full border-4 border-primary/50"
              >
                <PlayCircle className="mr-4 h-10 w-10"/>
                <span className="text-xl">Voice Demo</span>
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Filter Button */}
      <div className="flex justify-end">
        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="shadow-md hover:shadow-lg transition-all text-xl px-6 py-3 border-2 border-gray-300 hover:border-gray-500 bg-white">
              <ListFilter className="mr-2 h-6 w-6"/>
              {t('dashboard_filter')}
              {(filterLocation || filterDate) && (
                <Badge variant="secondary" className="ml-2">
                  {(filterLocation ? 1 : 0) + (filterDate ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filter Alerts</DialogTitle>
              <DialogDescription>
                Filter alerts by location and date
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Enter city or area name"
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              {(filterLocation || filterDate) && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
        </div>
          </DialogContent>
        </Dialog>
      </div>
      
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="card-hover border-l-4 border-l-gray-600 bg-gradient-to-br from-gray-50 via-white to-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-xl font-semibold text-foreground">
                {t('dashboard_total_alerts_title')}
                </CardTitle>
                <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center shadow-lg">
                    <ShieldAlert className="h-6 w-6 text-white" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-5xl font-bold text-gray-800">{loading ? <Skeleton className="h-12 w-20" /> : alerts.length}</div>
                <p className="text-lg text-foreground/70 mt-2">
                {t('dashboard_total_alerts_desc')}
                </p>
            </CardContent>
            </Card>
            <Card className="card-hover border-l-4 border-l-gray-600 bg-gradient-to-br from-gray-50 via-white to-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-xl font-semibold text-foreground">
                {t('dashboard_help_requests_title')}
                </CardTitle>
                <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-5xl font-bold text-gray-800">{loading ? <Skeleton className="h-12 w-20" /> : helpRequests.length}</div>
                <p className="text-lg text-foreground/70 mt-2">
                {t('dashboard_help_requests_desc')}
                </p>
            </CardContent>
            </Card>
             <Card className="card-hover border-l-4 border-l-gray-600 bg-gradient-to-br from-gray-50 via-white to-white shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-xl font-semibold text-foreground">
                {t('dashboard_damage_reports_title')}
                </CardTitle>
                <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center shadow-lg">
                    <Building2 className="h-6 w-6 text-white" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-5xl font-bold text-gray-800">{loading ? <Skeleton className="h-12 w-20" /> : damageReports.length}</div>
                <p className="text-lg text-foreground/70 mt-2">
                {t('dashboard_damage_reports_desc')}
                </p>
            </CardContent>
            </Card>
            <Card className="card-hover border-l-4 border-l-gray-600 bg-gradient-to-br from-gray-50 via-white to-white shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-xl font-semibold text-foreground">
                        Resource Requests
                    </CardTitle>
                    <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center shadow-lg">
                        <Truck className="h-6 w-6 text-white" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-5xl font-bold text-gray-800">{loading ? <Skeleton className="h-12 w-20" /> : resourceNeeds.length}</div>
                    <p className="text-lg text-foreground/70 mt-2">
                        Active requests for food, water, etc.
                    </p>
                </CardContent>
            </Card>
        </div>


      {/* Learning Hub Preview and Community Resources - Side by Side */}
      {userType === 'citizen' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Learning Hub Preview - Left Side */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-gray-700 flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-foreground">Learning Hub</h2>
                  <p className="text-xl text-foreground/70">Learn disaster preparedness and safety</p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-2 text-xl border-gray-300 bg-white hover:bg-gray-50">
                <Link href="/learning-hub">
                  Show More
                  <ArrowRight className="h-6 w-6" />
                </Link>
              </Button>
            </div>
            
            {/* Video Preview Cards - Horizontal Layout */}
            <div className="flex gap-4 overflow-x-auto">
              <Card className="card-hover border-2 border-gray-300 hover:border-gray-600 transition-all overflow-hidden flex-shrink-0 w-full max-w-[400px] bg-white">
                <div className="aspect-video bg-black max-h-[200px]">
                  <video
                    className="w-full h-full"
                    controls
                    preload="metadata"
                    title="Earthquake Safety Video"
                  >
                    <source src="/videos/SSYouTube.online_How to Protect Yourself During an Earthquake  Disasters_720p.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-2xl font-semibold text-foreground">Earthquake Safety</CardTitle>
                  <CardDescription className="text-xl text-foreground/70">Learn essential earthquake safety procedures</CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="card-hover border-2 border-gray-300 hover:border-gray-600 transition-all overflow-hidden flex-shrink-0 w-full max-w-[400px] bg-white">
                <div className="aspect-video bg-black max-h-[200px]">
                  <video
                    className="w-full h-full"
                    controls
                    preload="metadata"
                    title="Fire Extinguisher Training"
                  >
                    <source src="/videos/How to Use a Fire Extinguisher 720p.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-2xl font-semibold text-foreground">Fire Safety Training</CardTitle>
                  <CardDescription className="text-xl text-foreground/70">P.A.S.S. method for fire extinguisher use</CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="card-hover border-2 border-gray-300 hover:border-gray-600 transition-all overflow-hidden flex-shrink-0 w-full max-w-[400px] bg-white">
                <div className="aspect-video bg-black max-h-[200px]">
                  <video
                    className="w-full h-full"
                    controls
                    preload="metadata"
                    title="Build an Emergency Kit"
                  >
                    <source src="/videos/SSYouTube.online_How to build an Emergency Preparedness Kit_720p.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-2xl font-semibold text-foreground">Emergency Kit Guide</CardTitle>
                  <CardDescription className="text-xl text-foreground/70">Learn what essential items you need in your emergency kit</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Community Resources - Right Side */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-gray-700 flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-foreground">{t('dashboard_community_needs_title')}</h2>
                <p className="text-xl text-foreground/70">Community support and resources</p>
              </div>
            </div>
            
            <Card className="card-hover shadow-lg bg-white border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-foreground">
                  <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-gray-700"/>
                  </div>
                  <span>Live Incident Map</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResourceMap
                  resources={resources}
                  userStatuses={userStatuses}
                  resourceNeeds={resourceNeeds}
                  damageReports={damageReports}
                  currentUserId={user?.uid}
                />
              </CardContent>
            </Card>
            
            <Card className="card-hover shadow-lg bg-white border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-foreground">
                  <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-700"/>
                  </div>
                  <span>{t('dashboard_recent_help_requests_title')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading && (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!loading && helpRequests.length === 0 && (
                  <p className="text-xl text-foreground/60 text-center py-4">{t('dashboard_no_help_requests')}</p>
                )}
                {!loading && helpRequests.length > 0 && (
                  <ul className="space-y-3">
                    {helpRequests.slice(0, 5).map((req, index) => (
                      <li key={req.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                        <Avatar className="ring-2 ring-gray-300 h-10 w-10">
                          <AvatarImage src={req.userAvatarUrl} alt={req.userName} />
                          <AvatarFallback className="bg-gray-400 text-white font-semibold text-base">{req.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className='flex-1 min-w-0'>
                          <p className="font-semibold text-lg truncate text-foreground">{req.userName}</p>
                          <p className="text-base text-gray-600 font-semibold flex items-center gap-1 mt-1">
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                            {t('dashboard_user_needs_help')}
                          </p>
                        </div>
                        {req.timestamp && (
                          <p className="text-base text-foreground/60 self-start whitespace-nowrap">
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
      )}

      <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Only show alerts for non-citizen users */}
            {userType !== 'citizen' && (
              <>
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

                  {!loading && !error && filteredAlerts.length === 0 && (
                <Card className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <CardTitle>{t('dashboard_all_clear_title')}</CardTitle>
                        <CardDescription>{t('dashboard_all_clear_desc')}</CardDescription>
                    </div>
                </Card>
              )}

                  {!loading && !error && filteredAlerts.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2">
                      {filteredAlerts.slice(0, 8).map((alert, index) => (
                        <Card key={alert.id} className={cn("flex flex-col border-l-4 card-hover animate-fade-in shadow-lg hover:shadow-2xl transition-all duration-300", severityStyles[alert.severity].split(' ')[0].replace('bg-','border-'))} style={{ animationDelay: `${index * 0.05}s`, borderLeftWidth: '6px' }}>
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between gap-3">
                                <CardTitle className="text-xl font-semibold leading-tight flex-1">
                                {alert.title}
                            </CardTitle>
                                <Badge variant={alert.severity === 'Critical' || alert.severity === 'High' ? 'destructive' : 'secondary'} className={cn(severityStyles[alert.severity], 'rounded-md shrink-0 text-base px-3 py-1 font-semibold')}>
                                {alert.severity}
                            </Badge>
                        </div>
                             <p className="text-base font-medium text-muted-foreground pt-2 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-current"></span>
                                {alert.type}
                             </p>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col pt-2">
                            <p className="mt-2 text-lg text-foreground/90 flex-1 leading-relaxed">
                          {alert.description}
                        </p>
                        {alert.affectedAreas && alert.affectedAreas.length > 0 && (
                                <div className="mt-6 pt-4 border-t">
                                    <h4 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wide">{t('dashboard_affected_areas_title')}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {alert.affectedAreas.map(area => <Badge key={area} variant="secondary" className="text-sm px-3 py-1">{area}</Badge>)}
                                </div>
                            </div>
                        )}
                      </CardContent>
                       {alert.timestamp && (
                                <div className="px-6 pb-5 flex items-center text-sm text-muted-foreground border-t pt-4 font-medium">
                                  <Clock className="mr-2 h-4 w-4" />
                              <span>{t('dashboard_time_ago').replace('{time}', formatDistanceToNow(alert.timestamp.toDate()))}</span>
                            </div>
                        )}
                    </Card>
                  ))}
                </div>
                  )}
              </>
              )}
          </div>

          {/* Community Resources - Right Side (for non-citizens) */}
          {userType !== 'citizen' && (
          <div className="lg:col-span-1 space-y-6">
              <h2 className="text-2xl font-semibold tracking-tight">{t('dashboard_community_needs_title')}</h2>
              
              <Card className="card-hover shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-primary"/>
                    </div>
                    <span>Live Incident Map</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResourceMap
                            resources={resources}
                            userStatuses={userStatuses}
                            resourceNeeds={resourceNeeds}
                            damageReports={damageReports}
                            currentUserId={user?.uid}
                        />
                    </CardContent>
                </Card>
              
              <Card className="card-hover shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary"/>
                    </div>
                    <span>{t('dashboard_recent_help_requests_title')}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading && (
                    <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                            ))}
                         </div>
                    )}
                    {!loading && helpRequests.length === 0 && (
                    <p className="text-base text-muted-foreground text-center py-4">{t('dashboard_no_help_requests')}</p>
                    )}
                    {!loading && helpRequests.length > 0 && (
                    <ul className="space-y-2">
                      {helpRequests.slice(0, 5).map((req, index) => (
                        <li key={req.id} className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-colors">
                          <Avatar className="ring-2 ring-destructive/20 h-8 w-8">
                                        <AvatarImage src={req.userAvatarUrl} alt={req.userName} />
                            <AvatarFallback className="bg-destructive/10 text-destructive font-semibold text-sm">{req.userName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                          <div className='flex-1 min-w-0'>
                            <p className="font-semibold text-base truncate">{req.userName}</p>
                            <p className="text-sm text-destructive font-semibold flex items-center gap-1 mt-0.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse"></span>
                              {t('dashboard_user_needs_help')}
                            </p>
                                    </div>
                                     {req.timestamp && (
                            <p className="text-sm text-muted-foreground self-start whitespace-nowrap">
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
          )}
      </div>
    </div>
  );
}
