"use client";

import { use, useEffect, useState } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  Briefcase, 
  Wallet, 
  Zap, 
  History, 
  Gamepad2, 
  ShieldCheck,
  CreditCard,
  TrendingUp,
  Clock,
  ArrowUpCircle
} from "lucide-react";
import { collection, doc, query, where, orderBy } from "firebase/firestore";
import { SafeDate } from "@/components/SafeDate";

export default function UserAuditPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { user: admin, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  // User Profile
  const userRef = useMemoFirebase(() => db ? doc(db, "users", userId) : null, [db, userId]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userRef);

  // User's various activity trails
  const submissionsQuery = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return query(collection(db, "submissions"), where("userId", "==", userId), orderBy("submittedAt", "desc"));
  }, [db, userId]);

  const upgradesQuery = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return query(collection(db, "upgrades"), where("userId", "==", userId), orderBy("createdAt", "desc"));
  }, [db, userId]);

  const gameSessionsQuery = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return query(collection(db, "game_sessions"), where("userId", "==", userId), orderBy("createdAt", "desc"));
  }, [db, userId]);

  const withdrawalsQuery = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return query(collection(db, "withdrawals"), where("userId", "==", userId), orderBy("createdAt", "desc"));
  }, [db, userId]);

  const depositsQuery = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return query(collection(db, "deposits"), where("userId", "==", userId), orderBy("createdAt", "desc"));
  }, [db, userId]);

  const { data: submissions } = useCollection<any>(submissionsQuery);
  const { data: upgrades } = useCollection<any>(upgradesQuery);
  const { data: gameSessions } = useCollection<any>(gameSessionsQuery);
  const { data: withdrawals } = useCollection<any>(withdrawalsQuery);
  const { data: deposits } = useCollection<any>(depositsQuery);

  useEffect(() => {
    if (!authLoading && !admin) router.push("/login");
  }, [admin, authLoading, router]);

  if (authLoading || profileLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors">
      <div className="container px-4 py-8 mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/admin/withdrawals">
              <ArrowLeft className="w-4 h-4" /> Verification Queue
            </Link>
          </Button>
          <Badge className="bg-primary text-white font-black text-[10px] uppercase tracking-widest px-3">Audit Mode</Badge>
        </div>

        {/* User Identity Header */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="w-24 h-24 rounded-[2rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary border-4 border-slate-50 dark:border-slate-800 shadow-inner">
                <User className="w-12 h-12" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                  <h1 className="text-3xl font-black text-slate-800 dark:text-white">{profile?.displayName || "Member"}</h1>
                  <Badge variant={profile?.status === 'VERIFIED' ? 'default' : 'destructive'} className="text-[10px] font-black px-2">{profile?.status || 'UNVERIFIED'}</Badge>
                  <Badge variant="outline" className="border-primary text-primary font-black text-[10px]">{profile?.role}</Badge>
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-500 font-bold uppercase tracking-tighter">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> {profile?.planName || "Starter"} Plan</span>
                  <span className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-emerald-500" /> ₦{profile?.balance?.toLocaleString()}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Joined <SafeDate date={profile?.createdAt} format="date" /></span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Trails */}
        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border h-14 w-full justify-start overflow-x-auto scrollbar-hide">
            <TabsTrigger value="submissions" className="rounded-xl px-6 gap-2 h-11 font-bold"><Briefcase className="w-4 h-4" /> Tasks</TabsTrigger>
            <TabsTrigger value="money" className="rounded-xl px-6 gap-2 h-11 font-bold"><CreditCard className="w-4 h-4" /> Payments</TabsTrigger>
            <TabsTrigger value="games" className="rounded-xl px-6 gap-2 h-11 font-bold"><Gamepad2 className="w-4 h-4" /> Games</TabsTrigger>
            <TabsTrigger value="upgrades" className="rounded-xl px-6 gap-2 h-11 font-bold"><ArrowUpCircle className="w-4 h-4" /> Plan History</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest px-2">Work Evidence</h3>
            {submissions?.map((sub: any) => (
              <Card key={sub.id} className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sub.status === 'APPROVED' ? 'bg-green-50 text-green-600' : sub.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold truncate max-w-[200px]">Task ID: {sub.taskId.slice(-8)}</p>
                      <p className="text-[10px] text-slate-400 font-bold"><SafeDate date={sub.submittedAt} /></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-primary">₦{sub.userReward || 0}</p>
                    <Badge variant={sub.status === 'APPROVED' ? 'default' : 'outline'} className="text-[8px] h-4 px-1.5 uppercase font-bold">{sub.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {submissions?.length === 0 && <NoData title="No task submissions found" />}
          </TabsContent>

          <TabsContent value="money" className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest px-2">Withdrawals</h3>
              {withdrawals?.map((w: any) => (
                <AuditCard key={w.id} icon={Wallet} title="Payout" amount={w.amount} date={w.createdAt} status={w.status} color="text-rose-600" bg="bg-rose-50" />
              ))}
              {withdrawals?.length === 0 && <NoData title="No withdrawals requested" />}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest px-2">Deposits</h3>
              {deposits?.map((d: any) => (
                <AuditCard key={d.id} icon={CreditCard} title={d.type} amount={d.amount} date={d.createdAt} status={d.status} color="text-emerald-600" bg="bg-emerald-50" />
              ))}
              {deposits?.length === 0 && <NoData title="No deposits recorded" />}
            </div>
          </TabsContent>

          <TabsContent value="games" className="space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest px-2">Skill Sessions</h3>
            {gameSessions?.map((g: any) => (
              <Card key={g.id} className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400`}>
                      <Gamepad2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold capitalize">{g.gameType} Session</p>
                      <p className="text-[10px] text-slate-400 font-bold"><SafeDate date={g.createdAt} /></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${g.win ? 'text-green-600' : 'text-slate-400'}`}>
                      {g.win ? `+₦${g.reward}` : `-₦${g.stake}`}
                    </p>
                    <Badge variant={g.win ? "default" : "outline"} className="text-[8px] h-4 px-1.5 uppercase font-bold">{g.win ? 'Win' : 'Lost'}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {gameSessions?.length === 0 && <NoData title="No gaming history" />}
          </TabsContent>

          <TabsContent value="upgrades" className="space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest px-2">Membership Transitions</h3>
            {upgrades?.map((upg: any) => (
              <Card key={upg.id} className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <ArrowUpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{upg.planName} Upgrade</p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{upg.reference || 'SYSTEM'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-indigo-600">₦{upg.amount?.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase"><SafeDate date={upg.createdAt} format="date" /></p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {upgrades?.length === 0 && <NoData title="No upgrades found" />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AuditCard({ icon: Icon, title, amount, date, status, color, bg }: any) {
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden transition-colors">
      <CardContent className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold dark:text-slate-200">{title}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold"><SafeDate date={date} /></p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-black ${color}`}>₦{amount?.toLocaleString()}</p>
          <Badge variant={status === 'PAID' || status === 'APPROVED' ? 'default' : 'outline'} className="text-[8px] h-4 px-1.5 uppercase font-bold">{status}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function NoData({ title }: { title: string }) {
  return (
    <div className="text-center py-10 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
      <History className="w-8 h-8 text-slate-200 dark:text-slate-800 mx-auto mb-2" />
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{title}</p>
    </div>
  );
}
