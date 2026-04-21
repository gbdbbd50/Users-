
"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  MessageCircle, 
  Send,
  CreditCard,
  Building2,
  Lock
} from "lucide-react";
import { doc, updateDoc, increment, addDoc, collection } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { paymentKeys } from "@/firebase/config";

export default function ActivationPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    return user && db ? doc(db, "users", user.uid) : null;
  }, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  const settingsRef = useMemoFirebase(() => db ? doc(db, "settings", "global") : null, [db]);
  const { data: settings } = useDoc<any>(settingsRef);

  useEffect(() => {
    // Load Paystack script
    const psScript = document.createElement("script");
    psScript.src = "https://js.paystack.co/v1/inline.js";
    psScript.async = true;
    document.body.appendChild(psScript);

    return () => { 
      if (document.body.contains(psScript)) document.body.removeChild(psScript); 
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!profileLoading && profile?.status === 'VERIFIED') {
      router.push("/dashboard");
    }
  }, [user, authLoading, profile, profileLoading, router]);

  const activationFee = settings?.activationFee || 1000;

  const handlePaystackPayment = async () => {
    if (!db || !user || !activationFee) return;

    setIsSubmitting(true);
    const publicKey = paymentKeys.paystack;
    
    if (!publicKey || !(window as any).PaystackPop) {
      toast({ variant: "destructive", title: "Configuration Error", description: "Payment gateway is not ready. Please wait a moment and try again." });
      setIsSubmitting(false);
      return;
    }

    try {
      const handler = (window as any).PaystackPop.setup({
        key: publicKey,
        email: user.email || `user-${user.uid}@taskhome.com`,
        amount: Math.round(activationFee * 100),
        currency: "NGN",
        ref: 'TH-ACT-' + Date.now(),
        callback: (response: any) => {
          onPaymentSuccess(response.reference, activationFee);
        },
        onClose: () => {
          setIsSubmitting(false);
          toast({ title: "Payment Cancelled" });
        }
      });
      handler.openIframe();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
      setIsSubmitting(false);
    }
  };

  const onPaymentSuccess = async (reference: string, amount: number) => {
    if (!db || !user) return;
    
    try {
      // 1. Update user to VERIFIED
      await updateDoc(doc(db, "users", user.uid), {
        status: 'VERIFIED',
        depositCount: increment(1)
      });

      // 2. Log the deposit as an ACTIVATION type
      await addDoc(collection(db, "deposits"), {
        userId: user.uid,
        amount: amount,
        method: 'PAYSTACK',
        reference,
        status: 'APPROVED',
        type: 'ACTIVATION',
        createdAt: new Date().toISOString()
      });

      // 3. Send Notification to User
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "Account Activated!",
        message: `Your account has been successfully verified and activated. Welcome to the TaskHome community!`,
        type: 'SYSTEM',
        read: false,
        createdAt: new Date().toISOString()
      });

      toast({ title: "Account Activated!", description: "Welcome to the verified club." });
      router.push(profile?.role === 'ADVERTISER' ? "/dashboard/advertiser" : "/dashboard");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Sync Error", description: "Payment was successful but activation failed. Contact support." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const features = [
    { title: "Task Marketplace", description: "Unlock 100+ daily tasks across all social platforms.", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
    { title: "Fast Payouts", description: "Verified members get priority withdrawal processing within 24h.", icon: CreditCard, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Higher Limits", description: "Perform unlimited tasks per day without any earning restrictions.", icon: ShieldCheck, color: "text-green-500", bg: "bg-green-50" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="container px-4 py-8 mx-auto max-w-lg">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="gap-2" disabled={isSubmitting}>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-primary text-white mb-4 shadow-xl shadow-primary/20">
            <Zap className="w-10 h-10 fill-current" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Activate Your Account</h1>
          <p className="text-slate-600 text-sm">Unlock the full power of TaskHome and start earning today.</p>
        </div>

        <div className="space-y-4 mb-10">
          {features.map((f, i) => (
            <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${f.bg} ${f.color} flex items-center justify-center shrink-0`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
          <CardHeader className="p-8 pb-4">
            <Badge className="w-fit mb-2 bg-primary/20 text-primary border-none font-bold uppercase tracking-widest text-[10px]">Membership Fee</Badge>
            <CardTitle className="text-4xl font-black">₦{activationFee.toLocaleString()}</CardTitle>
            <CardDescription className="text-slate-400">One-time activation fee for lifetime access.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                No hidden charges or monthly fees
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Instant activation upon confirmation
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button 
                onClick={handlePaystackPayment}
                disabled={isSubmitting}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl text-lg shadow-lg gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />} 
                Pay with Paystack
              </Button>
              <Button variant="outline" asChild className="w-full h-14 border-slate-700 bg-transparent text-white hover:bg-slate-800 rounded-2xl font-bold gap-2">
                <Link href="https://wa.me/2349039226769?text=Hello%20TaskHome%20Support,%20I%20want%20to%20activate%20my%20account%20manually." target="_blank">
                  <MessageCircle className="w-5 h-5" /> Manual Activation
                </Link>
              </Button>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-800/50 p-6 flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Secure 256-bit Encrypted Transaction</p>
          </CardFooter>
        </Card>

        <div className="mt-8 text-center space-y-4">
          <p className="text-[10px] text-slate-400 font-medium px-8">
            By activating, you agree to our terms of service. Account activation is non-refundable as it grants immediate access to digital assets.
          </p>
          <div className="flex items-center justify-center gap-4 grayscale opacity-50">
            <Building2 className="w-8 h-8" />
            <ShieldCheck className="w-8 h-8" />
            <Zap className="w-8 h-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
