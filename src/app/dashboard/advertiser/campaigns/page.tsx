
"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  LayoutList, 
  Loader2, 
  Eye, 
  Pause, 
  Play, 
  Trash2, 
  Plus, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Briefcase
} from "lucide-react";
import { collection, query, where, doc, updateDoc, increment, deleteDoc, orderBy, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function MyCampaignsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
  const [scalingTask, setScalingTask] = useState<any>(null);
  const [extraSlots, setExtraSlots] = useState("10");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    return user && db ? doc(db, "users", user.uid) : null;
  }, [user, db]);
  const { data: profile } = useDoc<any>(userProfileRef);

  const campaignsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "tasks"), where("advertiserId", "==", user.uid));
  }, [db, user]);

  const { data: rawCampaigns, loading: campaignsLoading } = useCollection<any>(campaignsQuery);

  // In-memory sorting to avoid composite index requirements
  const campaigns = [...(rawCampaigns || [])].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const handleStatusToggle = async (task: any) => {
    if (!db) return;
    const newStatus = task.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await updateDoc(doc(db, "tasks", task.id), { status: newStatus });
      toast({ title: `Task ${newStatus === 'ACTIVE' ? 'Resumed' : 'Paused'}` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Action failed", description: e.message });
    }
  };

  const handleScaleUp = async () => {
    if (!db || !user || !profile || !scalingTask) return;
    
    // Safety check: only scale approved tasks
    if (scalingTask.status !== 'ACTIVE' && scalingTask.status !== 'PAUSED') {
      toast({ variant: "destructive", title: "Action restricted", description: "Only approved tasks can be scaled." });
      return;
    }

    const slots = parseInt(extraSlots);
    const cost = scalingTask.reward * slots;

    if (profile.balance < cost) {
      toast({ variant: "destructive", title: "Insufficient Funds", description: `You need ₦${cost.toLocaleString()} to add ${slots} slots.` });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "tasks", scalingTask.id), {
        quantity: increment(slots),
        totalCost: increment(cost)
      });
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(-cost)
      });
      toast({ title: "Campaign Scaled", description: `${slots} additional slots added.` });
      setIsScaleModalOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (task: any) => {
    if (!db || !user || !confirm("Are you sure? Remaining budget will be refunded to your wallet.")) return;
    const remainingSlots = (task.quantity || 0) - (task.completedSlots || 0);
    const refundAmount = remainingSlots > 0 ? remainingSlots * task.reward : 0;
    try {
      await updateDoc(doc(db, "tasks", task.id), { status: 'CANCELLED' });
      if (refundAmount > 0) {
        await updateDoc(doc(db, "users", user.uid), {
          balance: increment(refundAmount)
        });
        await addDoc(collection(db, "notifications"), {
          userId: user.uid,
          title: "Campaign Cancelled",
          message: `Your campaign "${task.title}" was cancelled. ₦${refundAmount.toLocaleString()} has been refunded for ${remainingSlots} unused slots.`,
          type: 'SYSTEM',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
      toast({ title: "Task Terminated", description: refundAmount > 0 ? `₦${refundAmount.toLocaleString()} refunded.` : "Task removed from marketplace." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Termination failed", description: e.message });
    }
  };

  if (authLoading || campaignsLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors">
      <div className="container px-4 py-8 mx-auto max-w-lg">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/dashboard/advertiser"><ArrowLeft className="w-4 h-4" /> Hub</Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary dark:text-primary-foreground mb-1">My Campaigns</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Real-time control over your marketing tasks.</p>
        </div>

        <div className="space-y-4">
          {campaigns?.map((task: any) => {
            const isPaused = task.status === 'PAUSED';
            const isActive = task.status === 'ACTIVE';
            const progress = ((task.completedSlots || 0) / (task.quantity || 1)) * 100;

            return (
              <Card key={task.id} className="border-none shadow-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden group">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={task.status === 'ACTIVE' ? 'default' : 'secondary'} className="rounded-lg text-[10px] font-bold uppercase">
                      {task.status}
                    </Badge>
                    <p className="text-[10px] text-slate-400 font-medium">{new Date(task.createdAt?.toDate ? task.createdAt.toDate() : task.createdAt).toLocaleDateString()}</p>
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{task.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
                      <p className="text-[9px] uppercase font-bold text-slate-400">Total Slots</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{task.quantity}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
                      <p className="text-[9px] uppercase font-bold text-slate-400">Completed</p>
                      <p className="text-sm font-bold text-primary dark:text-primary-foreground">{task.completedSlots || 0}</p>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>

                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="flex-1 rounded-xl h-10 border-slate-200 dark:border-slate-700 gap-2 text-xs font-bold">
                      <Link href={`/dashboard/advertiser/campaigns/${task.id}/submissions`}>
                        <Eye className="w-4 h-4" /> Proofs
                      </Link>
                    </Button>
                    
                    {/* Scale button only visible for approved tasks */}
                    {(isActive || isPaused) && (
                      <Button 
                        onClick={() => { setScalingTask(task); setIsScaleModalOpen(true); }}
                        variant="outline" 
                        className="flex-1 rounded-xl h-10 border-slate-200 dark:border-slate-700 gap-2 text-xs font-bold text-primary dark:text-primary-foreground"
                      >
                        <Plus className="w-4 h-4" /> Scale
                      </Button>
                    )}
                  </div>
                </CardContent>
                {(isActive || isPaused) && (
                  <CardFooter className="bg-slate-50/50 dark:bg-slate-800/50 border-t dark:border-slate-800 p-3 flex gap-2">
                    <Button 
                      onClick={() => handleStatusToggle(task)}
                      variant="ghost" 
                      className="flex-1 h-9 rounded-lg text-[10px] font-bold uppercase tracking-wider gap-2"
                    >
                      {isPaused ? <><Play className="w-3.5 h-3.5" /> Resume</> : <><Pause className="w-3.5 h-3.5" /> Pause</>}
                    </Button>
                    <Button 
                      onClick={() => handleDeleteTask(task)}
                      variant="ghost" 
                      className="flex-1 h-9 rounded-lg text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Terminate
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}

          {(!campaigns || campaigns.length === 0) && (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
              <Briefcase className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
              <p className="text-slate-400 font-medium text-sm">No campaigns found.</p>
              <Button asChild variant="link" className="text-primary dark:text-primary-foreground mt-2">
                <Link href="/dashboard/advertiser">Launch your first task</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isScaleModalOpen} onOpenChange={setIsScaleModalOpen}>
        <DialogContent className="rounded-3xl border-none sm:max-w-md dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-200">Scale Campaign</DialogTitle>
            <DialogDescription className="dark:text-slate-400">Increase the worker slots for "{scalingTask?.title}".</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-primary/60">Current Reward</p>
                <p className="text-lg font-bold text-primary dark:text-primary-foreground">₦{scalingTask?.reward}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-primary/60">Balance</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">₦{profile?.balance?.toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Additional Workers Needed</Label>
              <Input 
                type="number" 
                value={extraSlots} 
                onChange={(e) => setExtraSlots(e.target.value)}
                className="h-12 rounded-xl text-lg font-bold dark:bg-slate-800 dark:border-slate-700"
              />
              <p className="text-[10px] text-slate-400">Total scaling cost: ₦{(scalingTask?.reward * parseInt(extraSlots || "0")).toLocaleString()}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleScaleUp} disabled={isSubmitting || !extraSlots} className="w-full h-12 rounded-xl font-bold bg-primary shadow-lg">
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirm & Pay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
