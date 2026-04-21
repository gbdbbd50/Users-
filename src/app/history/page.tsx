
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, History, Loader2, Clock, Wallet, Briefcase, CreditCard, FileText, Star, ShieldAlert, X } from "lucide-react";
import { collection, query, where, doc, updateDoc } from "firebase/firestore";
import { SafeDate } from "@/components/SafeDate";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

export default function HistoryPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [appealSubmission, setAppealSubmission] = useState<any>(null);
  const [appealReason, setAppealReason] = useState("");
  const [isAppealing, setIsAppealing] = useState(false);

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  const earnerSubmissionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "submissions"), where("userId", "==", user.uid));
  }, [db, user]);

  const earnerWithdrawalsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "withdrawals"), where("userId", "==", user.uid));
  }, [db, user]);

  const advertiserDepositsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "deposits"), where("userId", "==", user.uid));
  }, [db, user]);

  const { data: submissions } = useCollection<any>(earnerSubmissionsQuery);
  const { data: withdrawals } = useCollection<any>(earnerWithdrawalsQuery);
  const { data: deposits } = useCollection<any>(advertiserDepositsQuery);

  const handleAppeal = async () => {
    if (!db || !appealSubmission || !appealReason.trim()) return;
    setIsAppealing(true);
    try {
      await updateDoc(doc(db, "submissions", appealSubmission.id), {
        status: 'DISPUTED',
        disputeReason: appealReason,
        disputedAt: new Date().toISOString()
      });
      toast({ title: "Dispute Opened", description: "Admin will review your appeal shortly." });
      setAppealSubmission(null);
      setAppealReason("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed", description: e.message });
    } finally {
      setIsAppealing(false);
    }
  };

  if (authLoading || profileLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-primary" /></div>;

  const isEarner = profile?.role === 'EARNER' || profile?.role === 'DEVELOPER';
  const isAdvertiser = profile?.role === 'ADVERTISER' || profile?.role === 'ADMIN';

  const sortByDate = (arr: any[] | null, dateField: string) => {
    if (!arr) return [];
    return [...arr].sort((a, b) => new Date(b[dateField]).getTime() - new Date(a[dateField]).getTime());
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-12">
      <div className="container px-4 py-8 mx-auto max-w-lg md:max-w-2xl">
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2"><Link href="/dashboard"><ArrowLeft className="w-4 h-4" /> Back</Link></Button>
        <h1 className="text-3xl font-bold text-primary dark:text-primary-foreground mb-8 flex items-center gap-3"><History className="w-8 h-8" /> Activity Hub</h1>

        <Tabs defaultValue={isEarner ? "submissions" : "deposits"} className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-900 border dark:border-slate-800 h-12 w-full p-1 rounded-2xl">
            {isEarner && <TabsTrigger value="submissions" className="flex-1 rounded-xl font-bold">Tasks</TabsTrigger>}
            {isEarner && <TabsTrigger value="withdrawals" className="flex-1 rounded-xl font-bold">Withdrawals</TabsTrigger>}
            {isAdvertiser && <TabsTrigger value="deposits" className="flex-1 rounded-xl font-bold">Deposits</TabsTrigger>}
          </TabsList>

          <TabsContent value="submissions" className="space-y-4">
            {sortByDate(submissions, 'submittedAt').map((sub: any) => (
              <Card key={sub.id} className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden group transition-colors">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center"><Briefcase className="w-5 h-5" /></div>
                    <div>
                      <p className="text-sm font-bold truncate max-w-[150px] dark:text-slate-200">Task Completion</p>
                      <p className="text-[10px] text-slate-400 font-mono"><SafeDate date={sub.submittedAt} /></p>
                      {sub.rating && (
                        <div className="flex gap-0.5 mt-1">
                          {[...Array(5)].map((_, i) => <Star key={i} className={`w-2 h-2 ${i < sub.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={sub.status === 'APPROVED' ? 'default' : 'outline'} className="text-[9px] uppercase">{sub.status}</Badge>
                    {sub.status === 'REJECTED' && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] text-primary dark:text-primary-foreground font-bold hover:bg-primary/5" onClick={() => setAppealSubmission(sub)}>Appeal Dispute</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-4">
            {sortByDate(withdrawals, 'createdAt').map((w: any) => (
              <ActivityCard key={w.id} title="Cash Out" subtitle={`₦${w.amount}`} date={w.createdAt} status={w.status} type="money" onReceipt={() => setSelectedReceipt({...w, type: 'WITHDRAWAL'})} />
            ))}
          </TabsContent>

          <TabsContent value="deposits" className="space-y-4">
            {sortByDate(deposits, 'createdAt').map((d: any) => (
              <ActivityCard key={d.id} title="Deposit" subtitle={`₦${d.amount}`} date={d.createdAt} status={d.status} type="money" onReceipt={() => setSelectedReceipt({...d, type: 'DEPOSIT'})} />
            ))}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl dark:bg-slate-900">
          <div className="bg-slate-900 dark:bg-black p-8 text-white text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="bg-white text-slate-900 px-2 py-0.5 rounded-lg text-lg font-black tracking-tighter">
                CD
              </span>
              <span className="text-lg font-bold tracking-tight">
                TaskHome
              </span>
            </div>
            <DialogTitle className="text-xl font-bold">Transaction Receipt</DialogTitle>
            <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Official Proof of Funds</p>
          </div>
          <div className="p-8 space-y-6 bg-white dark:bg-slate-900 transition-colors">
            <div className="flex justify-between border-b pb-4 dark:border-slate-800">
              <span className="text-xs text-slate-500 uppercase font-bold">Reference ID</span>
              <span className="text-sm font-mono font-black text-slate-800 dark:text-slate-200">#{selectedReceipt?.id?.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between border-b pb-4 dark:border-slate-800">
              <span className="text-xs text-slate-500 uppercase font-bold">Operation Type</span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-200">{selectedReceipt?.type}</span>
            </div>
            <div className="flex justify-between border-b pb-4 dark:border-slate-800">
              <span className="text-xs text-slate-500 uppercase font-bold">Amount Paid</span>
              <span className="text-xl font-black text-primary dark:text-primary-foreground">₦{selectedReceipt?.amount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-4 dark:border-slate-800">
              <span className="text-xs text-slate-500 uppercase font-bold">Timestamp</span>
              <span className="text-sm font-bold dark:text-slate-300"><SafeDate date={selectedReceipt?.createdAt} /></span>
            </div>
            <div className="flex justify-between border-b pb-4 dark:border-slate-800">
              <span className="text-xs text-slate-500 uppercase font-bold">Status</span>
              <Badge variant={selectedReceipt?.status === 'APPROVED' || selectedReceipt?.status === 'PAID' ? 'default' : 'outline'}>{selectedReceipt?.status}</Badge>
            </div>
            <Button className="w-full h-12 rounded-xl bg-slate-900 dark:bg-slate-800 font-bold" onClick={() => window.print()}>Print Receipt</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!appealSubmission} onOpenChange={() => setAppealSubmission(null)}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-8 space-y-6 dark:bg-slate-900">
          <div className="flex items-center gap-3 text-primary dark:text-primary-foreground"><ShieldAlert className="w-6 h-6" /><DialogTitle className="text-xl font-bold">Dispute Rejection</DialogTitle></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">If you believe your task was rejected unfairly, provide a reason. Admin will review the evidence.</p>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-slate-400">Your Argument</label>
            <Input placeholder="e.g. I followed all steps, check the username in screenshot." value={appealReason} onChange={(e) => setAppealReason(e.target.value)} className="h-12 rounded-xl dark:bg-slate-800 dark:border-slate-700" />
          </div>
          <Button onClick={handleAppeal} disabled={isAppealing || !appealReason.trim()} className="w-full h-12 bg-primary rounded-xl font-bold">{isAppealing ? <Loader2 className="animate-spin" /> : "Submit Appeal"}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActivityCard({ title, subtitle, date, status, type, onReceipt }: any) {
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden transition-colors">
      <CardContent className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 flex items-center justify-center"><Wallet className="w-5 h-5" /></div>
          <div>
            <p className="text-sm font-bold dark:text-slate-200">{title}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black">{subtitle}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 dark:text-slate-700 hover:text-primary dark:hover:text-primary-foreground" onClick={onReceipt}><FileText className="w-4 h-4" /></Button>
      </CardContent>
    </Card>
  );
}
