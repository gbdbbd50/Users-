
"use client";

import { useState } from "react";
import { useAuth } from "@/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Reset link sent",
        description: "Check your email inbox for instructions to reset your password.",
      });
      setEmail("");
    } catch (error: any) {
      let title = "Error";
      let description = error.message || "Could not send reset email.";

      // Handle cases where user is not found
      // Note: Firebase security settings may sometimes prevent this error code 
      // from returning to prevent email enumeration, but we handle it here for standard configs.
      if (error.code === 'auth/user-not-found') {
        title = "Account Not Found";
        description = "This email is not registered. Please check the spelling or create a new account.";
      }

      toast({
        variant: "destructive",
        title: title,
        description: description,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline font-bold text-primary">Reset Password</CardTitle>
          <p className="text-muted-foreground">Enter your email to receive a reset link.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-primary h-12 text-lg" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Mail className="w-5 h-5 mr-2" /> Send Link</>}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center text-sm">
          <p className="text-muted-foreground">
            Remembered your password?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </p>
          <p className="text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary font-bold hover:underline">
              Create one
            </Link>
          </p>
          <Link href="/login" className="flex items-center justify-center text-primary font-bold hover:underline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
