
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Menu, 
  Home, 
  LayoutDashboard, 
  Briefcase, 
  History, 
  Wallet, 
  Users, 
  Layers, 
  CreditCard, 
  ShieldCheck, 
  LayoutGrid, 
  MessageSquare, 
  Zap, 
  User, 
  Bell, 
  HelpCircle, 
  LogOut, 
  UserPlus, 
  LogIn,
  ChevronDown,
  Gamepad2,
  Smartphone,
  ArrowUpCircle
} from "lucide-react";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc } from "firebase/firestore";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import { InstallButton } from "./InstallButton";

export function Navigation() {
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

  return (
    <nav className="w-full h-16 flex items-center justify-between px-4 md:px-8 bg-white dark:bg-slate-950 border-b dark:border-slate-800 transition-colors">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex items-center gap-2 transition-transform group-hover:scale-[1.02]">
            <span className="bg-primary text-white px-3 py-1.5 rounded-2xl text-lg font-black tracking-tighter shadow-lg shadow-primary/20">
              CD
            </span>
            <span className="text-xl font-headline font-bold text-primary dark:text-white tracking-tight">
              TaskHome
            </span>
          </div>
        </Link>

        {/* Desktop Main Links - Strictly filtered by Role */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className={`text-sm font-bold transition-colors ${pathname === '/' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>Home</Link>
          {user && (
            <>
              <Link href={getDashboardHref()} className={`text-sm font-bold transition-colors ${pathname.includes('/dashboard') || pathname.includes('/admin') ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>Dashboard</Link>
              {role === 'EARNER' && (
                <>
                  <Link href="/tasks" className={`text-sm font-bold transition-colors ${pathname === '/tasks' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>Tasks</Link>
                  <Link href="/vtu" className={`text-sm font-bold transition-colors ${pathname === '/vtu' ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>VTU</Link>
                  <Link href="/dashboard/games" className={`text-sm font-bold transition-colors ${pathname.includes('/dashboard/games') ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>Games</Link>
                </>
              )}
              {role === 'ADVERTISER' && (
                <Link href="/dashboard/advertiser/campaigns" className={`text-sm font-bold transition-colors ${pathname.includes('/campaigns') ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}>Campaigns</Link>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1 mr-2">
          <InstallButton />
          <ThemeToggle />
        </div>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-11 pl-2 pr-4 rounded-2xl gap-3 bg-slate-50 dark:bg-slate-900 border-none hover:bg-slate-100 transition-all">
                <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                  <AvatarImage src={`https://picsum.photos/seed/${user.uid}/100/100`} />
                  <AvatarFallback className="bg-primary text-white font-bold">{user.displayName?.slice(0, 1) || "U"}</AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start text-left">
                  <span className="text-xs font-black text-primary dark:text-white uppercase tracking-tighter leading-none">{user.displayName || "Member"}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">₦{profile?.balance?.toLocaleString() || "0"}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-[1.5rem] border-none shadow-2xl bg-white ring-1 ring-slate-100">
              <DropdownMenuLabel className="px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Navigation Hub</p>
                <p className="text-sm font-black text-primary uppercase">Main Menu</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-50" />
              
              <DropdownMenuGroup className="py-1">
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer text-primary font-bold hover:bg-slate-50 transition-colors">
                    <Home className="w-4 h-4" /> Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={getDashboardHref()} className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer text-primary font-bold hover:bg-slate-50 transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="bg-slate-50" />

              <DropdownMenuGroup className="py-1">
                {role === 'EARNER' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/tasks" className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer text-primary font-bold hover:bg-slate-50 transition-colors">
                        <Briefcase className="w-4 h-4" /> Task Marketplace
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/vtu" className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer text-primary font-bold hover:bg-slate-50 transition-colors">
                        <Smartphone className="w-4 h-4" /> VTU Services
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/games" className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer text-primary font-bold hover:bg-slate-50 transition-colors">
                        <Gamepad2 className="w-4 h-4" /> Skill Games
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/upgrade" className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer text-amber-600 font-bold hover:bg-slate-50 transition-colors">
                        <ArrowUpCircle className="w-4 h-4" /> Upgrade Plan
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {role === 'ADVERTISER' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/advertiser/campaigns" className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer text-primary font-bold hover:bg-slate-50 transition-colors">
                        <Layers className="w-4 h-4" /> My Campaigns
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/advertiser/top-up" className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer text-primary font-bold hover:bg-slate-50 transition-colors">
                        <CreditCard className="w-4 h-4" /> Top Up Wallet
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {role === 'ADMIN' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer text-primary font-bold hover:bg-slate-50 transition-colors">
                      <ShieldCheck className="w-4 h-4" /> Admin Controls
                    </Link>
                  </DropdownMenuItem>
                )}

                {role === 'DEVELOPER' && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/developer" className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer text-primary font-bold hover:bg-slate-50 transition-colors">
                      <ShieldCheck className="w-4 h-4" /> Dev Console
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="bg-slate-50" />

              <DropdownMenuGroup className="py-1">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer text-primary font-bold hover:bg-slate-50 transition-colors">
                    <User className="w-4 h-4" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/support" className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer text-primary font-bold hover:bg-slate-50 transition-colors">
                    <HelpCircle className="w-4 h-4" /> Help & Support
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="bg-slate-50" />
              
              <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-rose-600 font-black hover:bg-rose-50 transition-colors mt-1">
                <LogOut className="w-4 h-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:flex text-primary font-bold rounded-xl h-10">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-10 px-6 shadow-lg shadow-primary/20">
              <Link href="/signup">Join Now</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
