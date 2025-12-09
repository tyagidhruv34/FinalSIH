"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from "@/components/auth/auth-form";
import UserTypeSelector from "@/components/auth/user-type-selector";
import { useAuth } from '@/hooks/use-auth';
import type { UserType } from '@/lib/types';

export default function LoginPage() {
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(null);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  if (!selectedUserType) {
    return <UserTypeSelector onSelect={setSelectedUserType} />;
  }

  return <AuthForm userType={selectedUserType} onBack={() => setSelectedUserType(null)} />;
}
