
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as icons from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const navItems = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/rescue", label: "Rescue Dashboard", icon: "LifeBuoy" },
  { href: "/learning-hub", label: "Learning Hub", icon: "GraduationCap" },
  { href: "/damage-assessment", label: "Damage Assessment", icon: "Bot" },
  { href: "/risk-assessment", label: "Risk Assessment", icon: "ShieldAlert" },
  { href: "/missing-person-report", label: "Report Missing", icon: "PersonStanding" },
  { href: "/missing-person-finder", label: "Find Person", icon: "Search" },
  { href: "/advisories", label: "Advisories", icon: "Landmark" },
  { href: "/status-updates", label: "Status Updates", icon: "MessageSquare" },
  { href: "/resource-locator", label: "Resource Locator", icon: "MapPin" },
  { href: "/emergency-contacts", label: "Emergency Contacts", icon: "Phone" },
];

const secondaryNavItems = [
    { href: "/settings", label: "Settings", icon: "Settings" },
    { href: "/admin", label: "Admin", icon: "ShieldCheck" },
    { href: "/feedback", label: "Feedback", icon: "Megaphone" },
]

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
    <nav className="hidden md:block w-64 border-r bg-sidebar text-sidebar-foreground">
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-16 items-center border-b px-4">
                <Link href="/" className="flex items-center gap-2.5 font-semibold">
                    <icons.ShieldAlert className="h-7 w-7 text-primary" />
                    <span className="text-xl font-bold tracking-tight text-sidebar-foreground">
                        Aapda Guide
                    </span>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
                <ul className="space-y-1 px-2">
                    {navItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                pathname === item.href
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                    : "font-medium"
                                )}
                            >
                                <LucideIcon name={item.icon} className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
                <hr className="my-4 border-sidebar-border" />
                 <ul className="space-y-1 px-2">
                    {secondaryNavItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                pathname === item.href
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                    : "font-medium"
                                )}
                            >
                                <LucideIcon name={item.icon} className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-auto border-t p-2">
                 {user ? (
                    <div className="flex items-center gap-3 p-2">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photoURL || ''} alt={user.displayName || user.email || ''} />
                        <AvatarFallback>{user.displayName?.[0] || user.email?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-sm">
                        <span className="font-semibold text-sidebar-foreground">{user.displayName || 'User'}</span>
                        <span className="text-xs text-muted-foreground">{user.email || user.phoneNumber}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={signOut} className="ml-auto text-sidebar-foreground hover:bg-sidebar-accent">
                        <LucideIcon name="LogOut" className="h-4 w-4" />
                    </Button>
                    </div>
                ) : (
                <Button asChild className="w-full">
                    <Link href="/login">Login</Link>
                </Button>
                )}
            </div>
        </div>
    </nav>
  );
}
