
"use client";

import { use, useEffect, useState } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldAlert,
  AlertCircle,
  Eye,
  ImageIcon,
  FileText
} from "lucide-react";
import { doc, collection, query, where, orderBy, updateDoc, increment, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { SafeDate } from "@/components/SafeDate";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminTaskSubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [processingId, setProcessingId] = useState<string | null>(null);

  const taskRef = useMemoFirebase(() => db ? doc(db, "tasks", id) : null, [db, id]);
  const { data: task, loading: taskLoading } = useDoc<any>(taskRef);

  const userProfileRef = useMemoFirebase(() => {
    return user && db ? doc(db, "users", user.uid) : null;
  }, [user, db]);
  const { data: profile } = useDoc<any>(userProfileRef);

  const subsQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(
      collection(db, "submissions"), 
      where("taskId", "==", id), 
      where("status", "==", "PENDING"),
      orderBy("submittedAt", "desc")
    );
  }, [db, id]);

  const { data: submissions, loading: subsLoading } = useCollection<any>(subsQuery);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const handleAction = async (sub: any, action: 'APPROVED' | 'REJECTED') => {
    if (!db || !task) return;
    setProcessingId(`${sub.id}-${action}`);

    try {
      const releaseAmount = sub.userReward || task.reward;

      await updateDoc(doc(db, "submissions", sub.id), {
        status: action,
        reviewedAt: new Date().toISOString(),
        reviewerId: user?.uid,
        rewardReleased: action === 'APPROVED' ? releaseAmount : 0,
        reviewedByAdmin: true
      });

      if (action === 'APPROVED') {
        const earnerRef = doc(db, "users", sub.userId);
        const earnerSnap = await getDoc(earnerRef);
        const earnerData = earnerSnap.data();

        // Streak Logic
        const today = new Date().toISOString().split('T')[0];
        let newStreak = (earnerData?.streakCount || 0);
        const lastUpdate = earnerData?.lastStreakUpdate || "";

        if (lastUpdate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastUpdate === yesterdayStr) newStreak += 1;
          else newStreak = 1;
        }

        await updateDoc(earnerRef, {
          balance: increment(releaseAmount),
          completedTasks: increment(1),
          streakCount: newStreak,
          lastStreakUpdate: today,
          weeklyEarningsAccumulator: increment(releaseAmount)
        });

        await updateDoc(doc(db, "tasks", task.id), {
          completedSlots: increment(1)
        });
      }

      toast({ title: `Submission ${action.toLowerCase()}` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update failed", description: e.message });
    } finally {
      setProcessingId(null);
    }
  };

  const isOverdue = (submittedAt: string) => {
    const subDate = new Date(submittedAt).getTime();
    return (Date.now() - subDate) > 172800000; 
  };

  if (authLoading || taskLoading || subsLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-12">
      <div className="container px-4 py-8 mx-auto max-w-2xl">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="gap-2"><Link href="/admin/all-tasks"><ArrowLeft className="w-4 h-4" /> Back</Link></Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{task?.title}</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Admin review for this campaign.</p>
        </div>

        <div className="space-y-6">
          {submissions?.map((sub: any) => {
            const overdue = isOverdue(sub.submittedAt);
            const isApproving = processingId === `${sub.id}-APPROVED`;
            const isRejecting = processingId === `${sub.id}-REJECTED`;
            
            return (
              <Card key={sub.id} className="border-none shadow-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
                <CardHeader className="pb-2 border-b dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><User className="w-4 h-4 text-slate-500" /></div>
                      <div>
                        <p className="text-xs font-bold dark:text-slate-200">{sub.userName}</p>
                        <p className="text-[10px] text-slate-400"><SafeDate date={sub.submittedAt} /></p>
                      </div>
                    </div>
                    {overdue && <Badge className="bg-rose-100 text-rose-600 animate-pulse">OVERDUE</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Proof Provided</p>
                    <p className="text-sm italic">"{sub.description}"</p>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {sub.proofImages?.map((img: string, i: number) => (
                        <img key={i} src={img} className="rounded-xl border aspect-video object-cover cursor-pointer" onClick={() => window.open(img)} />
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50/50 dark:bg-slate-800/50 p-4 flex gap-3">
                  <Button onClick={() => handleAction(sub, 'REJECTED')} variant="outline" disabled={!!processingId} className="flex-1 rounded-xl h-11 text-rose-600">Reject</Button>
                  <Button onClick={() => handleAction(sub, 'APPROVED')} disabled={!!processingId} className="flex-1 rounded-xl h-11 bg-primary text-white">Approve</Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
