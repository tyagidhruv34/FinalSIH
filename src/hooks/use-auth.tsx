// src/hooks/use-auth.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, signOut as firebaseSignOut, signInWithPhone, verifyOtp } from '@/lib/firebase/auth';
import type { AuthContextType } from '@/lib/types';
import { useRouter } from 'next/navigation';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (!user) {
        // Optionally redirect to login if not authenticated
        // This can be adjusted based on which pages are public/private
        // router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle: async () => {
      await signInWithGoogle();
      router.push('/profile');
    },
    signInWithPhone,
    verifyOtp: async (confirmationResult, otp) => {
        await verifyOtp(confirmationResult, otp);
        router.push('/profile');
    },
    signOut: async () => {
      await firebaseSignOut();
      router.push('/login');
    },
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
