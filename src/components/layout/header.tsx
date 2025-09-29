
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
  { href: "/settings", label: "Settings", icon: "Settings" },
  { href: "/admin", label: "Admin", icon: "ShieldCheck" },
  { href: "/feedback", label: "Feedback", icon: "Megaphone" },
];

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

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  }
  
  const handleSos = async () => {
    await handleStatusUpdate('help');
    router.push('/resource-locator');
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
                    Aapda Guide
                  </span>
                </div>
                <nav className="flex-1 space-y-1 p-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${pathname === item.href ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold' : 'font-medium'}`}
                    >
                      <LucideIcon name={item.icon} className="h-4 w-4" />
                      {item.label}
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
            <Button variant="destructive" disabled={!user || !!isSubmitting} className="font-semibold shadow-sm hover:bg-destructive/90">
              {isSubmitting ? (
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <icons.Siren className="mr-2 h-5 w-5" />
              )}
                SOS
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to send an SOS?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will immediately mark your status as "Need Help" and share your location on the community map for rescue and coordination purposes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSos}>Yes, I need help</AlertDialogAction>
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
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LucideIcon name="LogOut" className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
