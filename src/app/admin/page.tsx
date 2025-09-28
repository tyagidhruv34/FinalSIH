'use client';

import { useState } from 'react';
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
import type { Alert } from '@/lib/types';


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

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<AlertFormValues>({
    resolver: zodResolver(alertFormSchema),
    defaultValues: {
      affectedAreas: [],
    }
  });
  
  const selectedAreas = watch('affectedAreas');

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
        // Here you would trigger the cloud function implicitly
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

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Admin Alert Panel</h1>
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
                        <SelectValue placeholder="Select districts..." />
                      </SelectTrigger>
                      <SelectContent>
                        {indianDistricts.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <div className="flex gap-1 flex-wrap mt-2">
                    {selectedAreas.map(area => <Badge key={area} variant="secondary">{area}</Badge>)}
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
  );
}
