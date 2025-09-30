// src/hooks/use-auth.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { auth, signInWithGoogle, signOut as firebaseSignOut, handleRedirectResult } from '@/lib/firebase/auth';


type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle the redirect result when the app loads
    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle: async () => {
      await signInWithGoogle();
    },
    signOut: async () => {
      await firebaseSignOut();
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
