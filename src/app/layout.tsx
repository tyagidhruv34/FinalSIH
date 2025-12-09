
import type { Metadata, Viewport } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/hooks/use-auth';
import { LanguageProvider } from '@/hooks/use-language';
import AuthLayout from '@/components/layout/auth-layout';
import ChatbotWrapper from '@/components/chatbot-wrapper';

// Leaflet CSS - load only when map is used
// Moved to resource-map component

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
});


export const metadata: Metadata = {
  title: 'Sankat Mochan',
  description: 'A disaster management app to help you stay safe.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("antialiased", 'min-h-screen bg-background font-sans', ptSans.variable)}>
        <AuthProvider>
          <LanguageProvider>
            <AuthLayout>
              {children}
            </AuthLayout>
            <ChatbotWrapper />
          </LanguageProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
