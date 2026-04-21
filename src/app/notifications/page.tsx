
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Bell, 
  BellRing, 
  Settings, 
  Loader2, 
  CheckCircle2, 
  Zap,
  Info,
  Clock,
  Trash2,
  Inbox
} from "lucide-react";
import { doc, collection, query, where, orderBy, deleteDoc, writeBatch, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { SafeDate } from "@/components/SafeDate";

export default function NotificationsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);

  const profileRef = useMemoFirebase(() => {
    return user && db ? doc(db, "users", user.uid) : null;
  }, [user, db]);
  const { data: profile } = useDoc<any>(profileRef);

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: notifications, loading: notificationsLoading } = useCollection<any>(notificationsQuery);

  const handleClearAll = async () => {
    if (!db || !user || !notifications?.length) return;
    if (!confirm("Delete all notifications?")) return;
    
    setIsClearing(true);
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        batch.delete(doc(db, "notifications", n.id));
      });
      await batch.commit();
      toast({ title: "Inbox Cleared" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to clear", description: e.message });
    } finally {
      setIsClearing(false);
    }
  };

  const getDashboardHref = () => {
    if (profile?.role === "ADVERTISER") return "/dashboard/advertiser";
    if (profile?.role === "DEVELOPER") return "/dashboard/developer";
    if (profile?.role === "ADMIN") return "/admin";
    return "/dashboard";
  };

  if (authLoading || notificationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors">
      <div className="container px-4 py-8 mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href={getDashboardHref()}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleClearAll} disabled={isClearing || !notifications?.length} className="text-slate-400 hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-xl border-primary text-primary h-9">
              <Link href="/notifications/settings"><Settings className="w-4 h-4 mr-2" /> Settings</Link>
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary dark:text-primary-foreground mb-2 flex items-center gap-3">
            <BellRing className="w-8 h-8" /> Inbox
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Stay updated with your TaskHome activity.</p>
        </div>

        <div className="space-y-3">
          {notifications?.map((n: any) => (
            <Card key={n.id} className={`border-none shadow-sm rounded-2xl overflow-hidden transition-colors ${n.read ? 'bg-white dark:bg-slate-900 opacity-80' : 'bg-white dark:bg-slate-900 ring-1 ring-primary/20 shadow-md'}`}>
              <CardContent className="p-5 flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  n.type === 'DEPOSIT' ? 'bg-green-100 text-green-600' : 
                  n.type === 'SYSTEM' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {n.type === 'DEPOSIT' ? <Zap className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold dark:text-slate-200">{n.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium"><SafeDate date={n.createdAt} format="time" /></p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2">{n.message}</p>
                  <p className="text-[9px] text-slate-300 dark:text-slate-600 uppercase font-bold tracking-wider">
                    <SafeDate date={n.createdAt} format="date" />
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!notifications || notifications.length === 0) && (
            <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed dark:border-slate-800">
              <Inbox className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">Your inbox is empty</p>
              <p className="text-xs text-slate-300 mt-1">We'll notify you here when things happen.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
