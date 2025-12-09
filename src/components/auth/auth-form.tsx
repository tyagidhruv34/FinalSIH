
// src/components/auth/auth-form.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signUpWithEmail, signInWithEmail } from '@/lib/firebase/auth';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserType } from '@/lib/types';

interface AuthFormProps {
  userType: UserType;
  onBack?: () => void;
}

export default function AuthForm({ userType, onBack }: AuthFormProps) {
  const { user, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  // States for email/password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [activeTab, setActiveTab] = useState('signin');
  
  useEffect(() => {
    if(user) {
      router.push('/');
    }
  }, [user, router]);


  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle(userType);
      router.push('/');
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
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
          description: 'An unexpected error occurred. Please ensure your Vercel domain is an authorized domain in your Firebase project settings.',
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
            await signUpWithEmail(email, password, displayName, userType);
            toast({ title: 'Success!', description: 'Your account has been created.' });
            router.push('/');
        } else {
            await signInWithEmail(email, password, userType);
            toast({ title: 'Success!', description: 'You are now logged in.' });
            router.push('/');
        }
    } catch (error: any) {
        let friendlyMessage = 'An unexpected error occurred.';
        if(error.code) {
            switch(error.code) {
                case 'auth/email-already-in-use':
                    friendlyMessage = 'This email is already registered. Switching to sign in...';
                    setActiveTab('signin'); // Switch to sign-in tab
                    // Pre-fill email for convenience
                    // Email is already set in state, so it will be preserved
                    break;
                case 'auth/invalid-email':
                    friendlyMessage = 'Please enter a valid email address.';
                    break;
                case 'auth/weak-password':
                    friendlyMessage = 'The password is too weak. Please use at least 6 characters.';
                    break;
                case 'auth/operation-not-allowed':
                    friendlyMessage = 'Sign in with email/password is not enabled. Please contact support.';
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


  const getUserTypeLabel = () => {
    switch (userType) {
      case 'citizen': return 'Citizen';
      case 'rescue_agency': return 'Rescue Agency';
      case 'admin': return 'Admin';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 animate-fade-in">
        <CardHeader className="text-center relative pb-6">
          {onBack && (
            <Button variant="ghost" size="icon" className="absolute left-4 top-4 hover:bg-primary/10 transition-colors" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mb-4">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Welcome to Sankat Mochan</CardTitle>
          <CardDescription className="text-base mt-2 font-medium">Sign in as {getUserTypeLabel()}</CardDescription>
        </CardHeader>
        <CardContent>
    <div className="space-y-6">
      <Button variant="outline" className="w-full shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] border-2" onClick={handleGoogleSignIn}>
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
        </CardContent>
      </Card>
    </div>
  );
}
