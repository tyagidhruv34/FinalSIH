'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send } from 'lucide-react';
import { FeedbackService } from '@/lib/firebase/feedback';

export default function FeedbackPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authLoading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empty Feedback',
        description: 'Please write your feedback before submitting.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await FeedbackService.submitFeedback({
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        message,
      });

      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your valuable feedback!',
      });
      setMessage('');
      router.push('/');
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not submit your feedback. Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Submit Feedback</h1>
        <p className="text-muted-foreground mt-2">
          Have a suggestion or found a bug? Let us know.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Your Feedback</CardTitle>
            <CardDescription>
              We appreciate you taking the time to help us improve.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="feedback-message">Message</Label>
              <Textarea
                id="feedback-message"
                placeholder="Tell us what you think..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2" /> Submit Feedback
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
