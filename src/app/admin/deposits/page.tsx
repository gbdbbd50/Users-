
"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, CheckCircle, XCircle, Loader2, User, Building2, Zap } from "lucide-react";
import { collection, doc, updateDoc, query, orderBy, where, getDoc, increment, addDoc } from "firebase/firestore";
import { SafeDate } from "@/components/SafeDate";

export default function AdminDepositsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const depositQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "deposits"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: deposits, loading: depositsLoading } = useCollection<any>(depositQuery);

  const handleAction = async (deposit: any, action: 'APPROVED' | 'REJECTED') => {
    if (!db) return;
    setProcessingId(`${deposit.id}-${action}`);
    
    try {
      // 1. Update the deposit status
      await updateDoc(doc(db, "deposits", deposit.id), {
        status: action,
        processedAt: new Date().toISOString(),
        processorId: user?.uid
      });

      // 2. If approved, credit the advertiser's balance
      if (action === 'APPROVED') {
        const userRef = doc(db, "users", deposit.userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        const updates: any = {
          balance: increment(deposit.amount),
          depositCount: increment(1)
        };

        // Auto-verify advertisers on first manual deposit approval
        if (userData?.role === 'ADVERTISER' && userData?.status !== 'VERIFIED') {
          updates.status = 'VERIFIED';
        } else if (deposit.type === 'ACTIVATION') {
          updates.status = 'VERIFIED';
        }

        await updateDoc(userRef, updates);
      }

      // 3. Send Notification to User
      await addDoc(collection(db, "notifications"), {
        userId: deposit.userId,
        title: `Deposit ${action === 'APPROVED' ? 'Confirmed' : 'Rejected'}`,
        message: action === 'APPROVED' 
          ? `Your deposit of ₦${deposit.amount.toLocaleString()} has been approved and credited.`
          : `Your deposit request of ₦${deposit.amount.toLocaleString()} was rejected.`,
        type: 'DEPOSIT',
        read: false,
        createdAt: new Date().toISOString()
      });

      toast({ title: `Deposit ${action}` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Process failed", description: error.message });
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading || depositsLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors">
      <div className="container px-4 py-8 mx-auto max-w-lg">
        <div className="mb-6"><Button asChild variant="ghost" size="sm" className="gap-2"><Link href="/admin"><ArrowLeft className="w-4 h-4" /> Back</Link></Button></div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">Deposit Verification</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm italic">Approving deposits automatically verifies Advertisers.</p>
        </div>

        <div className="space-y-4">
          {deposits?.map((dep: any) => {
            const isPending = dep.status === 'PENDING';
            const isApproving = processingId === `${dep.id}-APPROVED`;
            const isRejecting = processingId === `${dep.id}-REJECTED`;

            return (
              <Card key={dep.id} className="border-none shadow-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{dep.method} • {dep.status}</Badge>
                    <p className="text-[10px] text-slate-400 font-bold uppercase"><SafeDate date={dep.createdAt} format="date" /></p>
                  </div>
                  <CardTitle className="text-lg font-bold text-primary">₦{dep.amount?.toLocaleString()}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><User className="w-4 h-4" /></div>
                    <div><p className="text-[10px] text-slate-400 uppercase font-bold">User</p><p className="text-xs font-bold">{dep.userId.slice(-8)}</p></div>
                  </div>
                  {dep.senderName && (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><Building2 className="w-4 h-4" /></div>
                      <div><p className="text-[10px] uppercase font-bold text-amber-600">Sender</p><p className="text-xs font-bold text-amber-800 dark:text-amber-200">{dep.senderName}</p></div>
                    </div>
                  )}
                </CardContent>
                {isPending && (
                  <CardFooter className="flex gap-3 pt-0">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-xl h-11 border-rose-200 text-rose-600" 
                      onClick={() => handleAction(dep, 'REJECTED')} 
                      disabled={!!processingId}
                    >
                      {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reject"}
                    </Button>
                    <Button 
                      className="flex-1 rounded-xl h-11 bg-primary" 
                      onClick={() => handleAction(dep, 'APPROVED')} 
                      disabled={!!processingId}
                    >
                      {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve"}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
