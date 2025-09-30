

"use client";

import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import * as icons from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useStatusUpdater } from "@/hooks/use-status-updater";
import { Loader2 } from "lucide-react";
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


export default function Header() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { isSubmitting, handleStatusUpdate } = useStatusUpdater();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  }
  
  const handleSos = async () => {
    await handleStatusUpdate('help');
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:justify-end">
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <icons.Menu className="h-6 w-6" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-xs p-0">
             <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
                <div className="flex items-center gap-2.5 p-4 border-b border-sidebar-border">
                  <icons.ShieldAlert className="h-7 w-7 text-primary" />
                  <span className="text-xl font-bold tracking-tight">
                    {t('app_title')}
                  </span>
                </div>
                <nav className="flex-1 space-y-1 p-2">
                  {[...navItems, ...secondaryNavItems].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${pathname === item.href ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold' : 'font-medium'}`}
                    >
                      <LucideIcon name={item.icon} className="h-4 w-4" />
                      {t(item.label as any)}
                    </Link>
                  ))}
                </nav>
              </div>
          </SheetContent>
        </Sheet>
      </div>
      
      <div className="flex items-center gap-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="lg" variant="destructive" disabled={!user || !!isSubmitting} className="font-semibold shadow-sm hover:bg-destructive/90">
              {isSubmitting ? (
                 <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <icons.Siren className="mr-2 h-6 w-6" />
              )}
                {t('header_sos')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('header_sos_confirm_title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('header_sos_confirm_description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('header_sos_confirm_cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleSos}>{t('header_sos_confirm_action')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || user.email || ''} />
                  <AvatarFallback>{user.displayName?.[0] || user.email?.[0]}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email || user.phoneNumber}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <LucideIcon name="User" className="mr-2 h-4 w-4" />
                  <span>{t('header_profile')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LucideIcon name="LogOut" className="mr-2 h-4 w-4" />
                <span>{t('header_logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild>
            <Link href="/login">{t('header_login')}</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
