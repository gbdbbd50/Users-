
"use client";

import { 
  Home, 
  Briefcase, 
  User, 
  LogOut, 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  Zap, 
  Wallet, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  Bell,
  Settings,
  Layers,
  LayoutGrid,
  CreditCard,
  History,
  TrendingUp,
  HelpCircle,
  Gamepad2,
  ArrowUpCircle,
  LayoutList,
  Smartphone
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc } from "firebase/firestore";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { InstallButton } from "./InstallButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebar() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile } = useDoc<any>(userDocRef);
  const role = profile?.role || "EARNER";

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push("/");
    }
  };

  const getDashboardHref = () => {
    if (role === "ADVERTISER") return "/dashboard/advertiser";
    if (role === "DEVELOPER") return "/dashboard/developer";
    if (role === "ADMIN") return "/admin";
    return "/dashboard";
  };

  // Main Section
  const mainNav = [
    { name: "Home", href: "/", icon: Home },
    ...(user ? [{ name: "Dashboard", href: getDashboardHref(), icon: LayoutDashboard }] : []),
  ];

  // Role-Specific
  const earnerNav = [
    { name: "Task Marketplace", href: "/tasks", icon: Briefcase },
    { name: "Skill Games", href: "/dashboard/games", icon: Gamepad2 },
    { name: "VTU Services", href: "/vtu", icon: Smartphone },
    { name: "Earning History", href: "/history", icon: History },
    { name: "Withdraw Funds", href: "/withdraw", icon: Wallet },
    { name: "Upgrade Plan", href: "/upgrade", icon: ArrowUpCircle },
    { name: "Referral Program", href: "/referrals", icon: Users },
  ];

  const advertiserNav = [
    { name: "Campaign Hub", href: "/dashboard/advertiser", icon: Layers },
    { name: "My Tasks", href: "/dashboard/advertiser/campaigns", icon: LayoutList },
    { name: "Top Up Wallet", href: "/dashboard/advertiser/top-up", icon: CreditCard },
    { name: "Referral Network", href: "/referrals", icon: Users },
  ];

  const adminNav = [
    { name: "Admin Dashboard", href: "/admin", icon: ShieldCheck },
    { name: "Task Inventory", href: "/admin/all-tasks", icon: LayoutGrid },
    { name: "Upgrade Audit", href: "/admin/upgrades", icon: ArrowUpCircle },
    { name: "Verification Queue", href: "/admin/tasks", icon: Zap },
    { name: "Payout Requests", href: "/admin/withdrawals", icon: Wallet },
    { name: "Support Inbox", href: "/admin/support", icon: MessageSquare },
  ];

  const developerNav = [
    { name: "Dev Console", href: "/dashboard/developer", icon: ShieldCheck },
    { name: "Membership Plans", href: "/dashboard/developer/plans", icon: ArrowUpCircle },
    { name: "Game Matrix", href: "/dashboard/developer/games/catalog", icon: Gamepad2 },
    { name: "Offerings Catalog", href: "/dashboard/developer/catalog", icon: LayoutGrid },
  ];

  const accountNav = [
    { name: "My Profile", href: "/profile", icon: User },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Support Center", href: "/support", icon: HelpCircle },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 dark:border-slate-800 bg-white">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex items-center gap-2 transition-transform">
            <span className="bg-primary text-white px-3 py-1.5 rounded-2xl text-lg font-black tracking-tighter shadow-lg shadow-primary/20">CD</span>
            <span className="text-xl font-headline font-bold text-primary tracking-tight group-data-[collapsible=icon]:hidden">TaskHome</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.name} className={cn("font-semibold", pathname === item.href && "bg-primary/5 text-primary")}>
                    <Link href={item.href}><item.icon className="w-4 h-4" /><span>{item.name}</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <>
            {role === 'EARNER' && (
              <SidebarGroup>
                <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Work & Earnings</SidebarGroupLabel>
                <SidebarGroupContent><SidebarMenu>{earnerNav.map((item) => (<SidebarMenuItem key={item.name}><SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.name} className="font-medium text-slate-700"><Link href={item.href}><item.icon className="w-4 h-4" /><span>{item.name}</span></Link></SidebarMenuButton></SidebarMenuItem>))}</SidebarMenu></SidebarGroupContent>
              </SidebarGroup>
            )}
            {role === 'ADVERTISER' && (
              <SidebarGroup>
                <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Advertising</SidebarGroupLabel>
                <SidebarGroupContent><SidebarMenu>{advertiserNav.map((item) => (<SidebarMenuItem key={item.name}><SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.name} className="font-medium text-slate-700"><Link href={item.href}><item.icon className="w-4 h-4" /><span>{item.name}</span></Link></SidebarMenuButton></SidebarMenuItem>))}</SidebarMenu></SidebarGroupContent>
              </SidebarGroup>
            )}
            {role === 'ADMIN' && (
              <SidebarGroup>
                <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Management</SidebarGroupLabel>
                <SidebarGroupContent><SidebarMenu>{adminNav.map((item) => (<SidebarMenuItem key={item.name}><SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.name} className="font-medium text-slate-700"><Link href={item.href}><item.icon className="w-4 h-4" /><span>{item.name}</span></Link></SidebarMenuButton></SidebarMenuItem>))}</SidebarMenu></SidebarGroupContent>
              </SidebarGroup>
            )}
            {role === 'DEVELOPER' && (
              <SidebarGroup>
                <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Root Console</SidebarGroupLabel>
                <SidebarGroupContent><SidebarMenu>{developerNav.map((item) => (<SidebarMenuItem key={item.name}><SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.name} className="font-medium text-slate-700"><Link href={item.href}><item.icon className="w-4 h-4" /><span>{item.name}</span></Link></SidebarMenuButton></SidebarMenuItem>))}</SidebarMenu></SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}

        <SidebarSeparator className="mx-2 opacity-50" />

        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Personal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {user ? (
                accountNav.map((item) => (<SidebarMenuItem key={item.name}><SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.name} className="font-medium text-slate-700"><Link href={item.href}><item.icon className="w-4 h-4" /><span>{item.name}</span></Link></SidebarMenuButton></SidebarMenuItem>))
              ) : (
                <SidebarMenuItem><SidebarMenuButton asChild tooltip="Join Now" className="bg-primary text-white hover:bg-primary/90"><Link href="/signup"><UserPlus className="w-4 h-4" /><span>Join Now</span></Link></SidebarMenuButton></SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-100">
        <div className="flex flex-col gap-4">
          {user && (
            <div className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:hidden">
              <Avatar className="h-8 w-8 border"><AvatarImage src={`https://picsum.photos/seed/${user.uid}/100/100`} /><AvatarFallback>{user.displayName?.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
              <div className="flex-1 overflow-hidden"><p className="text-xs font-bold truncate text-slate-800">{user.displayName || "Member"}</p><p className="text-[9px] text-primary font-mono uppercase tracking-tighter">₦{profile?.balance?.toLocaleString() || "0"}</p></div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1"><ThemeToggle /><InstallButton /></div>
            {user && (<button onClick={handleSignOut} className="p-2 text-slate-400 hover:text-rose-500"><LogOut className="w-4 h-4" /></button>)}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
