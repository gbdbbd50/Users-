
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { TaskCard } from "@/components/TaskCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Filter, 
  Loader2, 
  ArrowLeft, 
  ShieldAlert, 
  Zap, 
  CheckCircle2 
} from "lucide-react";
import { collection, query, where, doc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BrandedLoader } from "@/components/BrandedLoader";

export default function TasksPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const userProfileRef = useMemoFirebase(() => {
    return user && db ? doc(db, "users", user.uid) : null;
  }, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  // Get all active tasks
  const tasksQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "tasks"), where("status", "==", "ACTIVE"));
  }, [db]);
  const { data: rawTasks, loading: tasksLoading } = useCollection<any>(tasksQuery);

  // Get user's own submissions
  const userSubmissionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "submissions"), where("userId", "==", user.uid));
  }, [db, user]);
  const { data: userSubmissions, loading: subsLoading } = useCollection<any>(userSubmissionsQuery);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    if (!authLoading && !profileLoading && profile) {
      // STRICT ROLE GUARD: Redirect anyone not an EARNER
      if (profile.role !== "EARNER" && profile.role !== "DEVELOPER") {
        router.push("/dashboard");
      } else if (profile.status !== 'VERIFIED' && profile.role !== 'DEVELOPER') {
        setShowVerificationModal(true);
      }
    }
  }, [user, authLoading, profile, profileLoading, router]);

  if (authLoading || tasksLoading || profileLoading || subsLoading || !user) {
    return <BrandedLoader welcome={false} />;
  }

  // Safety check for final render
  if (profile?.role !== "EARNER" && profile?.role !== "DEVELOPER") return null;

  // Filter and sort in memory
  const submittedTaskIds = new Set(userSubmissions?.map((s: any) => s.taskId) || []);
  const availableTasks = (rawTasks || [])
    .filter((t: any) => !submittedTaskIds.has(t.id))
    .filter((t: any) => t.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (b.reward || 0) - (a.reward || 0));

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary mb-2">Available Tasks</h1>
          <p className="text-muted-foreground">Tasks you haven't performed yet. Get started and earn ₦.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search tasks..." 
              className="pl-10 h-11 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0 h-11 w-11 rounded-xl">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {availableTasks.map((task: any) => (
          <TaskCard key={task.id} task={task} profile={profile} />
        ))}
      </div>

      {availableTasks.length === 0 && (
        <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-slate-200" />
          </div>
          <p className="text-slate-500 font-bold text-lg mb-2">Queue Empty</p>
          <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">You've completed all currently available tasks or the catalog is empty. Check back soon!</p>
          <Button asChild variant="outline" className="rounded-xl font-bold">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      )}

      <Dialog open={showVerificationModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-primary p-8 text-center text-white relative">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold mb-2">Account Not Activated</DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-sm">
              You must activate your account to start performing tasks and earning rewards.
            </DialogDescription>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-sm font-medium text-slate-700">Access high-paying social media tasks</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-sm font-medium text-slate-700">Enable instant withdrawal processing</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-sm font-medium text-slate-700">Unlimited task submissions daily</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => router.push('/upgrade')}
                className="w-full h-12 rounded-xl bg-primary font-bold shadow-lg shadow-primary/20 gap-2"
              >
                <Zap className="w-4 h-4" /> Activate Now
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => router.push('/dashboard')}
                className="w-full h-12 rounded-xl text-slate-500 font-bold hover:bg-slate-50"
              >
                Not Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
