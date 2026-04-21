
"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Layers, CheckCircle, XCircle, Loader2, User, Globe, DollarSign, Info } from "lucide-react";
import { collection, doc, updateDoc, query, orderBy, where, increment, addDoc } from "firebase/firestore";

export default function AdminTasksPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const tasksQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "tasks"), where("status", "==", "PENDING"));
  }, [db]);

  const { data: rawPendingTasks, loading: tasksLoading } = useCollection<any>(tasksQuery);

  const pendingTasks = [...(rawPendingTasks || [])].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return dateB - dateA;
  });

  const handleAction = async (task: any, action: 'ACTIVE' | 'REJECTED') => {
    if (!db) return;
    setProcessingId(`${task.id}-${action}`);
    
    try {
      // 1. Update task status
      await updateDoc(doc(db, "tasks", task.id), {
        status: action,
        reviewedAt: new Date().toISOString(),
        reviewerId: user?.uid
      });

      // 2. If rejected, refund the advertiser
      if (action === 'REJECTED') {
        const refundAmount = task.totalCost || (task.reward * task.quantity);
        await updateDoc(doc(db, "users", task.advertiserId), {
          balance: increment(refundAmount)
        });

        // Send notification about refund
        await addDoc(collection(db, "notifications"), {
          userId: task.advertiserId,
          title: "Campaign Rejected",
          message: `Your campaign "${task.title}" was rejected. ₦${refundAmount.toLocaleString()} has been refunded to your wallet.`,
          type: 'SYSTEM',
          read: false,
          createdAt: new Date().toISOString()
        });
      } else {
        // Send notification about approval
        await addDoc(collection(db, "notifications"), {
          userId: task.advertiserId,
          title: "Campaign Approved",
          message: `Congratulations! Your campaign "${task.title}" is now live.`,
          type: 'SYSTEM',
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      toast({
        title: `Campaign ${action === 'ACTIVE' ? 'Approved' : 'Rejected'}`,
        description: action === 'ACTIVE' ? "The task is now live for earners." : "Advertiser has been refunded."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Process failed",
        description: error.message || "Could not update task status."
      });
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="container px-4 py-8 mx-auto max-w-lg">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4" /> Back to Admin Hub
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary mb-1">Task Verification</h1>
          <p className="text-slate-600 text-sm">Review campaign quality and proof requirements before launching.</p>
        </div>

        <div className="space-y-4">
          {pendingTasks?.map((task: any) => {
            const isApproving = processingId === `${task.id}-ACTIVE`;
            const isRejecting = processingId === `${task.id}-REJECTED`;

            return (
              <Card key={task.id} className="border-none shadow-md bg-white rounded-3xl overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{task.platform}</Badge>
                    <p className="text-xs text-slate-400">{new Date(task.createdAt?.toDate ? task.createdAt.toDate() : task.createdAt).toLocaleDateString()}</p>
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-800">{task.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Reward/Slot</p>
                      <p className="text-sm font-bold text-primary">₦{task.reward}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Total Budget</p>
                      <p className="text-sm font-bold text-slate-700">₦{task.totalCost?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Instructions</p>
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{task.description}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Proof Required</p>
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">"{task.requirements}"</p>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Globe className="w-3 h-3" />
                      <a href={task.link} target="_blank" className="text-[10px] font-bold hover:underline truncate max-w-[200px]">{task.link}</a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-blue-400 uppercase font-bold">Advertiser</p>
                      <p className="text-xs font-bold text-blue-800">{task.advertiserName || "Anonymous"}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-3 pt-0">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                    disabled={!!processingId}
                    onClick={() => handleAction(task, 'REJECTED')}
                  >
                    {isRejecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Reject
                  </Button>
                  <Button 
                    className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                    disabled={!!processingId}
                    onClick={() => handleAction(task, 'ACTIVE')}
                  >
                    {isApproving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Approve
                  </Button>
                </CardFooter>
              </Card>
            );
          })}

          {(!pendingTasks || pendingTasks.length === 0) && (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
              <Layers className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium text-sm">No tasks pending verification.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
