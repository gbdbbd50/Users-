
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  Search, 
  Copy, 
  CheckCircle2, 
  History, 
  TrendingUp, 
  Loader2, 
  Zap,
  Briefcase,
  Users,
  Clock,
  BellRing,
  MessageSquare,
  X,
  MessageCircle,
  Send,
  Gamepad2,
  ArrowUpCircle,
  ChevronRight,
  Award,
  Trophy,
  Flame,
  LayoutList,
  Target,
  Headset,
  Smartphone,
  User
} from "lucide-react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, collection, query, where, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { SafeDate } from "@/components/SafeDate";
import { BrandedLoader } from "@/components/BrandedLoader";
import { Progress } from "@/components/ui/progress";

export default function EarnerDashboard() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isClaiming, setIsClaiming] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    return user && db ? doc(db, "users", user.uid) : null;
  }, [user, db]);
  
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  const badgesQuery = useMemoFirebase(() => db ? collection(db, "badges") : null, [db]);
  const { data: badges } = useCollection<any>(badgesQuery);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const handleClaimStreak = async () => {
    if (!db || !user || !profile) return;
    setIsClaiming(true);
    const bonus = (profile.weeklyEarningsAccumulator || 0) * 0.05;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(bonus),
        weeklyEarningsAccumulator: 0,
        streakCount: 0,
        streakClaimedAt: new Date().toISOString()
      });
      toast({ title: "Bonus Claimed!", description: `₦${bonus.toFixed(2)} streak reward added.` });
    } catch (e) { toast({ variant: "destructive", title: "Claim failed" }); } finally { setIsClaiming(false); }
  };

  if (authLoading || profileLoading || !user) {
    return <BrandedLoader welcome={false} />;
  }

  if (profile?.role !== "EARNER" && profile?.role !== "DEVELOPER") return null;

  const earnedBadges = badges?.filter((b: any) => (profile?.completedTasks || 0) >= b.requiredTasks) || [];
  const streakProgress = profile?.streakCount || 0;
  const canClaim = streakProgress >= 7;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors relative">
      <div className="container px-4 py-6 mx-auto max-w-lg">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary dark:text-primary-foreground">Hello {profile?.displayName}</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Level: <span className="font-bold text-primary">{profile?.planName || "Starter"}</span></p>
          </div>
          <div className="flex gap-2">
            <Link href="/community" className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform hover:scale-105 active:scale-95"><Users className="w-5 h-5" /></Link>
            <Link href="/profile" className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform hover:scale-105 active:scale-95"><User className="w-5 h-5" /></Link>
            <Badge variant={profile?.status === 'VERIFIED' ? 'default' : 'destructive'}>{profile?.status || 'UNVERIFIED'}</Badge>
          </div>
        </div>

        {/* Financial Summary */}
        <Card className="mb-6 border-none shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Available Balance</p>
            <h2 className="text-5xl font-black text-blue-600 dark:text-blue-400 mb-8">₦{profile?.balance?.toLocaleString() || "0"}</h2>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild className="h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-lg shadow-blue-500/10"><Link href="/withdraw">Withdraw</Link></Button>
              <Button asChild className="h-12 bg-primary hover:bg-primary/90 rounded-xl font-bold shadow-lg shadow-primary/10"><Link href="/tasks">Perform Tasks</Link></Button>
            </div>
          </CardContent>
        </Card>

        {/* Streak Tracker */}
        <Card className="mb-6 border-none shadow-lg rounded-3xl bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Flame className="w-24 h-24" /></div>
          <CardContent className="p-6 space-y-4 relative z-10">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-1">Weekly Commitment</p>
                <h3 className="text-2xl font-bold">{streakProgress} Day Streak</h3>
              </div>
              <Badge className="bg-amber-500 text-slate-950 font-black border-none">+5% Bonus</Badge>
            </div>
            <Progress value={(streakProgress / 7) * 100} className="h-2.5 bg-white/10" />
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Day 1</span>
              <span>Milestone: Day 7</span>
            </div>
            {canClaim ? (
              <Button onClick={handleClaimStreak} disabled={isClaiming} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl animate-pulse">
                {isClaiming ? <Loader2 className="animate-spin" /> : `CLAIM ₦${((profile.weeklyEarningsAccumulator || 0) * 0.05).toFixed(2)}`}
              </Button>
            ) : (
              <p className="text-[10px] text-slate-500 italic text-center">Complete tasks for {7 - streakProgress} more days to unlock your bonus.</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Hub - Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { name: "Tasks", icon: Briefcase, color: "bg-blue-100 text-blue-600", href: "/tasks" },
            { name: "Jobs", icon: Target, color: "bg-orange-100 text-orange-600", href: "/jobs" },
            { name: "Community", icon: Users, color: "bg-indigo-100 text-indigo-600", href: "/community" },
            { name: "Games", icon: Gamepad2, color: "bg-emerald-100 text-emerald-600", href: "/dashboard/games" },
            { name: "History", icon: Clock, color: "bg-cyan-100 text-cyan-600", href: "/history" },
            { name: "Referral", icon: Users, color: "bg-purple-100 text-purple-600", href: "/referrals" },
            { name: "Upgrade", icon: ArrowUpCircle, color: "bg-amber-100 text-amber-600", href: "/upgrade" },
            { name: "Support", icon: Headset, color: "bg-rose-100 text-rose-600", href: "/support" },
            { name: "VTU", icon: Smartphone, color: "bg-slate-100 text-slate-600", href: "/vtu" },
            { name: "Profile", icon: User, color: "bg-slate-900 text-white", href: "/profile" },
          ].map((item) => (
            <Link key={item.name} href={item.href}>
              <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-95 h-28">
                <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center mb-2`}><item.icon className="w-5 h-5" /></div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
              </Card>
            </Link>
          ))}
        </div>

        {/* Achievements Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Achievements</h2>
            <Badge variant="outline" className="text-[10px] uppercase font-bold">{earnedBadges.length} Unlocked</Badge>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {earnedBadges.map((badge: any) => (
              <Card key={badge.id} className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl min-w-[140px] shrink-0 p-4 text-center">
                <div className={`w-12 h-12 rounded-2xl ${badge.color} flex items-center justify-center mx-auto mb-3 shadow-inner`}>
                  <Award className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase leading-tight">{badge.name}</p>
              </Card>
            ))}
            {earnedBadges.length === 0 && (
              <div className="w-full text-center py-6 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Complete tasks to unlock badges</p>
              </div>
            )}
          </div>
        </section>

        {/* Upgrade Prompt */}
        <Link href="/upgrade" className="block mb-6 group">
          <Card className="border-none shadow-md rounded-[2rem] bg-slate-900 text-white overflow-hidden transition-all group-hover:shadow-xl">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg"><ArrowUpCircle className="w-6 h-6 text-slate-900" /></div>
                <div>
                  <p className="text-sm font-bold">Premium Membership</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Get higher task payouts & higher daily limits</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
