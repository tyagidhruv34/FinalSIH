'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, X } from 'lucide-react';
import Image from 'next/image';
import { MissingPersonService } from '@/lib/firebase/missing-persons';
import { extractFaceEmbeddings } from '@/ai/flows/extract-face-embeddings-flow';
import { serverTimestamp } from 'firebase/firestore';

const reportFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  age: z.coerce.number().min(0).max(120),
  lastSeenLocation: z.string().min(5, { message: 'Please provide a more detailed location.' }),
  contactInfo: z.string().min(10, { message: 'Please provide valid contact information.' }),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

export default function MissingPersonReportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { control, handleSubmit, formState: { errors } } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
  });

  if (authLoading) return <p>Loading...</p>;
  if (!user) {
    router.push('/login');
    return null;
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({ variant: "destructive", title: "Image too large", description: "Please upload an image smaller than 4MB." });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: ReportFormValues) => {
    if (!imagePreview) {
      toast({ variant: "destructive", title: "No Image", description: "Please upload a photo of the missing person." });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Get face embedding
      const { faceEmbedding } = await extractFaceEmbeddings({ photoDataUri: imagePreview });
      
      // 2. Upload photo to Storage
      const photoUrl = await MissingPersonService.uploadPhoto(imagePreview, user.uid);
      
      // 3. Save report to Firestore
      await MissingPersonService.createReport({
        ...data,
        reportedBy: user.uid,
        photoUrl,
        faceEmbedding,
        timestamp: serverTimestamp(),
      });
      
      toast({ title: "Report Submitted", description: "The missing person report has been successfully filed." });
      router.push('/');

    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Submission Failed", description: "Could not submit the report. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Report a Missing Person</h1>
        <p className="text-muted-foreground mt-2">
          Provide details and a clear photo to help find them.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Missing Person Details</CardTitle>
            <CardDescription>
              All fields are required. This information will be used to match with found individuals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="missing-person-photo">Photo</Label>
              <Input id="missing-person-photo" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} ref={fileInputRef} className="file:text-primary file:font-semibold" />
              <p className="text-xs text-muted-foreground pt-1">Max file size: 4MB. Use a clear, front-facing photo.</p>
            </div>

            {imagePreview && (
              <div className="relative w-full max-w-sm mx-auto">
                <Image src={imagePreview} alt="Missing person preview" width={400} height={300} className="rounded-md object-cover aspect-[4/3]" />
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={clearImage}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} />} />
              {errors.name && <p className="text-4xl text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age (Approximate)</Label>
              <Controller name="age" control={control} render={({ field }) => <Input id="age" type="number" {...field} />} />
              {errors.age && <p className="text-4xl text-destructive">{errors.age.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastSeenLocation">Last Seen Location</Label>
              <Controller name="lastSeenLocation" control={control} render={({ field }) => <Input id="lastSeenLocation" {...field} />} />
              {errors.lastSeenLocation && <p className="text-4xl text-destructive">{errors.lastSeenLocation.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contactInfo">Your Contact Information</Label>
              <Controller name="contactInfo" control={control} render={({ field }) => <Input id="contactInfo" placeholder="e.g., Phone number or email" {...field} />} />
              {errors.contactInfo && <p className="text-4xl text-destructive">{errors.contactInfo.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !imageFile}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 animate-spin" /> Submitting Report...</>
              ) : (
                <><UserPlus className="mr-2" /> Submit Report</>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
