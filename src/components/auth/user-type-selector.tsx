
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Shield, UserCog } from 'lucide-react';
import type { UserType } from '@/lib/types';
import { SaffronFlag } from '@/components/ui/saffron-flag';

interface UserTypeSelectorProps {
  onSelect: (userType: UserType) => void;
}

export default function UserTypeSelector({ onSelect }: UserTypeSelectorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-[#FF9933]/10 via-[#FFFFFF]/5 to-[#138808]/10">
      <div className="w-full max-w-2xl space-y-8 animate-fade-in">
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-[#FF9933] to-[#FF9933]/80 shadow-2xl mb-4">
            <SaffronFlag size={40} />
          </div>
          <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-[#FF9933] via-[#138808] to-[#FF9933] bg-clip-text text-transparent">Sankat Mochan</h1>
          <p className="text-muted-foreground text-xl font-semibold">Disaster Management Platform</p>
        </div>
        
        <Card className="shadow-2xl border-2">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold">Select Your Role</CardTitle>
            <CardDescription className="text-base mt-2">Choose how you want to access the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-auto p-7 flex flex-col items-start gap-4 hover:bg-gradient-to-r hover:from-[#FF9933] hover:to-[#FF9933]/90 hover:text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-xl border-3 border-[#FF9933]/30 group"
              onClick={() => onSelect('citizen')}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#FF9933]/20 to-[#FF9933]/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Users className="h-7 w-7 text-[#FF9933] group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-xl group-hover:text-white transition-colors">Citizen</div>
                  <div className="text-base text-muted-foreground group-hover:text-white/90 transition-colors mt-1">Access alerts, resources, and community features</div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-auto p-6 flex flex-col items-start gap-3 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-2 group"
              onClick={() => onSelect('rescue_agency')}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-lg group-hover:text-primary-foreground transition-colors">Rescue Agency</div>
                  <div className="text-sm text-muted-foreground group-hover:text-primary-foreground/80 transition-colors mt-1">Manage rescue operations and coordinate responses</div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-auto p-6 flex flex-col items-start gap-3 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-2 group"
              onClick={() => onSelect('admin')}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <UserCog className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-lg group-hover:text-primary-foreground transition-colors">Admin</div>
                  <div className="text-sm text-muted-foreground group-hover:text-primary-foreground/80 transition-colors mt-1">Manage platform settings and user access</div>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


