"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ShieldAlert,
  LayoutDashboard,
  MessageSquare,
  MapPin,
  Phone,
  Settings,
  Menu,
} from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/status-updates", label: "Status Updates", icon: MessageSquare },
  { href: "/resource-locator", label: "Resource Locator", icon: MapPin },
  { href: "/emergency-contacts", label: "Emergency Contacts", icon: Phone },
  { href: "/settings", label: "Settings", icon: Settings },
];

const pageTitles: { [key: string]: string } = {
  "/": "Dashboard",
  "/status-updates": "Community Status",
  "/resource-locator": "Resource Locator",
  "/emergency-contacts": "Emergency Contacts",
  "/settings": "Settings",
};

export default function Header() {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] || "Aapda Guide";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6 md:justify-end">
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-xs p-0">
             <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
                <div className="flex items-center gap-2.5 p-4 border-b border-sidebar-border">
                  <ShieldAlert className="h-7 w-7 text-primary" />
                  <span className="text-xl font-bold tracking-tight">
                    Aapda Guide
                  </span>
                </div>
                <nav className="flex-1 space-y-2 p-4">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href} legacyBehavior passHref>
                      <a className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${pathname === item.href ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}>
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </a>
                    </Link>
                  ))}
                </nav>
              </div>
          </SheetContent>
        </Sheet>
      </div>
      
      <h1 className="text-xl font-semibold md:hidden">{pageTitle}</h1>

      <div>
        {/* Placeholder for User Menu */}
      </div>
    </header>
  );
}
