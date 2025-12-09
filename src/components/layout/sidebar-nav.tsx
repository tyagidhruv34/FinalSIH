

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as icons from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useLanguage } from "@/hooks/use-language";
import { SaffronFlag } from "../ui/saffron-flag";

// Navigation items for different user types
const citizenNavItems = [
  { href: "/", label: "nav_dashboard", icon: "LayoutDashboard" },
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

const rescueAgencyNavItems = [
  { href: "/", label: "nav_dashboard", icon: "LayoutDashboard" },
  { href: "/rescue", label: "nav_rescue_dashboard", icon: "LifeBuoy" },
  { href: "/missing-person-finder", label: "nav_find_person", icon: "Search" },
  { href: "/resource-locator", label: "nav_resource_locator", icon: "MapPin" },
  { href: "/emergency-contacts", label: "nav_emergency_contacts", icon: "Phone" },
  { href: "/advisories", label: "nav_advisories", icon: "Landmark" },
];

const adminNavItems = [
  { href: "/", label: "nav_dashboard", icon: "LayoutDashboard" },
  { href: "/admin", label: "nav_admin", icon: "ShieldCheck" },
  { href: "/rescue", label: "nav_rescue_dashboard", icon: "LifeBuoy" },
  { href: "/advisories", label: "nav_advisories", icon: "Landmark" },
  { href: "/resource-locator", label: "nav_resource_locator", icon: "MapPin" },
];

const getNavItems = (userType: string | null) => {
  switch (userType) {
    case 'citizen':
      return citizenNavItems;
    case 'rescue_agency':
      return rescueAgencyNavItems;
    case 'admin':
      return adminNavItems;
    default:
      return [];
  }
};

const secondaryNavItems = [
    { href: "/settings", label: "nav_settings", icon: "Settings" },
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
  const { user, signOut, userType } = useAuth();
  const { t } = useLanguage();

  const navItems = getNavItems(userType);

  return (
    <nav className="hidden md:block w-64 border-r bg-sidebar text-sidebar-foreground">
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-20 items-center border-b px-4 bg-gradient-to-r from-[#FF9933]/20 via-[#FFFFFF]/10 to-[#138808]/20">
                <Link href="/" className="flex items-center gap-3 font-semibold group transition-all">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#FF9933] to-[#FF9933]/80 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <SaffronFlag size={28} className="drop-shadow-md" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-sidebar-foreground group-hover:text-[#FF9933] transition-colors">
                        {t('app_title')}
                    </span>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-sidebar-accent scrollbar-track-transparent">
                <div className="px-2 mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Main Menu</p>
                </div>
                <ul className="space-y-1 px-2">
                    {navItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={cn(
                                "flex items-center gap-3 rounded-lg px-4 py-3 text-base transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1",
                                pathname === item.href
                                    ? "bg-gradient-to-r from-[#FF9933]/20 to-[#FF9933]/10 text-sidebar-accent-foreground font-semibold shadow-sm border-l-4 border-[#FF9933]"
                                    : "font-medium"
                                )}
                            >
                                <LucideIcon name={item.icon} className={cn("h-5 w-5 transition-transform shrink-0", pathname === item.href && "scale-110 text-[#FF9933]")} />
                                <span className="truncate">{t(item.label as any)}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
                <hr className="my-4 border-sidebar-border" />
                <div className="px-2 mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">More</p>
                </div>
                 <ul className="space-y-1 px-2">
                    {secondaryNavItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={cn(
                                "flex items-center gap-3 rounded-lg px-4 py-3 text-base transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1",
                                pathname === item.href
                                    ? "bg-gradient-to-r from-[#FF9933]/20 to-[#FF9933]/10 text-sidebar-accent-foreground font-semibold shadow-sm border-l-4 border-[#FF9933]"
                                    : "font-medium"
                                )}
                            >
                                <LucideIcon name={item.icon} className={cn("h-5 w-5 transition-transform shrink-0", pathname === item.href && "scale-110 text-[#FF9933]")} />
                                <span className="truncate">{t(item.label as any)}</span>
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
