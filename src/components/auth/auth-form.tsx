// src/components/auth/auth-form.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { auth, signUpWithEmail, signInWithEmail } from '@/lib/firebase/auth';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export default function AuthForm() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // States for email/password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [activeTab, setActiveTab] = useState('signin');


  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error?.code === 'auth/cancelled-popup-request' || error?.code === 'auth/popup-closed-by-user') {
        toast({
          variant: 'default',
          title: 'Sign-in Cancelled',
          description: 'You closed the sign-in window before completing the process.',
        });
      } else {
        console.error('Error signing in with Google', error);
        toast({
          variant: 'destructive',
          title: 'Sign-in Error',
          description: 'An unexpected error occurred during sign-in. Your Vercel domain might need to be authorized in the Firebase console.',
        });
      }
    }
  };
  
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        if (activeTab === 'signup') {
            if (!displayName) {
                toast({ variant: 'destructive', title: 'Error', description: 'Display name is required.'});
                setLoading(false);
                return;
            }
            await signUpWithEmail(email, password, displayName);
            toast({ title: 'Success!', description: 'Your account has been created.' });
        } else {
            await signInWithEmail(email, password);
            toast({ title: 'Success!', description: 'You are now logged in.' });
        }
    } catch (error: any) {
        let friendlyMessage = 'An unexpected error occurred.';
        if(error.code) {
            switch(error.code) {
                case 'auth/email-already-in-use':
                    friendlyMessage = 'This email is already in use. Please sign in instead.';
                    break;
                case 'auth/invalid-email':
                    friendlyMessage = 'Please enter a valid email address.';
                    break;
                case 'auth/weak-password':
                    friendlyMessage = 'The password is too weak. Please use at least 6 characters.';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    friendlyMessage = 'Invalid email or password.';
                    break;
                default:
                    friendlyMessage = error.message;
            }
        }
        toast({ variant: 'destructive', title: 'Authentication Error', description: friendlyMessage });
        console.error(error);
    } finally {
        setLoading(false);
    }
  }


  return (
    <div className="space-y-6">
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
        <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          <path fill="none" d="M0 0h48v48H0z"></path>
        </svg>
        Sign in with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
            <form onSubmit={handleEmailAuth} className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="email-signin">Email</Label>
                    <Input id="email-signin" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="password-signin">Password</Label>
                    <Input id="password-signin" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 animate-spin" />}
                    Sign In
                </Button>
            </form>
        </TabsContent>
        <TabsContent value="signup">
             <form onSubmit={handleEmailAuth} className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="displayName-signup">Display Name</Label>
                    <Input id="displayName-signup" type="text" placeholder="Your Name" value={displayName} onChange={e => setDisplayName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input id="email-signup" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="password-signup">Password</Label>
                    <Input id="password-signup" type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                     {loading && <Loader2 className="mr-2 animate-spin" />}
                    Create Account
                </Button>
            </form>
        </TabsContent>
      </Tabs>

    </div>
  );
}
