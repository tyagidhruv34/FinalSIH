
// src/hooks/use-auth.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, signOut as firebaseSignOut, getUserProfile } from '@/lib/firebase/auth';
import type { UserType } from '@/lib/types';


type AuthContextType = {
  user: User | null;
  userType: UserType | null;
  loading: boolean;
  signInWithGoogle: (userType: UserType) => Promise<void>;
  signOut: () => Promise<void>;
};


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileCache, setProfileCache] = useState<Map<string, UserType>>(new Map());

  useEffect(() => {
    let isMounted = true;
    
    // Only set up auth listener if auth is initialized
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      
      setUser(user);
      if (user) {
        // Check cache first
        const cachedType = profileCache.get(user.uid);
        if (cachedType) {
          if (isMounted) {
            setUserType(cachedType);
            setLoading(false);
          }
        } else {
          // Fetch user profile to get userType
          try {
            const profile = await getUserProfile(user.uid);
            const type = profile?.userType || null;
            if (type && isMounted) {
              setProfileCache(prev => new Map(prev).set(user.uid, type));
              setUserType(type);
            } else if (isMounted) {
              setUserType(null);
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            if (isMounted) {
              setUserType(null);
            }
          }
          if (isMounted) {
            setLoading(false);
          }
        }
      } else {
        if (isMounted) {
          setUserType(null);
      setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    userType,
    loading,
    signInWithGoogle: async (userType: UserType) => {
      if (!auth) {
        console.error('Firebase Auth is not initialized');
        return;
      }
      await signInWithGoogle(userType);
      // Refresh user type after sign in
      if (auth && auth.currentUser) {
        const profile = await getUserProfile(auth.currentUser.uid);
        setUserType(profile?.userType || null);
      }
    },
    signOut: async () => {
      if (!auth) return;
      await firebaseSignOut();
      setUserType(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
