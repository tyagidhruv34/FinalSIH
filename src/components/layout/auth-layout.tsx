"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { SidebarProvider } from '@/components/ui/sidebar';
import SidebarNav from '@/components/layout/sidebar-nav';
import Header from '@/components/layout/header';
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { SaffronFlag } from '@/components/ui/saffron-flag';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  // Show login page without layout
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Show loading state - optimized with minimal rendering and faster display
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#FF9933]/10 via-[#FFFFFF]/5 to-[#138808]/10">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-[#FF9933] to-[#FF9933]/80 shadow-lg animate-pulse">
            <SaffronFlag size={40} />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">Loading...</p>
            <div className="flex justify-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#FF9933] animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="h-3 w-3 rounded-full bg-[#138808] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-3 w-3 rounded-full bg-[#FF9933] animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If not logged in, show app name with login button
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#FF9933]/10 via-[#FFFFFF]/5 to-[#138808]/10">
        <div className="text-center space-y-8 p-8 animate-fade-in">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-[#FF9933] to-[#FF9933]/80 shadow-2xl mb-4 animate-pulse">
            <SaffronFlag size={48} />
          </div>
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-[#FF9933] via-[#138808] to-[#FF9933] bg-clip-text text-transparent">
              Sankat Mochan
            </h1>
            <p className="text-muted-foreground text-2xl font-semibold">Disaster Management Platform</p>
            <p className="text-base text-muted-foreground/80 max-w-md mx-auto pt-2">
              Your trusted companion during emergencies. Stay informed, stay safe, stay connected.
            </p>
          </div>
          <div className="pt-6">
            <Link 
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#FF9933] to-[#FF9933]/90 px-12 py-5 text-lg font-bold text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 hover:from-[#FF9933]/90 hover:to-[#FF9933] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF9933]/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Get Started
              <svg className="ml-2 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground pt-4">
            Click "Get Started" to select your role and login
          </p>
        </div>
      </div>
    );
  }

  // If logged in, show full layout
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <SidebarNav />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}


