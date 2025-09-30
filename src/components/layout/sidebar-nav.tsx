

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as icons from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useLanguage } from "@/hooks/use-language";

const navItems = [
  { href: "/", label: "nav_dashboard", icon: "LayoutDashboard" },
  { href: "/rescue", label: "nav_rescue_dashboard", icon: "LifeBuoy" },
  { href: "/learning-hub", label: "nav_learning_hub", icon: "GraduationCap" },
  { href: "/survivor-community", label: "nav_survivor_stories", icon: "HeartHandshake" },
  { href: "/damage-assessment", label: "nav_damage_assessment", icon: "Bot" },
  { href: "/risk-assessment", label: "nav_risk_assessment", icon: "ShieldAlert" },
  { href: "/missing-person-report", label: "nav_report_missing", icon: "PersonStanding" },
  { href: "/missing-person-finder", label: "nav_find_person", icon: "Search" },
  { href: "/advisories", label: "nav_advisories", icon: "Landmark" },
  { href: "/status-updates", label: "nav_status_updates", icon: "MessageSquare" },
  { href: "/resource-locator", label: "nav_resource_locator", icon: "MapPin" },
  { href: "/emergency-contacts", label: "nav_emergency_contacts", icon: "Phone" },
];

const secondaryNavItems = [
    { href: "/settings", label: "nav_settings", icon: "Settings" },
    { href: "/admin", label: "nav_admin", icon: "ShieldCheck" },
    { href: "/feedback", label: "nav_feedback", icon: "Megaphone" },
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
  const { t } = useLanguage();

  return (
    <nav className="hidden md:block w-64 border-r bg-sidebar text-sidebar-foreground">
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-16 items-center border-b px-4">
                <Link href="/" className="flex items-center gap-2.5 font-semibold">
                    <icons.ShieldAlert className="h-7 w-7 text-primary" />
                    <span className="text-xl font-bold tracking-tight text-sidebar-foreground">
                        {t('app_title')}
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
                                <span>{t(item.label as any)}</span>
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
                                <span>{t(item.label as any)}</span>
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
                    <Link href="/login">{t('header_login')}</Link>
                </Button>
                )}
            </div>
        </div>
    </nav>
  );
}
