'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldAlert, Activity, Users, Truck } from 'lucide-react';
import { predictImpact } from '@/ai/flows/predict-impact-flow';
import type { PredictImpactOutput } from '@/ai/flows/predict-impact-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const assessmentFormSchema = z.object({
  locationDescription: z.string().min(10, { message: 'Please provide a more detailed description.' }),
  disasterType: z.enum(['Cyclone', 'Flood', 'Earthquake', 'Wildfire', 'Landslide']),
});

type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;

const recommendationStyles = {
    None: 'text-green-600',
    Voluntary: 'text-yellow-600',
    Recommended: 'text-orange-600',
    Mandatory: 'text-red-600 font-bold',
}

export default function RiskAssessmentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PredictImpactOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      locationDescription: '',
      disasterType: 'Cyclone',
    }
  });

  if (authLoading) return <p>Loading...</p>;
  if (!user) {
    router.push('/login');
    return null;
  }

  const onSubmit = async (data: AssessmentFormValues) => {
    setIsSubmitting(true);
    setAnalysisResult(null);
    setError(null);

    try {
      const result = await predictImpact(data);
      setAnalysisResult(result);
      toast({
        title: 'Assessment Complete',
        description: 'AI has generated a risk profile for the area.',
      });
    } catch (err) {
      console.error(err);
      setError('An error occurred during the analysis. Please try again later.');
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not generate the risk assessment.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">AI Hyper-Local Risk Assessment</h1>
        <p className="text-muted-foreground mt-2">
          Predict potential disaster impact on a specific area. (Prototype)
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Analyze an Area</CardTitle>
            <CardDescription>
              Describe a specific location and the type of disaster to generate a risk profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="locationDescription">Location Description</Label>
              <Controller
                name="locationDescription"
                control={control}
                render={({ field }) => (
                  <Input
                    id="locationDescription"
                    placeholder="e.g., Coastal fishing village in Puri district, Odisha"
                    {...field}
                  />
                )}
              />
              {errors.locationDescription && (
                <p className="text-sm text-destructive">{errors.locationDescription.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Impending Disaster</Label>
              <Controller
                name="disasterType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select disaster type" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Cyclone', 'Flood', 'Earthquake', 'Wildfire', 'Landslide'].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.disasterType && (
                <p className="text-sm text-destructive">{errors.disasterType.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <ShieldAlert className="mr-2" /> Assess Risk
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
            <CardTitle>AI Risk Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
                    <Label className="text-sm font-semibold text-muted-foreground">RISK SCORE</Label>
                    <p className="text-7xl font-bold text-primary">{analysisResult.riskScore}</p>
                    <p className="text-sm text-muted-foreground">out of 100</p>
                </div>
                <div>
                     <Label className="text-xs font-semibold text-muted-foreground">Evacuation</Label>
                     <p className={`text-2xl font-bold ${recommendationStyles[analysisResult.evacuationRecommendation]}`}>{analysisResult.evacuationRecommendation}</p>
                </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Potential Impact</Label>
              <p className="text-sm text-foreground/90 bg-muted/50 p-3 rounded-md border">{analysisResult.potentialImpact}</p>
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
