
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { indianDistricts, alertTypes, alertSeverities } from '@/lib/data';
import { AlertService } from '@/lib/firebase/alerts';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { Alert, DamageReport, Resource, UserStatus, ResourceNeed } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, formatDistanceToNow } from 'date-fns';
import { Trash2, ShieldAlert, Building2, CheckCircle, MapPin, AlertTriangle, ShieldX, Loader2, User, PackageOpen, Truck, Users, Settings, BarChart3, FileText, Ban, Edit, Search, ShieldCheck } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Timestamp, collection, onSnapshot, query, orderBy, where, limit, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { resources } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UserProfile, UserType, SurvivorStory, MissingPerson } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ResourceMap = dynamic(() => import('@/components/resource-map'), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />
});


const alertFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  severity: z.enum(alertSeverities),
  type: z.enum(alertTypes),
  affectedAreas: z.array(z.string()).min(1, { message: "Please select at least one affected area." }),
});

type AlertFormValues = z.infer<typeof alertFormSchema>;

export default function AdminAlertPage() {
  const { user, loading, userType } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [helpRequests, setHelpRequests] = useState<UserStatus[]>([]);
  const [resourceNeeds, setResourceNeeds] = useState<ResourceNeed[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [survivorStories, setSurvivorStories] = useState<SurvivorStory[]>([]);
  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const { control, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<AlertFormValues>({
    resolver: zodResolver(alertFormSchema),
    defaultValues: {
      title: '',
      description: '',
      severity: 'Medium',
      type: 'Other',
      affectedAreas: [],
    }
  });
  
  const selectedAreas = watch('affectedAreas');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Check if user is admin
    if (userType !== 'admin') {
      toast({ title: "Access Denied", description: "You must be an admin to access this page.", variant: "destructive" });
      router.push('/');
      return;
    }
    
    setIsLoading(true);

    const alertsQuery = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'));
    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
        const fetchedAlerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
        setAlerts(fetchedAlerts);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching alerts: ", error);
        toast({ title: "Error", description: "Failed to fetch alerts.", variant: "destructive" });
        setIsLoading(false);
    });

    const reportsQuery = query(collection(db, 'damage_reports'), orderBy('timestamp', 'desc'));
    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
        const fetchedReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DamageReport));
        setDamageReports(fetchedReports);
    }, (error) => {
        console.error("Error fetching damage reports: ", error);
        toast({ title: "Error", description: "Failed to fetch damage reports.", variant: "destructive" });
    });
    
    // Fetch help requests - filter and sort in memory to avoid index requirement
    const helpRequestQuery = query(
        collection(db, 'user_status'), 
        limit(200) // Fetch more to filter
    );
    const unsubscribeHelp = onSnapshot(helpRequestQuery, (snapshot) => {
        const allStatuses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserStatus));
        // Filter and sort in memory
        const helpReqs = allStatuses
            .filter(status => status.status === 'help')
            .sort((a, b) => {
                if (!a.timestamp || !b.timestamp) return 0;
                return b.timestamp.toMillis() - a.timestamp.toMillis();
            });
        setHelpRequests(helpReqs);
    }, (err) => {
        console.error("Error fetching help requests:", err);
    });

    // Fetch resource needs - filter and sort in memory to avoid index requirement
    const resourceNeedsQuery = query(
        collection(db, 'resource_needs'),
        limit(200) // Fetch more to filter
    );
    const unsubscribeResourceNeeds = onSnapshot(resourceNeedsQuery, (snapshot) => {
        const allNeeds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResourceNeed));
        // Filter and sort in memory
        const filteredNeeds = allNeeds
            .filter(need => need.fulfilled === false)
            .sort((a, b) => {
                if (!a.timestamp || !b.timestamp) return 0;
                return b.timestamp.toMillis() - a.timestamp.toMillis();
            });
        setResourceNeeds(filteredNeeds);
    }, (error) => {
        console.error("Error fetching resource needs: ", error);
        toast({ title: "Error", description: "Failed to fetch resource needs.", variant: "destructive" });
    });


    // Fetch all users for user management
    const usersQuery = query(collection(db, 'users'), limit(500));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        const users = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
        setAllUsers(users);
    }, (error) => {
        console.error("Error fetching users: ", error);
    });

    // Fetch survivor stories for moderation
    const storiesQuery = query(collection(db, 'survivor_stories'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribeStories = onSnapshot(storiesQuery, (snapshot) => {
        const stories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SurvivorStory));
        setSurvivorStories(stories);
    }, (error) => {
        console.error("Error fetching survivor stories: ", error);
    });

    // Fetch missing persons for management
    const missingPersonsQuery = query(collection(db, 'missing_persons'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribeMissing = onSnapshot(missingPersonsQuery, (snapshot) => {
        const persons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MissingPerson));
        setMissingPersons(persons);
    }, (error) => {
        console.error("Error fetching missing persons: ", error);
    });

    return () => {
        unsubscribeAlerts();
        unsubscribeReports();
        unsubscribeHelp();
        unsubscribeResourceNeeds();
        unsubscribeUsers();
        unsubscribeStories();
        unsubscribeMissing();
    };

  }, [user, loading, router, toast, userType]);
  

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-10rem)]">
            <Card className="p-8 text-center">
                <Loader2 className="animate-spin h-10 w-10 mx-auto mb-4"/>
                <p>Loading Dashboard...</p>
            </Card>
        </div>
    );
  }

  
  const onSubmit = async (data: AlertFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
        const newAlertData: Omit<Alert, 'id' | 'timestamp'> = {
            ...data,
            createdBy: user.uid,
        };
        await AlertService.createAlert(newAlertData);
        
        toast({
            title: "Success!",
            description: "Alert has been created and sent successfully.",
        });
        reset(); // Clear the form
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to create alert. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!window.confirm("Are you sure you want to delete this alert? This action cannot be undone.")) return;

    try {
      await AlertService.deleteAlert(alertId);
      toast({
        title: "Alert Deleted",
        description: "The alert has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the alert.",
        variant: "destructive",
      });
    }
  };
  
  const handleAcknowledge = async (alertId: string) => {
    try {
      await AlertService.acknowledgeSosAlert(alertId);
      toast({
        title: "SOS Acknowledged",
        description: "Rescue team has been dispatched.",
      });
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to acknowledge the SOS.",
        variant: "destructive",
      });
    }
  };

  const damageSeverityData = damageReports.reduce((acc, report) => {
    const severity = report.assessment.severity;
    const existing = acc.find(item => item.name === severity);
    if (existing) {
      existing.total += 1;
    } else {
      acc.push({ name: severity, total: 1 });
    }
    return acc;
  }, [] as { name: string; total: number }[]);

  const mapCenter = helpRequests.length > 0 && helpRequests[0].location
    ? [helpRequests[0].location.latitude, helpRequests[0].location.longitude] as [number, number]
    : damageReports.length > 0 && damageReports[0].location
    ? [damageReports[0].location.latitude, damageReports[0].location.longitude] as [number, number]
    : [28.6139, 77.2090] as [number, number];


  const handleUpdateUserType = async (userId: string, newUserType: UserType) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { userType: newUserType });
      toast({
        title: "Success",
        description: "User type updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user type.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;
    try {
      const storyRef = doc(db, 'survivor_stories', storyId);
      await updateDoc(storyRef, { deleted: true });
      toast({
        title: "Story Deleted",
        description: "The story has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete story.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMissingPerson = async (personId: string) => {
    if (!window.confirm("Are you sure you want to remove this missing person record?")) return;
    try {
      const personRef = doc(db, 'missing_persons', personId);
      await updateDoc(personRef, { resolved: true });
      toast({
        title: "Record Updated",
        description: "Missing person record marked as resolved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update record.",
        variant: "destructive",
      });
    }
  };

  const handleFulfillResource = async (resourceId: string) => {
    try {
      const resourceRef = doc(db, 'resource_needs', resourceId);
      await updateDoc(resourceRef, { fulfilled: true });
      toast({
        title: "Resource Fulfilled",
        description: "Resource request marked as fulfilled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update resource request.",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = allUsers.filter(u => 
    userSearchTerm === '' || 
    u.displayName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const userTypeStats = {
    citizen: allUsers.filter(u => u.userType === 'citizen').length,
    rescue_agency: allUsers.filter(u => u.userType === 'rescue_agency').length,
    admin: allUsers.filter(u => u.userType === 'admin').length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <ShieldCheck className="h-4 w-4 mr-2" />
          Administrator
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="content">
            <FileText className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <ShieldAlert className="h-4 w-4 mr-2" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allUsers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Registered users
                </p>
              </CardContent>
            </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Alerts
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Total alerts sent out
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active SOS
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{helpRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Users actively requesting help
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Resource Requests
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resourceNeeds.length}</div>
            <p className="text-xs text-muted-foreground">
              Active community requests
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
            <div className="text-2xl font-bold">{damageReports.length}</div>
            <p className="text-xs text-muted-foreground">
              Total damage reports submitted
            </p>
          </CardContent>
        </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Survivor Stories
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{survivorStories.length}</div>
                <p className="text-xs text-muted-foreground">
                  Community stories shared
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Missing Persons
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{missingPersons.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active missing person reports
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  User Types
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  C: {userTypeStats.citizen} | R: {userTypeStats.rescue_agency} | A: {userTypeStats.admin}
                </div>
                <p className="text-xs text-muted-foreground">
                  Citizens | Rescue | Admins
                </p>
              </CardContent>
            </Card>
      </div>
      
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
            <form onSubmit={handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Create New Alert</CardTitle>
                  <CardDescription>
                    Fill out the form below to send a new alert to users.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Alert Title</Label>
                    <Controller
                      name="title"
                      control={control}
                      render={({ field }) => <Input id="title" placeholder="e.g., Severe Cyclone Warning" {...field} />}
                    />
                    {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          id="description"
                          placeholder="Provide details about the alert, including safety instructions."
                          {...field}
                        />
                      )}
                    />
                    {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <Controller
                        name="severity"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                            <SelectContent>
                              {alertSeverities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.severity && <p className="text-sm text-destructive">{errors.severity.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Alert Type</Label>
                      <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {alertTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Affected Areas (Districts)</Label>
                    <Controller
                        name="affectedAreas"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={(value) => {
                              const currentAreas = field.value || [];
                              const newAreas = currentAreas.includes(value)
                                ? currentAreas.filter((a) => a !== value)
                                : [...currentAreas, value];
                              setValue('affectedAreas', newAreas, { shouldValidate: true });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select districts to add..." />
                            </SelectTrigger>
                            <SelectContent>
                              {indianDistricts.map((district) => (
                                <SelectItem key={district} value={district} disabled={selectedAreas.includes(district)}>
                                  {district}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <div className="flex gap-1 flex-wrap pt-2">
                          {selectedAreas.map(area => (
                            <Badge key={area} variant="secondary" className="cursor-pointer" onClick={() => setValue('affectedAreas', selectedAreas.filter(a => a !== area), { shouldValidate: true })}>
                              {area} &times;
                            </Badge>
                          ))}
                      </div>
                    {errors.affectedAreas && <p className="text-sm text-destructive">{errors.affectedAreas.message}</p>}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending Alert...' : 'Send Alert'}
                  </Button>
                </CardContent>
              </Card>
            </form>
        </div>
        
        <div className="lg:col-span-2 grid grid-cols-1 gap-8">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin />
                        Incidents Map
                    </CardTitle>
                </CardHeader>
                <CardContent>
                     <ResourceMap 
                        resources={resources as Resource[]} 
                        userStatuses={helpRequests} 
                        resourceNeeds={resourceNeeds} 
                        damageReports={damageReports}
                        center={mapCenter}
                        zoom={10}
                    />
                </CardContent>
            </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
         <Card>
            <CardHeader>
                <CardTitle>Sent Alerts</CardTitle>
                <CardDescription>A list of all alerts that have been sent out, including SOS signals.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p>Loading alerts...</p>
                ) : alerts.length === 0 ? (
                    <div className="text-center text-muted-foreground p-8">No alerts have been sent yet.</div>
                ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Location/Area</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {alerts.map((alert) => (
                                    <TableRow key={alert.id} className={alert.severity === 'Critical' ? 'bg-destructive/5' : ''}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {alert.severity === 'Critical' && <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0"/>}
                                                <span>{alert.title}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell><Badge variant={alert.severity === 'Critical' || alert.severity === 'High' ? 'destructive' : 'secondary'}>{alert.severity}</Badge></TableCell>
                                        <TableCell><div className="flex flex-wrap gap-1 max-w-xs">{alert.affectedAreas.map(area => <Badge key={area} variant="outline">{area}</Badge>)}</div></TableCell>
                                        <TableCell>{alert.timestamp ? format(alert.timestamp.toDate(), 'PPP p') : 'Just now'}</TableCell>
                                        <TableCell className="text-right space-x-1">
                                            {alert.severity === 'Critical' && !alert.acknowledged && (
                                                <Button variant="outline" size="sm" onClick={() => handleAcknowledge(alert.id)}>
                                                    Acknowledge
                                                </Button>
                                            )}
                                            {alert.acknowledged && (
                                                <Badge variant="secondary"><CheckCircle className="h-4 w-4 mr-1 text-green-600"/> {alert.rescueStatus || 'Acknowledged'}</Badge>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteAlert(alert.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Damage Report Severity</CardTitle>
                <CardDescription>Breakdown of submitted damage reports by AI-assessed severity.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p>Loading chart data...</p>
                ) : damageSeverityData.length === 0 ? (
                    <div className="text-center text-muted-foreground p-8">No damage reports have been submitted yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={damageSeverityData}>
                      <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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
                                <TableHead>Location (Lat, Lon)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {helpRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            {req.userName}
                                        </div>
                                    </TableCell>
                                    <TableCell>{req.timestamp ? formatDistanceToNow(req.timestamp.toDate(), {addSuffix: true}) : 'N/A'}</TableCell>
                                    <TableCell>{req.location ? `${req.location.latitude.toFixed(4)}, ${req.location.longitude.toFixed(4)}` : 'Not Available'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                {helpRequests.length === 0 && <p className="text-center text-muted-foreground py-4">No active SOS requests.</p>}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Active Resource Requests</CardTitle>
                <CardDescription>Unfulfilled requests for essential items from the community.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="max-h-[300px] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Urgency</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Location</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {resourceNeeds.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <PackageOpen className="h-4 w-4" />
                                            {req.quantity}x {req.item}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={req.urgency === 'High' ? 'destructive' : 'secondary'}>{req.urgency}</Badge>
                                    </TableCell>
                                    <TableCell>{req.contactInfo}</TableCell>
                                     <TableCell>{req.location ? `${req.location.latitude.toFixed(4)}, ${req.location.longitude.toFixed(4)}` : 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 {resourceNeeds.length === 0 && <p className="text-center text-muted-foreground py-4">No active resource requests.</p>}
            </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all registered users, change roles, and view user statistics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Badge variant="outline">Total: {allUsers.length}</Badge>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userProfile) => (
                      <TableRow key={userProfile.uid}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={userProfile.photoURL || ''} />
                              <AvatarFallback>{userProfile.displayName?.[0] || userProfile.email?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{userProfile.displayName || 'No Name'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{userProfile.email || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={userProfile.userType === 'admin' ? 'default' : 'secondary'}>
                            {userProfile.userType === 'citizen' ? 'Citizen' : 
                             userProfile.userType === 'rescue_agency' ? 'Rescue Agency' : 'Admin'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {userProfile.createdAt ? format(userProfile.createdAt instanceof Date ? userProfile.createdAt : userProfile.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={userProfile.userType}
                            onValueChange={(value) => handleUpdateUserType(userProfile.uid, value as UserType)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="citizen">Citizen</SelectItem>
                              <SelectItem value="rescue_agency">Rescue Agency</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredUsers.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">No users found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-8">
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Survivor Stories</CardTitle>
                <CardDescription>Moderate community stories and remove inappropriate content.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-y-auto space-y-4">
                  {survivorStories.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No stories submitted yet.</p>
                  ) : (
                    survivorStories.map((story) => (
                      <div key={story.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-semibold">{story.userName}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteStory(story.id!)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <h4 className="font-medium">{story.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{story.story}</p>
                        {story.timestamp && (
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(story.timestamp.toDate(), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Missing Persons</CardTitle>
                <CardDescription>Manage missing person reports and mark as resolved.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-y-auto space-y-4">
                  {missingPersons.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No missing person reports yet.</p>
                  ) : (
                    missingPersons.map((person) => (
                      <div key={person.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{person.name}</h4>
                            <p className="text-sm text-muted-foreground">Age: {person.age} | Last seen: {person.lastSeenLocation}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteMissingPerson(person.id!)}>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Contact: {person.contactInfo}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Create New Alert</CardTitle>
                      <CardDescription>
                        Fill out the form below to send a new alert to users.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="title">Alert Title</Label>
                        <Controller
                          name="title"
                          control={control}
                          render={({ field }) => <Input id="title" placeholder="e.g., Severe Cyclone Warning" {...field} />}
                        />
                        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Controller
                          name="description"
                          control={control}
                          render={({ field }) => (
                            <Textarea
                              id="description"
                              placeholder="Provide details about the alert, including safety instructions."
                              {...field}
                            />
                          )}
                        />
                        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Severity</Label>
                          <Controller
                            name="severity"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select severity" />
                                </SelectTrigger>
                                <SelectContent>
                                  {alertSeverities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.severity && <p className="text-sm text-destructive">{errors.severity.message}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label>Alert Type</Label>
                          <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {alertTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Affected Areas (Districts)</Label>
                        <Controller
                            name="affectedAreas"
                            control={control}
                            render={({ field }) => (
                              <Select
                                onValueChange={(value) => {
                                  const currentAreas = field.value || [];
                                  const newAreas = currentAreas.includes(value)
                                    ? currentAreas.filter((a) => a !== value)
                                    : [...currentAreas, value];
                                  setValue('affectedAreas', newAreas, { shouldValidate: true });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select districts to add..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {indianDistricts.map((district) => (
                                    <SelectItem key={district} value={district} disabled={selectedAreas.includes(district)}>
                                      {district}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          <div className="flex gap-1 flex-wrap pt-2">
                              {selectedAreas.map(area => (
                                <Badge key={area} variant="secondary" className="cursor-pointer" onClick={() => setValue('affectedAreas', selectedAreas.filter(a => a !== area), { shouldValidate: true })}>
                                  {area} &times;
                                </Badge>
                              ))}
                          </div>
                        {errors.affectedAreas && <p className="text-sm text-destructive">{errors.affectedAreas.message}</p>}
                      </div>

                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Sending Alert...' : 'Send Alert'}
                      </Button>
                    </CardContent>
                  </Card>
                </form>
            </div>
            
            <div className="lg:col-span-2 grid grid-cols-1 gap-8">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin />
                            Incidents Map
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ResourceMap 
                            resources={resources as Resource[]} 
                            userStatuses={helpRequests} 
                            resourceNeeds={resourceNeeds} 
                            damageReports={damageReports}
                            center={mapCenter}
                            zoom={10}
                        />
                    </CardContent>
                </Card>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Sent Alerts</CardTitle>
                    <CardDescription>A list of all alerts that have been sent out, including SOS signals.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p>Loading alerts...</p>
                    ) : alerts.length === 0 ? (
                        <div className="text-center text-muted-foreground p-8">No alerts have been sent yet.</div>
                    ) : (
                        <div className="max-h-[400px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Severity</TableHead>
                                        <TableHead>Location/Area</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {alerts.map((alert) => (
                                        <TableRow key={alert.id} className={alert.severity === 'Critical' ? 'bg-destructive/5' : ''}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {alert.severity === 'Critical' && <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0"/>}
                                                    <span>{alert.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge variant={alert.severity === 'Critical' || alert.severity === 'High' ? 'destructive' : 'secondary'}>{alert.severity}</Badge></TableCell>
                                            <TableCell><div className="flex flex-wrap gap-1 max-w-xs">{alert.affectedAreas.map(area => <Badge key={area} variant="outline">{area}</Badge>)}</div></TableCell>
                                            <TableCell>{alert.timestamp ? format(alert.timestamp.toDate(), 'PPP p') : 'Just now'}</TableCell>
                                            <TableCell className="text-right space-x-1">
                                                {alert.severity === 'Critical' && !alert.acknowledged && (
                                                    <Button variant="outline" size="sm" onClick={() => handleAcknowledge(alert.id)}>
                                                        Acknowledge
                                                    </Button>
                                                )}
                                                {alert.acknowledged && (
                                                    <Badge variant="secondary"><CheckCircle className="h-4 w-4 mr-1 text-green-600"/> {alert.rescueStatus || 'Acknowledged'}</Badge>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteAlert(alert.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
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
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {helpRequests.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                {req.userName}
                                            </div>
                                        </TableCell>
                                        <TableCell>{req.timestamp ? formatDistanceToNow(req.timestamp.toDate(), {addSuffix: true}) : 'N/A'}</TableCell>
                                        <TableCell>{req.location ? `${req.location.latitude.toFixed(4)}, ${req.location.longitude.toFixed(4)}` : 'Not Available'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {helpRequests.length === 0 && <p className="text-center text-muted-foreground py-4">No active SOS requests.</p>}
                </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure platform-wide settings and preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Platform Status</h3>
                    <p className="text-sm text-muted-foreground">Current operational status of the platform</p>
                  </div>
                  <Badge variant="outline" className="text-green-600">Operational</Badge>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Statistics Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">{allUsers.length}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Alerts</p>
                      <p className="text-2xl font-bold">{alerts.length}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Active SOS</p>
                      <p className="text-2xl font-bold text-destructive">{helpRequests.length}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Resource Requests</p>
                      <p className="text-2xl font-bold">{resourceNeeds.length}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">User Type Distribution</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Citizens</span>
                      <Badge>{userTypeStats.citizen}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Rescue Agencies</span>
                      <Badge>{userTypeStats.rescue_agency}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Admins</span>
                      <Badge variant="default">{userTypeStats.admin}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    