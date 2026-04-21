
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Bell, 
  BellRing, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Zap,
  Info
} from "lucide-react";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function NotificationsConfigPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default");
  const [isRequesting, setIsRequesting] = useState(false);

  const profileRef = useMemoFirebase(() => {
    return user && db ? doc(db, "users", user.uid) : null;
  }, [user, db]);

  const { data: profile, loading: profileLoading } = useDoc<any>(profileRef);

  useEffect(() => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Your browser does not support push notifications."
      });
      return;
    }

    setIsRequesting(true);
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === "granted") {
        toast({
          title: "Subscribed!",
          description: "You will now receive alerts for task updates and payouts."
        });
      } else if (permission === "denied") {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You need to enable notifications in your browser settings."
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not request notification permissions."
      });
    } finally {
      setIsRequesting(false);
    }
  };

  if (authLoading || profileLoading) {
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
            <Link href="/notifications">
              <ArrowLeft className="w-4 h-4" /> Back to Inbox
            </Link>
          </Button>
        </div>

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-primary dark:text-primary-foreground mb-2 flex items-center gap-3">
            <BellRing className="w-8 h-8" /> Alert Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Control how you stay informed about TaskHome activity.</p>
        </div>

        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 mb-8">
          <CardHeader className="bg-primary text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-1">Current Status</p>
                <CardTitle className="text-2xl font-bold">
                  {permissionStatus === "granted" ? "Subscribed" : 
                   permissionStatus === "denied" ? "Blocked" : "Available"}
                </CardTitle>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${permissionStatus === 'granted' ? 'bg-green-500' : 'bg-white/20'} flex items-center justify-center text-white`}>
                {permissionStatus === 'granted' ? <CheckCircle2 className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Instant Updates</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Get notified the second a task is approved or a payment is sent.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Security Alerts</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Immediate warnings for new logins or profile changes.</p>
                </div>
              </div>
            </div>

            {permissionStatus === "denied" && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-rose-800 font-medium">
                  Notifications are blocked. To receive alerts, please click the lock icon in your browser address bar and change permissions to "Allow".
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="px-8 pb-8">
            <Button 
              onClick={handleRequestPermission}
              disabled={isRequesting || permissionStatus === "granted"}
              className={`w-full h-14 rounded-2xl font-bold text-lg shadow-lg gap-2 transition-all ${
                permissionStatus === 'granted' ? 'bg-slate-100 text-slate-400' : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {isRequesting ? <Loader2 className="w-5 h-5 animate-spin" /> : 
               permissionStatus === 'granted' ? <><CheckCircle2 className="w-5 h-5" /> Active</> : 
               "Enable Push Alerts"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
