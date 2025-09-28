"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import * as icons from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const navItems = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/status-updates", label: "Status Updates", icon: "MessageSquare" },
  { href: "/resource-locator", label: "Resource Locator", icon: "MapPin" },
  { href: "/emergency-contacts", label: "Emergency Contacts", icon: "Phone" },
  { href: "/settings", label: "Settings", icon: "Settings" },
  { href: "/admin", label: "Admin", icon: "ShieldCheck" },
];

const LucideIcon = ({ name, ...props }: { name: string;[key: string]: any }) => {
  const Icon = icons[name as keyof typeof icons];
  if (!Icon) {
    return null;
  }
  return <Icon {...props} />;
};


export default function SidebarNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <Sidebar className="hidden md:flex md:flex-col" variant="sidebar">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2.5">
          <icons.ShieldAlert className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold tracking-tight text-sidebar-foreground">
            Aapda Guide
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                as={Link}
                href={item.href}
                isActive={pathname === item.href}
                className={cn(
                  "justify-start",
                  pathname === item.href &&
                    "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <LucideIcon name={item.icon} className="h-4 w-4" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {user ? (
            <div className="flex items-center gap-3 p-2">
              <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || user.email || ''} />
                  <AvatarFallback>{user.displayName?.[0] || user.email?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-sm">
                  <span className="font-semibold text-sidebar-foreground">{user.displayName || 'User'}</span>
                  <span className="text-xs text-muted-foreground">{user.email || user.phoneNumber}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut} className="ml-auto">
                  <LucideIcon name="LogOut" className="h-4 w-4" />
              </Button>
            </div>
        ) : (
          <Button asChild className="w-full">
            <Link href="/login">Login</Link>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
