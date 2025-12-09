
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, User, Award, HeartHandshake } from "lucide-react";
import Link from 'next/link';
import { SurvivorStoryService } from '@/lib/firebase/survivor-stories';
import type { SurvivorStory } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { Timestamp } from 'firebase/firestore';


const demoStories: SurvivorStory[] = [
  {
    id: 'story-1',
    userId: 'user-1',
    userName: 'Anjali Sharma',
    userAvatarUrl: 'https://picsum.photos/seed/demo-avatar1/40/40',
    title: 'Rescued from the Rooftops',
    story: 'The water rose so fast. We were trapped on our roof for what felt like days. We are so grateful for the NDRF team who spotted us and brought us to safety. Their bravery was incredible.',
    mediaUrl: 'https://picsum.photos/seed/story1/400/300',
    heroName: 'NDRF Team Bravo',
    timestamp: Timestamp.fromMillis(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: 'story-2',
    userId: 'user-2',
    userName: 'Rajesh Verma',
    userAvatarUrl: 'https://picsum.photos/seed/demo-avatar2/40/40',
    title: 'A Stranger\'s Kindness',
    story: 'My shop was flooded, and I lost everything. A young man I\'d never met, Rohan, helped me salvage what I could and shared his own food and water. He didn\'t have to, but he did. He is a true hero.',
    heroName: 'Rohan',
    timestamp: Timestamp.fromMillis(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
  },
  {
    id: 'story-3',
    userId: 'user-3',
    userName: 'Priya Desai',
    userAvatarUrl: 'https://picsum.photos/seed/demo-avatar3/40/40',
    title: 'Community Comes Together',
    story: 'Our entire neighborhood was cut off. But everyone came together. We pooled our resources, looked after the elderly, and kept each other\'s spirits up. It showed me the true power of community.',
    mediaUrl: 'https://picsum.photos/seed/story3/400/300',
    timestamp: Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  }
];


export default function SurvivorCommunityPage() {
  const { user } = useAuth();
  const [stories, setStories] = useState<SurvivorStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        // Using hardcoded data for demo purposes
        // In a real scenario, you'd switch back to fetching from the service
        const fetchedStories = await SurvivorStoryService.getStories();
        setStories([...demoStories, ...fetchedStories]);
        setError(null);
      } catch (err) {
        // Fallback to demo data if fetching fails
        setStories(demoStories);
        setError('Could not connect to live stories. Displaying examples.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);
  
  const heroes = stories.filter(s => s.heroName).slice(0, 5); // Get top 5 heroes

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <HeartHandshake className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Survivor Community</h1>
            <p className="text-muted-foreground">
              Share stories of hope, resilience, and heroism.
            </p>
          </div>
        </div>
        <Button asChild disabled={!user}>
          <Link href="/survivor-community/submit">
            <PlusCircle className="mr-2" />
            Share Your Story
          </Link>
        </Button>
      </div>
      
      {/* Heroes of the Community Section */}
      <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/30 border-amber-300 dark:border-amber-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Award className="h-12 w-12 text-amber-500" />
            <CardTitle className="text-4xl text-amber-800 dark:text-amber-300">Heroes of the Community</CardTitle>
          </div>
          <CardDescription className="text-amber-700 dark:text-amber-400">Celebrating individuals who went above and beyond to help.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
          ) : heroes.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {heroes.map(heroStory => (
                <div key={heroStory.id} className="flex flex-col items-center text-center gap-2 p-4 bg-background/50 rounded-lg">
                  <Avatar className="h-16 w-16 border-2 border-amber-400">
                     <AvatarFallback><User /></AvatarFallback>
                  </Avatar>
                  <p className="font-bold text-4xl">{heroStory.heroName}</p>
                  <p className="text-xs text-muted-foreground">Nominated by {heroStory.userName}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No heroes have been nominated yet. Be the first to share a story!</p>
          )}
        </CardContent>
      </Card>


      {/* Survivor Stories Section */}
      <div>
        <h2 className="text-4xl font-semibold tracking-tight mb-4">Latest Stories</h2>
        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-5 w-40 mb-4" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {error && <p className="text-destructive text-center">{error}</p>}
        {!loading && stories.length === 0 && (
          <Card className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
              <p>No stories have been shared yet.</p>
              <p>Be the first to share your experience.</p>
            </div>
          </Card>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map(story => (
            <Card key={story.id} className="flex flex-col">
              {story.mediaUrl && (
                <div className="aspect-video relative w-full">
                    <Image src={story.mediaUrl} alt={story.title} layout="fill" className="rounded-t-lg object-cover" />
                </div>
              )}
              <CardHeader className="flex flex-row items-center gap-3">
                <Avatar>
                  <AvatarImage src={story.userAvatarUrl} alt={story.userName} />
                  <AvatarFallback>{story.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{story.userName}</p>
                   {story.timestamp && (
                    <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(story.timestamp.toDate())} ago
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <h3 className="font-bold text-4xl mb-2">{story.title}</h3>
                <p className="text-4xl text-foreground/80 line-clamp-4">{story.story}</p>
              </CardContent>
              {story.heroName && (
                <CardFooter className="flex items-center gap-2 text-4xl text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 pt-4">
                    <Award className="h-5 w-5" />
                    <p>Recognized <span className="font-bold">{story.heroName}</span> as a hero.</p>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
