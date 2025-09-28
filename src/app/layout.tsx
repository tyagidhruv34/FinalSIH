import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import SidebarNav from '@/components/layout/sidebar-nav';
import Header from '@/components/layout/header';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Aapda Guide',
  description: 'A disaster management app to help you stay safe.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased", 'min-h-screen bg-background')}>
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <SidebarNav />
              <div className="flex flex-1 flex-col">
                <Header />
                <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
              </div>
            </div>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
