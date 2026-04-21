
"use client";

import { useState, useEffect, Suspense } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Zap,
  Building2,
  Copy,
  Info,
  Wallet,
  ShieldCheck,
  Smartphone,
  Banknote,
  Clock,
  Lock,
  MessageCircle
} from "lucide-react";
import { doc, collection, addDoc, updateDoc, increment, query, where, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { paymentKeys } from "@/firebase/config";
import { generateXixapayVirtualAccount } from "@/app/actions/xixapay-actions";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

function TopUpForm() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const isActivation = searchParams.get('type') === 'activation';
  const paramAmount = searchParams.get('amount');

  const [amount, setAmount] = useState(paramAmount || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScriptsLoaded, setIsScriptsLoaded] = useState({ paystack: false });
  const [xixaAccount, setXixaAccount] = useState<any>(null);

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  useEffect(() => {
    // Load Paystack
    const psScript = document.createElement("script");
    psScript.src = "https://js.paystack.co/v1/inline.js";
    psScript.async = true;
    psScript.onload = () => setIsScriptsLoaded(prev => ({ ...prev, paystack: true }));
    document.body.appendChild(psScript);

    return () => { 
      if (document.body.contains(psScript)) document.body.removeChild(psScript); 
    };
  }, []);

  const handleGenerateXixapayVA = async () => {
    if (!db || !user) return;
    
    setIsSubmitting(true);
    try {
      const requestAmount = parseFloat(amount) || 0;
      
      const result = await generateXixapayVirtualAccount(requestAmount, {
        email: user.email || `user-${user.uid}@taskhome.com`,
        name: profile?.displayName || "Member"
      });

      if (result.success) {
        setXixaAccount(result.data);
        toast({ title: "Virtual Account Ready" });
      } else {
        toast({ variant: "destructive", title: "Generation Failed", description: result.message });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaystackDeposit = async () => {
    if (!db || !user || !amount) {
      toast({ variant: "destructive", title: "Amount Required" });
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount" });
      return;
    }

    setIsSubmitting(true);
    const publicKey = paymentKeys.paystack;
    if (!publicKey || !window.PaystackPop) {
      toast({ variant: "destructive", title: "Config Error", description: "Paystack is not ready. Please refresh." });
      setIsSubmitting(false);
      return;
    }

    try {
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: user.email || `user-${user.uid}@taskhome.com`,
        amount: Math.round(numAmount * 100),
        currency: "NGN",
        ref: 'TH-PS-' + Date.now(),
        callback: (response: any) => {
          onPaymentSuccess(response.reference, numAmount, 'PAYSTACK');
        },
        onClose: () => {
          setIsSubmitting(false);
          toast({ title: "Transaction Cancelled" });
        }
      });
      handler.openIframe();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
      setIsSubmitting(false);
    }
  };

  const onPaymentSuccess = async (reference: string, confirmedAmount: number, gateway: string) => {
    if (!db || !user) return;
    
    try {
      const isAdvertiser = profile?.role === 'ADVERTISER';
      const updates: any = { 
        balance: increment(confirmedAmount), 
        depositCount: increment(1) 
      };

      if ((isAdvertiser && profile?.status !== 'VERIFIED') || isActivation) {
        updates.status = 'VERIFIED';
      }

      await updateDoc(doc(db, "users", user.uid), updates);

      // Handle Referral Commission for Advertiser Deposit
      if (profile?.referredBy) {
        const inviterQuery = query(collection(db, "users"), where("referralCode", "==", profile.referredBy));
        const inviterSnap = await getDocs(inviterQuery);
        
        if (!inviterSnap.empty) {
          const inviterDoc = inviterSnap.docs[0];
          const inviterData = inviterDoc.data();
          const commissionPercentage = inviterData.advertiserCommissionPercentage || 0;
          const commissionAmount = confirmedAmount * (commissionPercentage / 100);

          if (commissionAmount > 0) {
            await updateDoc(inviterDoc.ref, {
              balance: increment(commissionAmount)
            });

            await addDoc(collection(db, "notifications"), {
              userId: inviterDoc.id,
              title: "Referral Commission Received!",
              message: `Your referral ${profile.displayName} deposited ₦${confirmedAmount.toLocaleString()}. You earned ₦${commissionAmount.toLocaleString()} (${commissionPercentage}% commission).`,
              type: 'DEPOSIT',
              read: false,
              createdAt: new Date().toISOString()
            });
          }
        }
      }

      await addDoc(collection(db, "deposits"), { 
        userId: user.uid, amount: confirmedAmount, method: gateway, reference, 
        status: 'APPROVED', type: isActivation ? 'ACTIVATION' : 'DEPOSIT', createdAt: new Date().toISOString() 
      });

      toast({ title: "Success!", description: "Wallet Credited Successfully." });
      router.push(isAdvertiser ? "/dashboard/advertiser" : "/dashboard");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Sync Error", description: "Payment was successful but balance update failed. Contact support." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || profileLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  const whatsAppUrl = `https://wa.me/27632790884?text=Hello%20TaskHome%20Support,%20I%20want%20to%20manually%20top%20up%20my%20wallet%20with%20₦${amount || '0'}`;

  return (
    <div className="container px-4 py-8 mx-auto max-w-lg">
      <Button asChild variant="ghost" className="mb-6" disabled={isSubmitting}><Link href={isActivation ? "/activate" : profile?.role === 'ADVERTISER' ? "/dashboard/advertiser" : "/dashboard"}><ArrowLeft className="mr-2 w-4 h-4" /> Back</Link></Button>
      
      <div className="mb-8">
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Available Credit</p>
        <h1 className="text-4xl font-black text-primary">₦{profile?.balance?.toLocaleString() || "0"}</h1>
      </div>
      
      <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="border-b py-4 px-6 flex flex-row items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
            <Lock className="w-4 h-4" />
          </div>
          <CardTitle className="text-lg font-bold text-slate-800">Deposit</CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 space-y-8">
          <div className="space-y-4 text-center">
            {!xixaAccount ? (
              <>
                <p className="text-xs text-slate-400 font-medium px-4">
                  Automate your deposit balance by creating a dedicated virtual account.
                </p>
                <Button 
                  onClick={handleGenerateXixapayVA}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm shadow-md"
                >
                  {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : "Generate Virtual Account"}
                </Button>
              </>
            ) : (
              <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 text-left space-y-3 animate-in fade-in zoom-in duration-300">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Active Virtual Account</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Bank</span>
                    <span className="text-xs font-bold text-slate-800">{xixaAccount.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Account Number</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-primary">{xixaAccount.accountNumber}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={() => { navigator.clipboard.writeText(xixaAccount.accountNumber); toast({title: "Copied!"}); }}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Name</span>
                    <span className="text-xs font-bold text-slate-800">{xixaAccount.accountName}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-blue-100 flex items-center gap-2">
                  <Clock className="w-3 h-3 text-blue-400" />
                  <p className="text-[9px] text-blue-500 font-medium">Auto-credits wallet upon transfer.</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-bold text-slate-700">Deposit Amount *</Label>
            <div className="relative group">
              <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-slate-50 border-r border-slate-200 rounded-l-xl group-focus-within:border-primary transition-colors">
                <Banknote className="w-5 h-5 text-slate-400" />
              </div>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="h-14 pl-16 rounded-xl text-lg font-bold bg-white border-slate-200 focus:ring-primary focus:border-primary" 
                disabled={isSubmitting}
              />
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm font-medium text-slate-500">Currency: <span className="text-slate-800 font-bold">NGN</span></p>
              <Button 
                onClick={handlePaystackDeposit} 
                disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
                className="h-12 px-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg transition-transform active:scale-95"
              >
                {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : "Deposit"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-3">
        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Other Methods</p>
        <Button 
          asChild 
          variant="outline" 
          className="w-full h-14 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold gap-3"
          disabled={!amount || parseFloat(amount) <= 0}
        >
          <Link href={whatsAppUrl} target="_blank">
            <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
              <MessageCircle className="w-4 h-4 fill-current" />
            </div>
            Chat on WhatsApp (Manual)
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function TopUpPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-12 transition-colors">
      <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>}><TopUpForm /></Suspense>
    </div>
  );
}
