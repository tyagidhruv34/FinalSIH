'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X, Bot, Percent, FileCheck2 } from 'lucide-react';
import Image from 'next/image';
import { assessDamage } from '@/ai/flows/assess-damage-flow';
import type { AssessDamageOutput } from '@/ai/flows/assess-damage-flow';
import { GeoPoint, serverTimestamp } from 'firebase/firestore';
import { DamageReportService } from '@/lib/firebase/damage-reports';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DamageAssessmentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AssessDamageOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationError(null);
      },
      (err) => {
        const errorMessage = "Could not get your location. Analysis will proceed without location data, and the report will not be saved to the database.";
        console.warn(`ERROR(${err.code}): ${err.message}`);
        setLocationError(errorMessage);
        toast({
            variant: "destructive",
            title: "Location Error",
            description: errorMessage,
        });
      }
    );
  }, [toast]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          variant: "destructive",
          title: "Image too large",
          description: "Please upload an image smaller than 4MB.",
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setAnalysisResult(null);
      setError(null);
    }
  };
  
  const clearImage = () => {
      setImageFile(null);
      setImagePreview(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!imagePreview) {
      toast({
        variant: "destructive",
        title: "No image selected",
        description: "Please upload an image to assess.",
      });
      return;
    }

    setIsSubmitting(true);
    setAnalysisResult(null);
    setError(null);

    try {
      const geoPoint = location ? new GeoPoint(location.latitude, location.longitude) : undefined;
      
      const result = await assessDamage({
        photoDataUri: imagePreview,
        description: description,
        location: geoPoint,
      });
      
      setAnalysisResult(result);

      if (geoPoint) {
         // Save report to Firestore only if location is available
        await DamageReportService.createDamageReport({
            userId: user!.uid,
            description,
            imageUrl: imagePreview, // In a real app, upload to storage and save URL
            location: geoPoint,
            assessment: result,
            timestamp: serverTimestamp(),
        });
         toast({
            title: "Analysis Complete & Saved",
            description: "The AI has assessed the damage and the report has been saved.",
         });
      } else {
         toast({
            title: "Analysis Complete",
            description: "The AI has assessed the damage. Report was not saved because location was unavailable.",
            variant: "default"
         });
      }

    } catch (err) {
      console.error(err);
      setError("An error occurred during the analysis. The AI model may be unavailable. Please try again later.");
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not assess the damage. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (authLoading) {
      return <p>Loading...</p>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">AI Damage Assessment</h1>
        <p className="text-muted-foreground mt-2">
          Upload an image of structural damage to get an AI-powered assessment.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Submit a Damage Report</CardTitle>
            <CardDescription>
              Provide an image and an optional description of the damage. Reports are only saved if location is available.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="damage-image">Damage Image</Label>
              <Input id="damage-image" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} ref={fileInputRef} className="file:text-primary file:font-semibold"/>
               <p className="text-xs text-muted-foreground pt-1">
                {location ? "Your current location will be attached to the report." : "Attempting to get your location..."}
                {locationError && <span className="text-destructive"> {locationError}</span>}
               </p>
            </div>

            {imagePreview && (
                <div className="relative w-full max-w-sm mx-auto">
                    <Image src={imagePreview} alt="Damage preview" width={400} height={300} className="rounded-md object-cover aspect-video" />
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={clearImage}>
                        <X className="h-4 w-4"/>
                    </Button>
                </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="e.g., 'Cracks on the west-facing wall of the main building.' or 'Bridge appears to be washed out.'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting || !imageFile}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Bot className="mr-2" /> Assess Damage
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>

      {error && (
        <Alert variant="destructive">
            <AlertTitle>Analysis Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileCheck2/> Assessment Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
                <Label className="text-xs font-semibold text-muted-foreground">Severity</Label>
                <p className="text-2xl font-bold text-primary">{analysisResult.severity}</p>
             </div>
             <div>
                <Label className="text-xs font-semibold text-muted-foreground">Confidence</Label>
                <div className="flex items-center gap-2">
                    <Percent className="h-5 w-5 text-muted-foreground"/>
                    <p className="text-xl font-semibold">{analysisResult.confidenceScore.toFixed(2)}%</p>
                </div>
             </div>
             <div>
                <Label className="text-xs font-semibold text-muted-foreground">AI Reasoning</Label>
                <p className="text-sm text-foreground/90 bg-muted/50 p-3 rounded-md border">{analysisResult.reasoning}</p>
             </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
