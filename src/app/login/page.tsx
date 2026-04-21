
"use client";

import { useState, useEffect } from "react";
import { useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { LogIn, Loader2, Phone, Mail, ChevronRight, Globe, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { recaptchaSiteKey } from "@/firebase/config";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'EMAIL' | 'PHONE' | null>('EMAIL');

  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => db ? doc(db, "settings", "global") : null, [db]);
  const { data: settings } = useDoc<any>(settingsRef);

  const handleRoleRedirect = async (userId: string) => {
    if (!db) return;
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // AUTO EXPIRATION CHECK
      if (userData.planExpiry && new Date(userData.planExpiry) < new Date()) {
        await updateDoc(userRef, {
          planId: null,
          planName: "Starter",
          planExpiry: null,
          maxDailyTasks: 0,
          maxMonthlyTasks: 0,
          maxTotalTasks: 0,
          minWithdrawal: 5000,
          withdrawalCharge: 0,
          gamesEnabled: false,
          gamePercentage: 0,
          planPercentage: 0
        });
        toast({ title: "Plan Expired", description: "Your membership has expired. You've been moved back to the Starter tier." });
      }

      const role = userData.role;

      if (settings?.maintenanceMode && role !== 'DEVELOPER') {
        if (auth) await signOut(auth);
        toast({ variant: "destructive", title: "Maintenance Mode", description: "Access restricted." });
        return;
      }

      toast({ title: "Success", description: `Welcome back, ${userData.displayName || 'Member'}` });

      switch (role) {
        case "ADMIN": router.push("/admin"); break;
        case "ADVERTISER": router.push("/dashboard/advertiser"); break;
        case "DEVELOPER": router.push("/dashboard/developer"); break;
        default: router.push("/dashboard"); break;
      }
    } else {
      const referralCode = Math.random().toString(36).substring(2, 10);
      await setDoc(userRef, {
        displayName: auth?.currentUser?.displayName || "Member",
        email: auth?.currentUser?.email || null,
        phoneNumber: auth?.currentUser?.phoneNumber || null,
        referralCode,
        role: "EARNER",
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
        status: "UNVERIFIED",
        createdAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Profile Created", description: "Welcome to TaskHome!" });
      router.push("/dashboard");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      await handleRoleRedirect(res.user.uid);
    } catch (error: any) {
      let description = error.message;
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        description = "Invalid email or password. Please try again.";
      }
      toast({ variant: "destructive", title: "Login failed", description });
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !db) return;
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      await handleRoleRedirect(res.user.uid);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Google Login Failed", description: error.message });
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !phone) return;
    setLoading(true);
    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 
        size: 'invisible',
        sitekey: recaptchaSiteKey 
      });
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(result);
      setIsOtpStep(true);
      toast({ title: "OTP Sent", description: "Verification code sent to your phone." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || !otp) return;
    setLoading(true);
    try {
      const res = await confirmationResult.confirm(otp);
      await handleRoleRedirect(res.user.uid);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Invalid OTP", description: error.message });
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[80vh] px-4 py-12">
      <Card className="w-full max-w-md border-none shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <span className="bg-primary text-white px-3 py-1.5 rounded-2xl text-2xl font-black tracking-tighter shadow-xl shadow-primary/20">
                CD
              </span>
              <span className="text-2xl font-headline font-bold text-primary tracking-tight">
                TaskHome
              </span>
            </div>
          </div>
          <CardTitle className="text-3xl font-headline font-bold text-primary">Welcome Back</CardTitle>
          <p className="text-muted-foreground text-sm">Choose your preferred login method.</p>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          <div id="recaptcha-container"></div>

          {settings?.googleAuthEnabled && (
            <Button 
              onClick={handleGoogleLogin} 
              variant="outline" 
              className="w-full h-12 rounded-xl gap-2 font-bold border-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
          )}

          {(settings?.googleAuthEnabled || settings?.phoneAuthEnabled) && (
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Separator className="flex-1" /> OR <Separator className="flex-1" />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              <button 
                type="button"
                onClick={() => { setAuthMethod('EMAIL'); setIsOtpStep(false); }}
                className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${authMethod === 'EMAIL' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
                disabled={loading}
              >
                Email
              </button>
              {settings?.phoneAuthEnabled && (
                <button 
                  type="button"
                  onClick={() => setAuthMethod('PHONE')}
                  className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${authMethod === 'PHONE' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
                  disabled={loading}
                >
                  Phone
                </button>
              )}
            </div>

            {authMethod === 'EMAIL' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="rounded-xl h-12" disabled={loading} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Password</Label>
                    <Link href="/forgot-password" size="sm" className="text-xs text-primary font-bold hover:underline">Forgot?</Link>
                  </div>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="rounded-xl h-12" disabled={loading} />
                </div>
                <Button type="submit" className="w-full bg-primary text-white h-12 rounded-xl text-lg font-bold shadow-lg" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login"}
                </Button>
              </form>
            )}

            {authMethod === 'PHONE' && (
              <div className="space-y-4">
                {!isOtpStep ? (
                  <form onSubmit={handlePhoneLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+234..." className="rounded-xl h-12" disabled={loading} />
                      <p className="text-[10px] text-slate-400">Include country code (e.g. +234)</p>
                    </div>
                    <Button type="submit" className="w-full bg-primary text-white h-12 rounded-xl text-lg font-bold gap-2" disabled={loading || !phone}>
                      {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Send Code"}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Enter 6-digit Code</Label>
                      <Input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="123456" className="rounded-xl h-12 text-center text-2xl tracking-[0.5em] font-black" disabled={loading} />
                    </div>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white h-12 rounded-xl text-lg font-bold" disabled={loading || otp.length < 6}>
                      {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Verify & Login"}
                    </Button>
                    <button type="button" onClick={() => setIsOtpStep(false)} className="w-full text-xs text-slate-400 font-bold hover:underline" disabled={loading}>Change Number</button>
                  </form>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 pt-4 border-t">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <p className="text-[10px] text-slate-400 font-medium">Protected by reCAPTCHA and App Check</p>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 p-6 text-center text-sm font-medium">
          <p className="text-slate-500 w-full">
            New here? <Link href="/signup" className="text-primary font-bold hover:underline">Create an account</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
