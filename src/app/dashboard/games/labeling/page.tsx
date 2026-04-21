
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck,
  Timer,
  Info,
  MessageCircle,
  LayoutList
} from "lucide-react";
import { doc, updateDoc, increment, addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function LabelingSprintPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'SELECT' | 'IDLE' | 'PLAYING' | 'RESULT'>('SELECT');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [currentT, setCurrentT] = useState(0);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userPlays, setUserPlays] = useState<Set<string>>(new Set());

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  const settingsRef = useMemoFirebase(() => db ? doc(db, "settings", "global") : null, [db]);
  const { data: settings } = useDoc<any>(settingsRef);

  const labelingQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "game_catalog"), where("type", "==", "labeling"), where("active", "==", true));
  }, [db]);

  const { data: catalogs, loading: catalogLoading } = useCollection<any>(labelingQuery);

  useEffect(() => {
    if (db && user) {
      const fetchPlays = async () => {
        const q = query(collection(db, "game_sessions"), where("userId", "==", user.uid), where("gameType", "==", "labeling"));
        const snap = await getDocs(q);
        const ids = new Set<string>();
        snap.forEach(doc => ids.add(doc.data().catalogId));
        setUserPlays(ids);
      };
      fetchPlays();
    }
  }, [db, user]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!profileLoading && profile && profile.role !== 'EARNER') {
      router.push("/dashboard");
    }
  }, [user, authLoading, profile, profileLoading, router]);

  const globalMinStake = settings?.gamesConfig?.labeling?.minStake || 10;

  const handleStart = (task: any) => {
    if (userPlays.has(task.id)) {
      toast({ variant: "destructive", title: "Session Completed", description: "You have already completed this sprint." });
      return;
    }

    const stake = task.stake || globalMinStake;
    if (!profile || profile.balance < stake) {
      toast({ variant: "destructive", title: "Insufficient Funds", description: "You need more balance to stake." });
      return;
    }
    setSelectedTask(task);
    setGameState('PLAYING');
    setCurrentT(0);
    setScore(0);
  };

  const handleAction = async (ans: 'YES' | 'NO') => {
    const tasks = selectedTask.tasks;
    const isCorrect = ans === tasks[currentT].a;
    if (isCorrect) setScore(s => s + 1);

    if (currentT < tasks.length - 1) {
      setCurrentT(t => t + 1);
    } else {
      finalize(isCorrect ? score + 1 : score);
    }
  };

  const finalize = async (finalScore: number) => {
    if (!db || !user || !selectedTask) return;
    setIsSubmitting(true);
    const stake = selectedTask.stake || globalMinStake;
    const tasksCount = selectedTask.tasks.length;
    const win = finalScore === tasksCount;
    const reward = win ? stake * 2 : 0;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(win ? (reward - stake) : -stake)
      });

      await addDoc(collection(db, "game_sessions"), {
        userId: user.uid,
        userName: profile.displayName,
        gameType: 'labeling',
        catalogId: selectedTask.id,
        stake: stake,
        reward: reward,
        win: win,
        score: finalScore,
        createdAt: new Date().toISOString()
      });

      setUserPlays(prev => new Set(prev).add(selectedTask.id));
      setGameState('RESULT');
    } catch (e: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || profileLoading || catalogLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors">
      <div className="container px-4 py-8 mx-auto max-w-lg">
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2" disabled={gameState === 'PLAYING'}>
          <Link href="/dashboard/games"><ArrowLeft className="w-4 h-4" /> Back</Link>
        </Button>

        {gameState === 'SELECT' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Zap className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">Labeling Sprints</h1>
              <p className="text-slate-500 text-sm mt-2">Identify patterns and verify data for high-speed rewards.</p>
            </div>

            {catalogs && catalogs.length > 0 ? (
              <div className="grid gap-4">
                {catalogs.map((cat: any) => {
                  const played = userPlays.has(cat.id);
                  return (
                    <Card key={cat.id} className={`border-none shadow-md hover:shadow-xl transition-all rounded-3xl overflow-hidden cursor-pointer bg-white dark:bg-slate-900 ${played ? 'opacity-60' : ''}`} onClick={() => !played && handleStart(cat)}>
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl ${played ? 'bg-slate-100 text-slate-400' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600'} flex items-center justify-center`}>
                            {played ? <CheckCircle2 className="w-6 h-6" /> : <LayoutList className="w-6 h-6" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200">{cat.title}</h3>
                            <p className="text-xs text-slate-400">{cat.tasks?.length || 0} Batches</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-purple-600">₦{cat.stake || globalMinStake}</p>
                          <Badge className="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 text-[8px] uppercase mt-1">{played ? "Completed" : "Live"}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-none shadow-sm rounded-[2.5rem] p-10 text-center bg-white dark:bg-slate-900 border-2 border-dashed">
                <LayoutList className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Queue Empty</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                  No labeling tasks are available right now. We replenish tasks frequently. Join our news groups for availability alerts.
                </p>
                <Button asChild className="w-full h-12 rounded-xl font-bold gap-2">
                  <Link href="/support"><MessageCircle className="w-4 h-4" /> Support & News</Link>
                </Button>
              </Card>
            )}
          </div>
        )}

        {gameState === 'PLAYING' && selectedTask && (
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900">
            <div className="aspect-video w-full relative bg-slate-100 dark:bg-slate-800">
              <img src={selectedTask.tasks[currentT].img} className="w-full h-full object-cover" />
              <Badge className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border-none">{currentT + 1} / {selectedTask.tasks.length}</Badge>
            </div>
            <CardHeader className="text-center p-8">
              <CardTitle className="text-xl font-bold dark:text-slate-200">{selectedTask.tasks[currentT].q}</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 flex gap-4">
              <Button onClick={() => handleAction('YES')} className="flex-1 h-14 rounded-2xl bg-green-600 font-bold text-lg">YES</Button>
              <Button onClick={() => handleAction('NO')} className="flex-1 h-14 rounded-2xl bg-rose-600 font-bold text-lg">NO</Button>
            </CardContent>
          </Card>
        )}

        {gameState === 'RESULT' && selectedTask && (
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900">
            <div className={`p-12 text-center text-white ${score === selectedTask.tasks.length ? 'bg-green-500' : 'bg-rose-500'}`}>
              <h2 className="text-4xl font-black mb-2">{score === selectedTask.tasks.length ? 'PERFECT!' : 'FAILED'}</h2>
              <p className="text-white/80 font-bold uppercase tracking-widest text-xs">Score: {score}/{selectedTask.tasks.length}</p>
            </div>
            <CardContent className="p-10 space-y-6 text-center">
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Session Result</p>
                <p className={`text-3xl font-black ${score === selectedTask.tasks.length ? 'text-green-600' : 'text-rose-600'}`}>
                  {score === selectedTask.tasks.length ? `+₦${(selectedTask.stake || globalMinStake).toLocaleString()}` : `Stake Lost`}
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setGameState('SELECT')} variant="outline" className="flex-1 h-12 rounded-xl font-bold">Catalog</Button>
                <Button asChild className="flex-1 h-12 rounded-xl font-bold bg-primary text-white"><Link href="/dashboard/games/history?game=labeling">View History</Link></Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
