'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ResourceNeedService } from '@/lib/firebase/resource-needs';
import { GeoPoint, serverTimestamp } from 'firebase/firestore';

const resourceNeedSchema = z.object({
  item: z.enum(['Food', 'Water', 'Medicine', 'Shelter']),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  urgency: z.enum(['Low', 'Medium', 'High']),
  contactInfo: z.string().min(10, 'Please provide valid contact information.'),
});

type ResourceNeedFormValues = z.infer<typeof resourceNeedSchema>;

type RequestResourceFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function RequestResourceForm({ open, onOpenChange }: RequestResourceFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset, setValue } = useForm<ResourceNeedFormValues>({
    resolver: zodResolver(resourceNeedSchema),
    defaultValues: {
        item: 'Water',
        quantity: 1,
        urgency: 'Medium',
        contactInfo: '',
    }
  });

  useEffect(() => {
    if (open) {
      // Reset state and prefill contact info when dialog opens
      setLocation(null);
      setIsLocationLoading(true);
      if(user && (user.email || user.phoneNumber)) {
        setValue('contactInfo', user.email || user.phoneNumber || '');
      }
      
      // Pre-fetch location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(new GeoPoint(position.coords.latitude, position.coords.longitude));
          setIsLocationLoading(false);
        },
        (err) => {
          console.warn(`ERROR(${err.code}): ${err.message}`);
          setIsLocationLoading(false);
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Could not get your location. Your request will be submitted without location data.",
          });
        }
      );
    }
  }, [open, toast, user, setValue]);

  const onSubmit = async (data: ResourceNeedFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to make a request.' });
      return;
    }

    setIsSubmitting(true);

    try {
      await ResourceNeedService.createResourceNeed({
        ...data,
        userId: user.uid,
        location: location, // This can be null, the service/type needs to allow it
        fulfilled: false,
        timestamp: serverTimestamp(),
      });
      toast({
        title: 'Request Submitted',
        description: 'Your resource need has been posted.',
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating resource need: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not submit your request.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            reset();
            setLocation(null);
            setIsLocationLoading(false);
        }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a Resource</DialogTitle>
          <DialogDescription>
            Let the community know what you need. Your location will be shared if available.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Item</Label>
            <Controller
              name="item"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger><SelectValue placeholder="Select an item" /></SelectTrigger>
                  <SelectContent>
                    {['Food', 'Water', 'Medicine', 'Shelter'].map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.item && <p className="text-sm text-destructive">{errors.item.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Controller name="quantity" control={control} render={({ field }) => <Input id="quantity" type="number" {...field} />} />
            {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Urgency</Label>
            <Controller
              name="urgency"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Low', 'Medium', 'High'].map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
             {errors.urgency && <p className="text-sm text-destructive">{errors.urgency.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactInfo">Contact Info</Label>
            <Controller name="contactInfo" control={control} render={({ field }) => <Input id="contactInfo" placeholder="Your phone or email" {...field} />} />
            {errors.contactInfo && <p className="text-sm text-destructive">{errors.contactInfo.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || isLocationLoading}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 animate-spin" /> Submitting...</>
              ) : isLocationLoading ? (
                <><Loader2 className="mr-2 animate-spin" /> Getting Location...</>
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
