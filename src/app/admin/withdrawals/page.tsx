"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Wallet, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Building2, 
  User, 
  Eye, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  History
} from "lucide-react";
import { collection, doc, updateDoc, query, orderBy, where } from "firebase/firestore";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";

export default function AdminWithdrawalsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedBankReq, setSelectedBankReq] = useState<any>(null);

  const withdrawQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "withdrawals"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: withdrawals, loading: withdrawLoading } = useCollection<any>(withdrawQuery);

  const handleAction = async (id: string, action: 'PAID' | 'REJECTED') => {
    if (!db) return;
    setProcessingId(`${id}-${action}`);
    
    try {
      await updateDoc(doc(db, "withdrawals", id), {
        status: action,
        processedAt: new Date().toISOString(),
        processorId: user?.uid
      });

      toast({
        title: `Withdrawal ${action.toLowerCase()}`,
        description: `Request has been marked as ${action}.`
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Could not process withdrawal."
      });
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Account number copied to clipboard." });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || withdrawLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors">
      <div className="container px-4 py-8 mx-auto max-w-lg">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4" /> Back to Admin Hub
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-primary mb-1">Withdrawal Requests</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Review and process payout requests from earners.</p>
        </div>

        <div className="space-y-4">
          {withdrawals?.map((req: any) => {
            const isPending = req.status === 'PENDING';
            const bank = req.bankAccount;
            const isApproving = processingId === `${req.id}-PAID`;
            const isRejecting = processingId === `${req.id}-REJECTED`;

            return (
              <Card key={req.id} className="border-none shadow-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden group">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={isPending ? "outline" : "secondary"} className="rounded-lg text-[10px] font-black uppercase tracking-tighter">
                      {req.status}
                    </Badge>
                    <p className="text-[10px] text-slate-400 font-bold">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  <CardTitle className="text-xl font-black text-primary">₦{req.amount?.toLocaleString()}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Earner</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{req.userName}</p>
                      </div>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="h-8 text-[9px] font-bold gap-1 text-primary">
                      <Link href={`/admin/users/${req.userId}`}>
                        User Insight <History className="w-3 h-3" />
                      </Link>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] text-blue-400 uppercase font-bold">Destination</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{bank?.bankName}</p>
                      </div>
                    </div>
                    <Button onClick={() => setSelectedBankReq(req)} variant="outline" size="sm" className="h-8 rounded-xl text-[9px] font-black uppercase tracking-tighter">
                      Verify Bank
                    </Button>
                  </div>
                </CardContent>
                {isPending && (
                  <CardFooter className="flex gap-2 p-4 pt-0">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-xl h-11 border-rose-200 text-rose-600 hover:bg-rose-50 text-[10px] font-black uppercase tracking-widest"
                      disabled={!!processingId}
                      onClick={() => handleAction(req.id, 'REJECTED')}
                    >
                      {isRejecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Reject
                    </Button>
                    <Button 
                      className="flex-1 rounded-xl h-11 bg-green-600 hover:bg-green-700 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/10"
                      disabled={!!processingId}
                      onClick={() => handleAction(req.id, 'PAID')}
                    >
                      {isApproving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Mark Paid
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}

          {(!withdrawals || withdrawals.length === 0) && (
            <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed dark:border-slate-800">
              <Wallet className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-bold">No payout requests queued</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedBankReq} onOpenChange={() => setSelectedBankReq(null)}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden sm:max-w-sm">
          <div className="bg-slate-900 p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-xl font-bold">Bank Verification</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">Confirm details before payment.</DialogDescription>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank Institution</span>
                <span className="text-sm font-black text-slate-800 dark:text-white">{selectedBankReq?.bankAccount?.bankName}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Name</span>
                <span className="text-sm font-black text-slate-800 dark:text-white">{selectedBankReq?.bankAccount?.accountName}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Number</span>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-lg font-mono font-black text-primary tracking-wider">{selectedBankReq?.bankAccount?.accountNumber}</span>
                  <Button onClick={() => copyToClipboard(selectedBankReq?.bankAccount?.accountNumber)} size="icon" variant="ghost" className="h-8 w-8 text-primary">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button onClick={() => setSelectedBankReq(null)} className="w-full h-12 rounded-xl bg-slate-900 font-bold uppercase tracking-widest text-[10px]">
              Close Inspector
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
