
"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  Users, 
  FileCheck, 
  Wallet, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Loader2,
  TrendingUp,
  Zap,
  MessageSquare,
  ArrowRight,
  ClipboardList,
  Activity,
  Layers,
  Search,
  LayoutGrid,
  X,
  MessageCircle,
  Send
} from "lucide-react";
import { doc, collection, query, where, orderBy, updateDoc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { BrandedLoader } from "@/components/BrandedLoader";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    return user && db ? doc(db, "users", user.uid) : null;
  }, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  // Stats Data - Real-time Listeners
  const usersQuery = useMemoFirebase(() => db ? collection(db, "users") : null, [db]);
  const subsQuery = useMemoFirebase(() => db ? query(collection(db, "submissions"), where("status", "==", "PENDING")) : null, [db]);
  const withdrawQuery = useMemoFirebase(() => db ? query(collection(db, "withdrawals"), where("status", "==", "PENDING")) : null, [db]);
  const depositQuery = useMemoFirebase(() => db ? query(collection(db, "deposits"), where("status", "==", "PENDING")) : null, [db]);
  const tasksPendingQuery = useMemoFirebase(() => db ? query(collection(db, "tasks"), where("status", "==", "PENDING")) : null, [db]);
  const supportSessionsQuery = useMemoFirebase(() => db ? query(collection(db, "support_sessions"), where("unreadByAdmin", "==", true)) : null, [db]);

  const { data: allUsers, loading: usersLoading } = useCollection<any>(usersQuery);
  const { data: pendingSubs } = useCollection<any>(subsQuery);
  const { data: pendingWithdraws } = useCollection<any>(withdrawQuery);
  const { data: pendingDeposits } = useCollection<any>(depositQuery);
  const { data: pendingTasks } = useCollection<any>(tasksPendingQuery);
  const { data: unreadSupport } = useCollection<any>(supportSessionsQuery);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    if (!profileLoading && profile) {
      // STRICT ROLE GUARD: Redirect anyone not an ADMIN
      if (profile.role === "EARNER") router.push("/dashboard");
      else if (profile.role === "ADVERTISER") router.push("/dashboard/advertiser");
      else if (profile.role === "DEVELOPER") router.push("/dashboard/developer");
    }
  }, [user, authLoading, profile, profileLoading, router]);

  if (authLoading || profileLoading || usersLoading || !user) {
    return <BrandedLoader welcome={false} />;
  }

  // Safety check for final render
  if (profile?.role !== "ADMIN") return null;

  // Guard for welcome alert
  const showWelcome = profile && !profile.welcomeDismissedAdmin;

  const hubItems = [
    { name: "Verify Tasks", icon: ShieldCheck, color: "bg-amber-100 text-amber-600", href: "/admin/tasks", count: pendingTasks?.length },
    { name: "Task Inventory", icon: LayoutGrid, color: "bg-purple-100 text-purple-600", href: "/admin/all-tasks" },
    { name: "Submissions", icon: FileCheck, color: "bg-blue-100 text-blue-600", href: "/admin/submissions", count: pendingSubs?.length },
    { name: "Withdrawals", icon: Wallet, color: "bg-rose-100 text-rose-600", href: "/admin/withdrawals", count: pendingWithdraws?.length },
    { name: "Deposits", icon: CreditCard, color: "bg-green-100 text-green-600", href: "/admin/deposits", count: pendingDeposits?.length },
    { name: "Support Portal", icon: MessageSquare, color: "bg-cyan-100 text-cyan-600", href: "/admin/support", count: unreadSupport?.length },
  ];

  const dismissWelcome = async () => {
    if (!db || !user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), { welcomeDismissedAdmin: true });
    } catch (e) {
      console.error("Error dismissing welcome:", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 relative">
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <Card className="w-full max-w-sm border-none shadow-2xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
            <div className="bg-slate-900 p-6 text-white text-center relative">
              <button onClick={dismissWelcome} className="absolute top-4 right-4 p-1 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold mb-1">Admin Hub</h3>
              <p className="text-slate-400 text-xs">Official Moderator Access.</p>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <Button asChild className="w-full h-12 bg-[#25D366] hover:bg-[#20ba5a] text-white border-none gap-2 font-bold"><Link href="https://chat.whatsapp.com/KG0U1mX9m8O9ZGSTbd8J3s" target="_blank"><MessageCircle className="w-5 h-5" /> WhatsApp Group</Link></Button>
                <Button asChild className="w-full h-12 bg-[#0088cc] hover:bg-[#0077b3] text-white border-none gap-2 font-bold"><Link href="https://t.me/Taskhomebychiboydatabase" target="_blank"><Send className="w-5 h-5" /> Telegram Channel</Link></Button>
              </div>
              <Button variant="ghost" onClick={dismissWelcome} className="w-full text-xs text-slate-400 font-bold">Dismiss Permanently</Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="container px-4 py-8 mx-auto max-w-lg">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <ShieldCheck className="w-6 h-6" /> Admin Control
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-slate-600 text-xs font-medium uppercase tracking-wider">Live Telemetry Active</p>
            </div>
          </div>
          <Badge variant="outline" className="border-primary text-primary">Master View</Badge>
        </div>

        <Card className="mb-6 border-none shadow-xl rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <p className="text-slate-500 text-sm font-medium mb-1">Total Platform Members</p>
            <h2 className="text-5xl font-bold text-primary mb-8">
              {allUsers?.length || "0"}
            </h2>
            
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-slate-50 p-4 rounded-2xl text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Queue Status</p>
                <div className="flex items-center justify-center gap-1 text-amber-600 font-bold">
                  <Activity className="w-3 h-3" /> {(pendingSubs?.length || 0) + (pendingWithdraws?.length || 0) + (pendingTasks?.length || 0)} Pending
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Database Pulse</p>
                <div className="flex items-center justify-center gap-1 text-blue-600 font-bold">
                  <Zap className="w-3 h-3" /> Real-time
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {hubItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <Card className="border-none shadow-sm bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 h-28 relative">
                  {item.count ? (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.count}
                    </span>
                  ) : null}
                  <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center mb-2`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-700 leading-tight">{item.name}</span>
                </Card>
              </Link>
            );
          })}
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-slate-800">Quick Links</h2>
          </div>
          
          <div className="space-y-3">
            <Link href="/admin/support" className="block">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:border-cyan-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Central Support Hub</p>
                    <p className="text-[10px] text-slate-400 font-medium">Respond to user inquiries and chats</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </div>
            </Link>

            <Link href="/admin/all-tasks" className="block">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:border-purple-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Global Task Inventory</p>
                    <p className="text-[10px] text-slate-400 font-medium">View all active and completed campaigns</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
