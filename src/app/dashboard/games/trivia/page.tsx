
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  ArrowLeft, 
  Loader2, 
  Zap, 
  CheckCircle2, 
  XCircle,
  Timer,
  ShieldCheck,
  MessageCircle,
  Gamepad2
} from "lucide-react";
import { doc, updateDoc, increment, addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function TriviaPoolPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'SELECT' | 'IDLE' | 'PLAYING' | 'RESULT'>('SELECT');
  const [selectedPool, setSelectedPool] = useState<any>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userSessions, setUserSessions] = useState<Set<string>>(new Set());

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  const settingsRef = useMemoFirebase(() => db ? doc(db, "settings", "global") : null, [db]);
  const { data: settings } = useDoc<any>(settingsRef);

  const triviaQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "game_catalog"), where("type", "==", "trivia"), where("active", "==", true));
  }, [db]);

  const { data: pools, loading: poolsLoading } = useCollection<any>(triviaQuery);

  useEffect(() => {
    if (db && user) {
      const fetchSessions = async () => {
        const q = query(collection(db, "game_sessions"), where("userId", "==", user.uid), where("gameType", "==", "trivia"));
        const snap = await getDocs(q);
        const ids = new Set<string>();
        snap.forEach(doc => ids.add(doc.data().poolId));
        setUserSessions(ids);
      };
      fetchSessions();
    }
  }, [db, user]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!profileLoading && profile && profile.role !== 'EARNER') {
      router.push("/dashboard");
    }
  }, [user, authLoading, profile, profileLoading, router]);

  const globalMinStake = settings?.gamesConfig?.trivia?.minStake || 10;

  const handleStart = async (pool: any) => {
    if (userSessions.has(pool.id)) {
      toast({ variant: "destructive", title: "Already Played", description: "You can only participate in this pool once." });
      return;
    }

    const stake = pool.stake || globalMinStake;
    if (!profile || profile.balance < stake) {
      toast({ variant: "destructive", title: "Insufficient Funds", description: `You need at least ₦${stake} to play.` });
      return;
    }

    setSelectedPool(pool);
    setGameState('PLAYING');
    setCurrentQ(0);
    setScore(0);
  };

  const handleAnswer = async (index: number) => {
    const questions = selectedPool.questions;
    const isCorrect = index === questions[currentQ].c;
    if (isCorrect) setScore(s => s + 1);

    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      await finalizeGame(isCorrect ? score + 1 : score);
    }
  };

  const finalizeGame = async (finalScore: number) => {
    if (!db || !user || !selectedPool) return;
    setIsSubmitting(true);
    const stake = selectedPool.stake || globalMinStake;
    const questions = selectedPool.questions;
    
    // Win if scored 80% or more
    const winThreshold = Math.ceil(questions.length * 0.8);
    const win = finalScore >= winThreshold; 
    const multiplier = selectedPool.multiplier || 1.5;
    const reward = win ? stake * multiplier : 0;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(win ? (reward - stake) : -stake)
      });

      await addDoc(collection(db, "game_sessions"), {
        userId: user.uid,
        userName: profile.displayName,
        gameType: 'trivia',
        poolId: selectedPool.id,
        poolTitle: selectedPool.title,
        stake: stake,
        reward: reward,
        win: win,
        score: finalScore,
        maxScore: questions.length,
        createdAt: new Date().toISOString()
      });

      setUserSessions(prev => new Set(prev).add(selectedPool.id));
      setGameState('RESULT');
    } catch (e: any) {
      toast({ variant: "destructive", title: "Sync Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || profileLoading || poolsLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors">
      <div className="container px-4 py-8 mx-auto max-w-lg">
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2" disabled={gameState === 'PLAYING'}>
          <Link href="/dashboard/games"><ArrowLeft className="w-4 h-4" /> Back</Link>
        </Button>

        {gameState === 'SELECT' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h1 className="text-3xl font-black text-primary dark:text-white">Trivia Pools</h1>
              <p className="text-slate-500 text-sm mt-2">Select a challenge to multiply your stake.</p>
            </div>

            {pools && pools.length > 0 ? (
              <div className="grid gap-4">
                {pools.map((pool: any) => {
                  const played = userSessions.has(pool.id);
                  return (
                    <Card key={pool.id} className={`border-none shadow-md hover:shadow-xl transition-all rounded-3xl overflow-hidden cursor-pointer group ${played ? 'opacity-60' : ''}`} onClick={() => !played && handleStart(pool)}>
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl ${played ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'} flex items-center justify-center`}>
                            {played ? <CheckCircle2 className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200">{pool.title}</h3>
                            <p className="text-xs text-slate-400">{pool.questions?.length || 0} Questions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-primary">Stake: ₦{pool.stake || globalMinStake}</p>
                          <Badge variant={played ? "secondary" : "outline"} className="text-[8px] uppercase mt-1">{played ? "Completed" : "Active"}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-none shadow-sm rounded-[2.5rem] p-10 text-center bg-white dark:bg-slate-900 border-2 border-dashed">
                <Gamepad2 className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Active Pools</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                  We are currently refreshing our trivia catalog. Please check back later or follow our news channels for updates.
                </p>
                <Button asChild className="w-full h-12 rounded-xl font-bold gap-2">
                  <Link href="/support"><MessageCircle className="w-4 h-4" /> Support & News</Link>
                </Button>
              </Card>
            )}
          </div>
        )}

        {gameState === 'PLAYING' && selectedPool && (
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-slate-900">
            <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-center mb-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">Question {currentQ + 1} of {selectedPool.questions.length}</Badge>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Score: {score}</span>
                </div>
              </div>
              <Progress value={((currentQ + 1) / selectedPool.questions.length) * 100} className="h-1.5" />
              <CardTitle className="text-2xl font-bold mt-8 text-center leading-relaxed">
                {selectedPool.questions[currentQ].q}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-3">
              {selectedPool.questions[currentQ].a.map((opt: string, i: number) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  onClick={() => handleAnswer(i)}
                  className="w-full h-14 rounded-2xl justify-start px-6 text-sm font-bold border-2 hover:bg-primary hover:text-white hover:border-primary transition-all"
                >
                  <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-4 group-hover:bg-white/20 transition-colors">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {gameState === 'RESULT' && selectedPool && (
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900">
            <div className={`p-12 text-center text-white ${score >= Math.ceil(selectedPool.questions.length * 0.8) ? 'bg-green-500' : 'bg-rose-500'}`}>
              <h2 className="text-4xl font-black mb-2">{score >= Math.ceil(selectedPool.questions.length * 0.8) ? 'VICTORY!' : 'BETTER LUCK'}</h2>
              <p className="text-white/80 font-bold uppercase tracking-widest text-xs">Final Score: {score}/{selectedPool.questions.length}</p>
            </div>
            <CardContent className="p-10 space-y-6 text-center">
              {score >= Math.ceil(selectedPool.questions.length * 0.8) ? (
                <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-3xl border border-green-100 dark:border-green-900/30">
                  <p className="text-xs font-bold text-green-600 uppercase mb-1">Profit Earned</p>
                  <p className="text-3xl font-black text-green-700 dark:text-green-400">₦{((selectedPool.stake || globalMinStake) * (selectedPool.multiplier || 1.5) - (selectedPool.stake || globalMinStake)).toLocaleString()}</p>
                </div>
              ) : (
                <div className="p-6 bg-rose-50 dark:bg-rose-900/20 rounded-3xl border border-rose-100 dark:border-rose-900/30">
                  <p className="text-xs font-bold text-rose-600 uppercase mb-1">Stake Lost</p>
                  <p className="text-3xl font-black text-rose-700 dark:text-rose-400">₦{(selectedPool.stake || globalMinStake).toLocaleString()}</p>
                </div>
              )}
              <div className="flex gap-3">
                <Button onClick={() => setGameState('SELECT')} variant="outline" className="flex-1 h-12 rounded-xl font-bold">Pools</Button>
                <Button asChild className="flex-1 h-12 rounded-xl font-bold bg-primary text-white"><Link href="/dashboard/games/history?game=trivia">View History</Link></Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-5 rounded-[2rem] flex gap-4">
          <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-blue-800 dark:text-blue-200">Security Protocol</p>
            <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-relaxed mt-0.5">Game results are verified server-side. AI-assisted play or multi-accounting is strictly prohibited and results in a permanent ban.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
