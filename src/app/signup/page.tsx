
"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs, updateDoc, increment, getDoc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { UserPlus, Loader2, Briefcase, User, CheckCircle2, Phone, Mail, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { recaptchaSiteKey } from "@/firebase/config";
import { BrandedLoader } from "@/components/BrandedLoader";

function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [role, setRole] = useState<"EARNER" | "ADVERTISER">("EARNER");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'EMAIL' | 'PHONE' | null>('EMAIL');
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => db ? doc(db, "settings", "global") : null, [db]);
  const { data: settings } = useDoc<any>(settingsRef);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref);
  }, [searchParams]);

  const validateReferral = async (code: string) => {
    if (!db || !code) return null;
    const q = query(collection(db, "users"), where("referralCode", "==", code));
    const snap = await getDocs(q);
    if (snap.empty) {
      toast({ variant: "destructive", title: "Invalid Code", description: "Referral code not found." });
      return null;
    }
    return snap.docs[0].id;
  };

  const initializeProfile = async (userId: string, uName: string, uEmail?: string, uPhone?: string) => {
    if (!db) return;
    const refId = await validateReferral(referralCode);
    if (referralCode && !refId) return false;

    const userReferralCode = uName.toLowerCase().replace(/\s+/g, '') + Math.floor(100 + Math.random() * 900);
    
    await setDoc(doc(db, "users", userId), {
      email: uEmail || null,
      phoneNumber: uPhone || null,
      displayName: uName,
      legalFullName: "",
      referralCode: userReferralCode,
      role: role,
      balance: 0,
      completedTasks: 0,
      dailyTaskCount: 0,
      monthlyTaskCount: 0,
      totalTaskCount: 0,
      maxDailyTasks: 0,
      maxMonthlyTasks: 0,
      maxTotalTasks: 0,
      minWithdrawal: 5000,
      withdrawalCharge: 0,
      gamesEnabled: false,
      gamePercentage: 0,
      planPercentage: 0,
      planName: "Starter",
      planId: null,
      referralCount: 0,
      verifiedReferralCount: 0,
      referredBy: referralCode || null,
      status: "UNVERIFIED",
      createdAt: new Date().toISOString()
    }, { merge: true });

    if (refId) {
      await updateDoc(doc(db, "users", refId), { referralCount: increment(1) });
    }
    return true;
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db || settings?.maintenanceMode) return;
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(res.user, { displayName: name });
      const success = await initializeProfile(res.user.uid, name, email);
      
      if (success) {
        toast({ title: "Welcome to TaskHome!", description: "Registration successful." });
        router.push(role === 'ADVERTISER' ? "/dashboard/advertiser" : "/dashboard");
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      let description = error.message;
      if (error.code === 'auth/email-already-in-use') {
        description = "This email is already registered. Please log in or use a different email.";
      }
      toast({ variant: "destructive", title: "Signup Failed", description });
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!auth || !db) return;
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const userDoc = await getDoc(doc(db, "users", res.user.uid));
      if (!userDoc.exists()) {
        await initializeProfile(res.user.uid, res.user.displayName || "Member", res.user.email || undefined);
      }
      toast({ title: "Welcome to TaskHome!", description: "Signed up with Google successfully." });
      router.push("/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Google Signup Failed", description: error.message });
      setLoading(false);
    }
  };

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !phone || !name) return;
    setLoading(true);
    try {
      const appVerifier = new RecaptchaVerifier(auth, 'recaptcha-signup', { 
        size: 'invisible',
        sitekey: recaptchaSiteKey 
      });
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(result);
      setIsOtpStep(true);
      toast({ title: "Verification Code Sent" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || !otp) return;
    setLoading(true);
    try {
      const res = await confirmationResult.confirm(otp);
      await initializeProfile(res.user.uid, name, undefined, phone);
      toast({ title: "Welcome to TaskHome!", description: "Phone verification successful." });
      router.push("/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Invalid OTP", description: error.message });
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[80vh] px-4 py-12">
      <Card className="w-full max-w-md border-none shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground px-3 py-1.5 rounded-2xl text-2xl font-black tracking-tighter shadow-xl shadow-primary/20">
                CD
              </span>
              <span className="text-2xl font-headline font-bold text-primary tracking-tight">
                TaskHome
              </span>
            </div>
          </div>
          <CardTitle className="text-3xl font-headline font-bold text-primary">Join TaskHome</CardTitle>
          <p className="text-muted-foreground text-sm">Grow your digital footprint today.</p>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          <div id="recaptcha-signup"></div>
          
          <RadioGroup defaultValue="EARNER" onValueChange={(v) => setRole(v as any)} className="grid grid-cols-2 gap-4">
            <div>
              <RadioGroupItem value="EARNER" id="earner" className="peer sr-only" disabled={loading} />
              <Label htmlFor="earner" className="relative flex flex-col items-center justify-center rounded-2xl border-2 p-4 hover:bg-slate-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all h-full">
                <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary hidden peer-data-[state=checked]:block" />
                <User className="mb-2 h-6 w-6" />
                <span className="font-bold text-xs">Earner</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="ADVERTISER" id="advertiser" className="peer sr-only" disabled={loading} />
              <Label htmlFor="advertiser" className="relative flex flex-col items-center justify-center rounded-2xl border-2 p-4 hover:bg-slate-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all h-full">
                <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary hidden peer-data-[state=checked]:block" />
                <Briefcase className="mb-2 h-6 w-6" />
                <span className="font-bold text-xs">Advertiser</span>
              </Label>
            </div>
          </RadioGroup>

          {settings?.googleAuthEnabled && (
            <Button onClick={handleGoogleSignup} variant="outline" className="w-full h-12 rounded-xl gap-2 font-bold border-2" disabled={loading}>
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Sign up with Google
                </>
              )}
            </Button>
          )}

          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            <Separator className="flex-1" /> OR <Separator className="flex-1" />
          </div>

          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button onClick={() => setAuthMethod('EMAIL')} className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${authMethod === 'EMAIL' ? 'bg-white text-primary' : 'text-slate-500'}`} disabled={loading}>Email</button>
            {settings?.phoneAuthEnabled && (
              <button onClick={() => setAuthMethod('PHONE')} className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${authMethod === 'PHONE' ? 'bg-white text-primary' : 'text-slate-500'}`} disabled={loading}>Phone</button>
            )}
          </div>

          {authMethod === 'EMAIL' && (
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div className="space-y-2"><Label>Username</Label><Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. EarnerHero" className="rounded-xl h-12" disabled={loading} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="rounded-xl h-12" disabled={loading} /></div>
              <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" className="rounded-xl h-12" disabled={loading} /></div>
              <div className="space-y-2"><Label>Referral Code (Optional)</Label><Input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="Code" className="rounded-xl h-12" disabled={loading} /></div>
              <Button type="submit" className="w-full bg-primary h-12 rounded-xl text-lg font-bold shadow-lg" disabled={loading}>{loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Create Account"}</Button>
            </form>
          )}

          {authMethod === 'PHONE' && (
            <div className="space-y-4">
              {!isOtpStep ? (
                <form onSubmit={handlePhoneSignup} className="space-y-4">
                  <div className="space-y-2"><Label>Username</Label><Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. EarnerHero" className="rounded-xl h-12" disabled={loading} /></div>
                  <div className="space-y-2"><Label>Phone Number</Label><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+234..." className="rounded-xl h-12" disabled={loading} /></div>
                  <div className="space-y-2"><Label>Referral Code</Label><Input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="Code" className="rounded-xl h-12" disabled={loading} /></div>
                  <Button type="submit" className="w-full bg-primary h-12 rounded-xl text-lg font-bold" disabled={loading || !phone || !name}>{loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Verify Phone"}</Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2"><Label>Verification Code</Label><Input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} className="rounded-xl h-12 text-center text-2xl font-black tracking-widest" disabled={loading} /></div>
                  <Button type="submit" className="w-full bg-green-600 h-12 rounded-xl text-lg font-bold" disabled={loading || otp.length < 6}>{loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Complete Signup"}</Button>
                </form>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 pt-4 border-t">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <p className="text-[10px] text-slate-400 font-medium">Protected by reCAPTCHA and App Check</p>
          </div>
        </CardContent>
        <CardFooter className="text-center text-sm font-medium p-6 bg-slate-50">
          <p className="w-full text-slate-500">Already a member? <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<BrandedLoader welcome={false} />}>
      <SignupForm />
    </Suspense>
  );
}
