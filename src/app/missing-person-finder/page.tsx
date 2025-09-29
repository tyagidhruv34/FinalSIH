'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, X, UserCheck } from 'lucide-react';
import Image from 'next/image';
import { MissingPersonService } from '@/lib/firebase/missing-persons';
import { findMatchingFaces } from '@/ai/flows/find-matching-faces-flow';
import type { FindMatchingFacesOutput } from '@/ai/flows/find-matching-faces-flow';
import type { MissingPerson } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function MissingPersonFinderPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matchResult, setMatchResult] = useState<FindMatchingFacesOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [knownFaces, setKnownFaces] = useState<MissingPerson[]>([]);

  useEffect(() => {
    async function fetchKnownFaces() {
        try {
            const reports = await MissingPersonService.getReports();
            setKnownFaces(reports.filter(r => r.id && r.photoUrl && r.name && r.faceEmbedding));
        } catch (err) {
            console.error("Failed to fetch known faces:", err);
            toast({ variant: "destructive", title: "Error", description: "Could not load missing person gallery." });
        }
    }
    fetchKnownFaces();
  }, [toast]);
  
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
      setMatchResult(null);
      setError(null);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!imagePreview) {
      toast({ variant: "destructive", title: "No image selected", description: "Please upload an image to search." });
      return;
    }

    setIsSubmitting(true);
    setMatchResult(null);
    setError(null);

    try {
        const knownFacesForFlow = knownFaces.map(f => ({
            id: f.id!,
            photoUrl: f.photoUrl,
            name: f.name,
            embedding: f.faceEmbedding,
        }));

        const result = await findMatchingFaces({
            queryPhotoDataUri: imagePreview,
            knownFaces: knownFacesForFlow,
        });

        setMatchResult(result);
        toast({ title: "Search Complete", description: "AI has finished searching for matches." });
    } catch (err) {
      console.error(err);
      setError("An error occurred during the face matching process. Please try again later.");
      toast({ variant: "destructive", title: "Search Failed", description: "Could not perform the search." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Find a Missing Person</h1>
        <p className="text-muted-foreground mt-2">
          Upload a photo of a person you have found to see if they are in the missing persons database.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Upload Photo for Matching</CardTitle>
            <CardDescription>The photo you upload here will NOT be saved. It is only used for a one-time search.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="found-person-photo">Photo of Found Person</Label>
              <Input id="found-person-photo" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} ref={fileInputRef} className="file:text-primary file:font-semibold" />
              <p className="text-xs text-muted-foreground pt-1">Max file size: 4MB.</p>
            </div>

            {imagePreview && (
              <div className="relative w-full max-w-sm mx-auto">
                <Image src={imagePreview} alt="Found person preview" width={400} height={300} className="rounded-md object-cover aspect-[4/3]" />
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={clearImage}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || !imageFile || knownFaces.length === 0}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 animate-spin" /> Searching...</>
              ) : (
                <><Search className="mr-2" /> Search for Match</>
              )}
            </Button>
            {knownFaces.length === 0 && <p className="text-center text-sm text-muted-foreground">The missing persons gallery is currently empty.</p>}
          </CardContent>
        </Card>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Search Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {matchResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserCheck /> Match Results</CardTitle>
          </CardHeader>
          <CardContent>
            {matchResult.matches.length === 0 ? (
              <p className="text-muted-foreground text-center">No potential matches found in the database.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {matchResult.matches.map(match => (
                  <Card key={match.id} className="overflow-hidden">
                    <Image src={match.photoUrl} alt={match.name} width={200} height={200} className="w-full object-cover aspect-square" />
                    <div className="p-4">
                      <p className="font-bold text-lg">{match.name}</p>
                      <p className="text-sm text-muted-foreground">Confidence: <span className="font-semibold text-primary">{match.confidenceScore.toFixed(2)}%</span></p>
                      <Button className="w-full mt-2" size="sm" onClick={() => {
                        const person = knownFaces.find(p => p.id === match.id);
                        if (person) alert(`Contact information for ${person.name}'s reporter: ${person.contactInfo}`)
                      }}>
                        View Contact Info
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
