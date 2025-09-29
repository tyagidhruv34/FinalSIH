
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
import { DamageReportService } from '@/lib/firebase/damage-reports';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { Alert, DamageReport } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Trash2, ShieldAlert, BarChart3, Building2 } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"


const alertFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  severity: z.enum(alertSeverities),
  type: z.enum(alertTypes),
  affectedAreas: z.array(z.string()).min(1, { message: "Please select at least one affected area." }),
});

type AlertFormValues = z.infer<typeof alertFormSchema>;

export default function AdminAlertPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { control, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<AlertFormValues>({
    resolver: zodResolver(alertFormSchema),
    defaultValues: {
      affectedAreas: [],
    }
  });
  
  const selectedAreas = watch('affectedAreas');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fetchedAlerts, fetchedReports] = await Promise.all([
        AlertService.getAlerts(),
        DamageReportService.getDamageReports()
      ]);
      setAlerts(fetchedAlerts);
      setDamageReports(fetchedReports);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }
  
  const onSubmit = async (data: AlertFormValues) => {
    setIsSubmitting(true);
    try {
        const alertData: Omit<Alert, 'id' | 'timestamp'> = {
            ...data,
            createdBy: user.uid,
        };
        await AlertService.createAlert(alertData);
        toast({
            title: "Success!",
            description: "Alert has been created and sent successfully.",
        });
        reset();
        fetchData(); // Refresh all data
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
    if (!window.confirm("Are you sure you want to delete this alert?")) return;

    try {
      await AlertService.deleteAlert(alertId);
      toast({
        title: "Alert Deleted",
        description: "The alert has been successfully deleted.",
      });
      fetchData(); // Refresh all data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the alert.",
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


  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      </div>
      
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
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
        
        <div className="lg:col-span-3 grid grid-cols-1 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Sent Alerts</CardTitle>
                    <CardDescription>A list of all alerts that have been sent out.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p>Loading alerts...</p>
                    ) : alerts.length === 0 ? (
                        <p>No alerts have been sent yet.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {alerts.map((alert) => (
                                    <TableRow key={alert.id}>
                                        <TableCell className="font-medium">{alert.title}</TableCell>
                                        <TableCell><Badge variant={alert.severity === 'Critical' || alert.severity === 'High' ? 'destructive' : 'secondary'}>{alert.severity}</Badge></TableCell>
                                        <TableCell>{format(alert.timestamp.toDate(), 'PPP p')}</TableCell>
                                        <TableCell className="text-right">
                                          <Button variant="ghost" size="icon" onClick={() => handleDeleteAlert(alert.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
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
                        <p>No damage reports have been submitted yet.</p>
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
                          <Bar dataKey="total" fill="#ea580c" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

    