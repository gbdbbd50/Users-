
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Zap, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck,
  CreditCard,
  Target,
  Trophy,
  History,
  Lock,
  ArrowUpCircle,
  Percent,
  Wallet,
  Gamepad2,
  Infinity as InfinityIcon,
  Users
} from "lucide-react";
import { doc, updateDoc, increment, addDoc, collection, query, orderBy, where, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { paymentKeys } from "@/firebase/config";

declare global { interface Window { PaystackPop: any; } }

const UNLIMITED_VAL = 999999;

export default function UpgradePage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  const plansQuery = useMemoFirebase(() => db ? query(collection(db, "plans"), orderBy("cost", "asc")) : null, [db]);
  const { data: plans, loading: plansLoading } = useCollection<any>(plansQuery);

  useEffect(() => {
    const psScript = document.createElement("script");
    psScript.src = "https://js.paystack.co/v1/inline.js";
    psScript.async = true;
    document.body.appendChild(psScript);
    return () => { if (document.body.contains(psScript)) document.body.removeChild(psScript); };
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const handleUpgrade = async (plan: any) => {
    if (!db || !user) return;

    if (plan.cost === 0) {
      applyPlan(plan, 'FREE_AUTO');
      return;
    }

    setIsSubmitting(true);
    const publicKey = paymentKeys.paystack;
    if (!publicKey || !window.PaystackPop) {
      toast({ variant: "destructive", title: "Gateway Error", description: "Payment system is initializing. Please try again in a few seconds." });
      setIsSubmitting(false);
      return;
    }

    try {
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: user.email || `user-${user.uid}@taskhome.com`,
        amount: Math.round(plan.cost * 100),
        currency: "NGN",
        ref: 'TH-UPG-' + Date.now(),
        callback: (res: any) => applyPlan(plan, res.reference),
        onClose: () => {
          setIsSubmitting(false);
          toast({ title: "Upgrade Cancelled", description: "Payment was not completed." });
        }
      });
      handler.openIframe();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
      setIsSubmitting(false);
    }
  };

  const applyPlan = async (plan: any, reference: string) => {
    if (!db || !user) return;
    try {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + (plan.periodDays || 30));

      // 1. Award Referral Bonus to Inviter if applicable
      if (profile?.referredBy && plan.cost > 0) {
        const inviterQuery = query(collection(db, "users"), where("referralCode", "==", profile.referredBy));
        const inviterSnap = await getDocs(inviterQuery);
        
        if (!inviterSnap.empty) {
          const inviterDoc = inviterSnap.docs[0];
          const inviterData = inviterDoc.data();
          const bonusPercentage = inviterData.inviterBonusPercentage || 0;
          const bonusAmount = plan.cost * (bonusPercentage / 100);

          if (bonusAmount > 0) {
            await updateDoc(inviterDoc.ref, {
              balance: increment(bonusAmount),
              verifiedReferralCount: increment(1)
            });

            await addDoc(collection(db, "notifications"), {
              userId: inviterDoc.id,
              title: "Referral Upgrade Bonus!",
              message: `Your referral ${profile.displayName} upgraded to ${plan.name}. You earned ₦${bonusAmount.toLocaleString()} (${bonusPercentage}% bonus).`,
              type: 'SYSTEM',
              read: false,
              createdAt: new Date().toISOString()
            });
          }
        }
      }

      // 2. Update user to new plan
      await updateDoc(doc(db, "users", user.uid), {
        status: 'VERIFIED',
        planId: plan.id,
        planName: plan.name,
        planExpiry: expiry.toISOString(),
        planPercentage: plan.taskPercentage,
        maxDailyTasks: plan.maxDailyTasks,
        maxMonthlyTasks: plan.maxMonthlyTasks,
        maxTotalTasks: plan.maxTotalTasks,
        dailyTaskCount: 0,
        monthlyTaskCount: 0,
        withdrawalCount: 0,
        minWithdrawal: plan.minWithdrawal,
        withdrawalCharge: plan.withdrawalCharge,
        maxWithdrawalCount: plan.maxWithdrawalCount,
        gamesEnabled: plan.gamesEnabled ?? true,
        gamePercentage: plan.gamePercentage ?? 100,
        inviterBonusPercentage: plan.inviterBonusPercentage || 0,
        advertiserCommissionPercentage: plan.advertiserCommissionPercentage || 0
      });

      await addDoc(collection(db, "upgrades"), {
        userId: user.uid,
        userName: profile.displayName,
        planId: plan.id,
        planName: plan.name,
        amount: plan.cost,
        reference,
        createdAt: new Date().toISOString()
      });

      // CONFIRMATION MESSAGE
      toast({ 
        title: "Success! Plan Activated", 
        description: `Welcome to ${plan.name}! Your account has been verified and upgraded.`,
        duration: 5000 
      });

      router.push("/dashboard");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Activation Failed", description: "Payment was successful but account sync failed. Please contact support immediately." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || profileLoading || plansLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="container px-4 py-8 mx-auto max-w-4xl">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="gap-2" disabled={isSubmitting}>
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /> Back</Link>
          </Button>
        </div>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-primary text-white mb-4 shadow-xl">
            <ArrowUpCircle className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Membership Levels</h1>
          <p className="text-slate-500 max-w-md mx-auto">Unlock more tasks and higher earning rates.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map((plan: any) => {
            const isCurrent = profile?.planId === plan.id;
            return (
              <Card key={plan.id} className={`border-none shadow-xl rounded-[2.5rem] overflow-hidden flex flex-col h-full transition-all ${isCurrent ? 'ring-4 ring-primary scale-105' : 'hover:scale-[1.02]'}`}>
                <CardHeader className={`p-8 text-center ${isCurrent ? 'bg-primary text-white' : 'bg-slate-900 text-white'}`}>
                  {isCurrent && <Badge className="mb-2 bg-white text-primary border-none font-bold uppercase tracking-widest text-[8px]">Active Plan</Badge>}
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <p className="text-3xl font-black mt-2">₦{plan.cost.toLocaleString()}</p>
                </CardHeader>
                <CardContent className="p-8 space-y-4 flex-grow">
                  <div className="space-y-3">
                    <FeatureItem icon={Zap} label={plan.maxDailyTasks >= UNLIMITED_VAL ? "Unlimited Tasks" : `${plan.maxDailyTasks} Daily Tasks`} />
                    <FeatureItem icon={Percent} label={`${plan.taskPercentage}% Reward Share`} />
                    <FeatureItem icon={Users} label={`${plan.inviterBonusPercentage}% Referral Bonus`} />
                    <FeatureItem icon={History} label={plan.maxWithdrawalCount >= UNLIMITED_VAL ? "Unlimited Withdraws" : `${plan.maxWithdrawalCount} Max Withdraws`} />
                  </div>
                </CardContent>
                <CardFooter className="p-8 pt-0">
                  <Button 
                    onClick={() => handleUpgrade(plan)} 
                    disabled={isSubmitting || isCurrent}
                    className={`w-full h-14 rounded-2xl font-bold text-lg shadow-lg ${isCurrent ? 'bg-slate-100 text-slate-400' : 'bg-primary'}`}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : isCurrent ? "Active" : plan.cost === 0 ? "Join Free" : "Upgrade Now"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon: Icon, label }: any) {
  return (
    <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
      <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-primary"><Icon className="w-3.5 h-3.5" /></div>
      {label}
    </div>
  );
}
