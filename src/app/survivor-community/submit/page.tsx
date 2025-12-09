
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, X, Camera, Award } from 'lucide-react';
import Image from 'next/image';
import { SurvivorStoryService } from '@/lib/firebase/survivor-stories';
import { serverTimestamp } from 'firebase/firestore';

const storyFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  story: z.string().min(20, 'Story must be at least 20 characters.'),
  heroName: z.string().optional(),
  heroContact: z.string().optional(),
});

type StoryFormValues = z.infer<typeof storyFormSchema>;

export default function SubmitStoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: {
      title: '',
      story: '',
      heroName: '',
      heroContact: '',
    },
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
        toast({ variant: 'destructive', title: 'Image too large', description: 'Please upload an image smaller than 4MB.' });
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

  const onSubmit = async (data: StoryFormValues) => {
    setIsSubmitting(true);
    try {
      let mediaUrl: string | undefined = undefined;
      if (imagePreview) {
        mediaUrl = await SurvivorStoryService.uploadMedia(imagePreview, user.uid);
      }

      await SurvivorStoryService.createStory({
        ...data,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userAvatarUrl: user.photoURL || undefined,
        mediaUrl,
        timestamp: serverTimestamp(),
      });

      toast({ title: 'Story Submitted', description: 'Thank you for sharing your experience with the community.' });
      router.push('/survivor-community');
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your story. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Share Your Story</h1>
        <p className="text-muted-foreground mt-2">
          Your experience can offer hope and valuable lessons to others.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Experience</CardTitle>
            <CardDescription>
              Describe what happened. All fields except the hero section are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title of Your Story</Label>
              <Controller name="title" control={control} render={({ field }) => <Input id="title" {...field} />} />
              {errors.title && <p className="text-4xl text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="story">Your Story</Label>
              <Controller name="story" control={control} render={({ field }) => <Textarea id="story" rows={8} {...field} />} />
              {errors.story && <p className="text-4xl text-destructive">{errors.story.message}</p>}
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="story-media">Add an Image (Optional)</Label>
                <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    <Input id="story-media" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} ref={fileInputRef} className="file:text-primary file:font-semibold"/>
                </div>
            </div>

            {imagePreview && (
              <div className="relative w-full max-w-sm mx-auto">
                <Image src={imagePreview} alt="Story preview" width={400} height={300} className="rounded-md object-cover aspect-video" />
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={clearImage}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-6 w-6 text-amber-500" />
              <CardTitle>Recognize a Hero (Optional)</CardTitle>
            </div>
            <CardDescription>
              Did someone help you? Give them a shout-out here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="heroName">Hero's Name</Label>
              <Controller name="heroName" control={control} render={({ field }) => <Input id="heroName" placeholder="e.g., An unknown volunteer, Ms. Sharma" {...field} />} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroContact">Hero's Contact (if known)</Label>
              <Controller name="heroContact" control={control} render={({ field }) => <Input id="heroContact" placeholder="Phone number or social media handle" {...field} />} />
              <p className="text-xs text-muted-foreground">This will NOT be displayed publicly.</p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 animate-spin" /> Submitting Story...</>
          ) : (
            <><Send className="mr-2" /> Submit Story</>
          )}
        </Button>
      </form>
    </div>
  );
}
