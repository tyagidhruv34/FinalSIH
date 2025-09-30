
import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import SidebarNav from '@/components/layout/sidebar-nav';
import Header from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/hooks/use-auth';
import { LanguageProvider } from '@/hooks/use-language';
import Chatbot from '@/components/chatbot';


// Leaflet CSS for react-leaflet
import 'leaflet/dist/leaflet.css';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
});


export const metadata: Metadata = {
  title: 'Sankat Mochan',
  description: 'A disaster management app to help you stay safe.',
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
            <SidebarProvider>
                <div className="flex min-h-screen w-full">
                  <SidebarNav />
                  <div className="flex flex-1 flex-col">
                    <Header />
                    <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
                  </div>
                </div>
            </SidebarProvider>
          </LanguageProvider>
        </AuthProvider>
        <Chatbot />
        <Toaster />
      </body>
    </html>
  );
}

    