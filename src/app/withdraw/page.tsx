
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Wallet, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Clock,
  ShieldCheck,
  Zap
} from "lucide-react";
import { doc, collection, addDoc, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const UNLIMITED_VAL = 999999;

export default function WithdrawalPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  const bankQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "bankAccounts");
  }, [db, user]);
  const { data: bankAccounts, loading: banksLoading } = useCollection<any>(bankQuery);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const minWithdrawal = profile?.minWithdrawal || 100;
  const charge = profile?.withdrawalCharge || 0;
  const maxCount = profile?.maxWithdrawalCount || 10;

  const handleWithdraw = async () => {
    if (!db || !user || !profile || !amount || !selectedBankId) return;

    const numAmount = parseFloat(amount);
    const totalToDeduct = numAmount + charge;
    const selectedBank = bankAccounts?.find(b => b.id === selectedBankId);

    if (numAmount < minWithdrawal) {
      toast({ variant: "destructive", title: "Amount too low", description: `Minimum withdrawal for your plan is ₦${minWithdrawal}.` });
      return;
    }

    if (totalToDeduct > profile.balance) {
      toast({ variant: "destructive", title: "Insufficient Funds", description: `You need ₦${totalToDeduct} (including ₦${charge} charge).` });
      return;
    }

    // Check withdrawal count limit
    if (maxCount < UNLIMITED_VAL && profile.withdrawalCount >= maxCount) {
      toast({ variant: "destructive", title: "Limit Exceeded", description: "You have reached the maximum withdrawal count for this plan period." });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "withdrawals"), {
        userId: user.uid,
        userName: profile.displayName,
        amount: numAmount,
        charge: charge,
        bankAccount: selectedBank,
        status: "PENDING",
        planAtTime: profile.planName || "Starter",
        createdAt: new Date().toISOString()
      });

      await updateDoc(doc(db, "users", user.uid), { 
        balance: increment(-totalToDeduct),
        withdrawalCount: increment(1)
      });

      toast({ title: "Withdrawal Placed", description: "Request pending moderator review." });
      router.push("/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Request Failed", description: error.message });
      setIsSubmitting(false);
    }
  };

  if (authLoading || profileLoading || banksLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const noBanks = !bankAccounts || bankAccounts.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="container px-4 py-8 mx-auto max-w-lg">
        <div className="mb-6"><Button asChild variant="ghost" size="sm" className="gap-2" disabled={isSubmitting}><Link href="/dashboard"><ArrowLeft className="w-4 h-4" /> Back</Link></Button></div>

        <h1 className="text-3xl font-black text-primary mb-2">Cash Out</h1>
        <p className="text-slate-500 text-sm">Transfer your earnings to your linked bank account.</p>
        
        <Card className="mb-8 border-none shadow-xl rounded-3xl overflow-hidden bg-white mt-6">
          <CardHeader className="bg-blue-600 text-white p-8">
            <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Withdrawable Balance</p>
            <CardTitle className="text-4xl font-bold">₦{profile?.balance?.toLocaleString() || "0"}</CardTitle>
            <Badge className="w-fit mt-4 bg-white/20 text-white border-none uppercase text-[9px] font-black">{profile?.planName || "Starter"} Tier</Badge>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {noBanks ? (
              <div className="text-center space-y-4 py-6">
                <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
                <p className="font-bold text-slate-800">No destination found.</p>
                <Button asChild className="w-full bg-rose-600 rounded-xl"><Link href="/bank-accounts">Setup Bank Account <ArrowRight className="ml-2 w-4 h-4" /></Link></Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-bold">Withdraw Amount (₦)</Label>
                  <Input type="number" placeholder={`Min: ${minWithdrawal}`} className="h-14 rounded-2xl text-lg font-bold" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isSubmitting} />
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    <span>Plan Charge: ₦{charge}</span>
                    <span>Min: ₦{minWithdrawal}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold">Destination Bank</Label>
                  <Select onValueChange={setSelectedBankId} value={selectedBankId} disabled={isSubmitting}>
                    <SelectTrigger className="h-14 rounded-2xl"><SelectValue placeholder="Choose account" /></SelectTrigger>
                    <SelectContent>
                      {bankAccounts?.map(bank => (
                        <SelectItem key={bank.id} value={bank.id}>{bank.bankName} • {bank.accountNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border text-center">
                    <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Quota Used</p>
                    <p className="text-sm font-bold">{maxCount >= UNLIMITED_VAL ? "Unlimited" : `${profile?.withdrawalCount || 0} / ${maxCount}`}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border text-center">
                    <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Wait Time</p>
                    <p className="text-sm font-bold flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> 24 Hours</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="px-8 pb-8">
            {!noBanks && (
              <Button onClick={handleWithdraw} disabled={isSubmitting || !amount || !selectedBankId} className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-lg shadow-lg">
                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : `Withdraw ₦${amount || "0"}`}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
