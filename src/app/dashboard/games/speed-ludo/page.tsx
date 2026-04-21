
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Flag, 
  ArrowLeft, 
  Loader2, 
  Trophy, 
  Zap, 
  ShieldAlert,
  Dices,
  User,
  Bot
} from "lucide-react";
import { doc, updateDoc, increment, addDoc, collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function SpeedLudoPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'RESULT'>('IDLE');
  const [playerPos, setPlayerPos] = useState(0);
  const [aiPos, setAiPos] = useState(0);
  const [isPlayerTurn, setIsXNext] = useState(true);
  const [lastRoll, setLastRoll] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  const settingsRef = useMemoFirebase(() => db ? doc(db, "settings", "global") : null, [db]);
  const { data: settings } = useDoc<any>(settingsRef);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!profileLoading && profile && profile.role !== 'EARNER' && profile.role !== 'DEVELOPER') {
      router.push("/dashboard");
    }
  }, [user, authLoading, profile, profileLoading, router]);

  const stake = settings?.gamesConfig?.speedludo?.minStake || 10;
  const WIN_POS = 20;

  const handleStart = () => {
    if (!profile || profile.balance < stake) {
      toast({ variant: "destructive", title: "Insufficient Funds", description: `You need ₦${stake} to race.` });
      return;
    }
    setPlayerPos(0);
    setAiPos(0);
    setGameState('PLAYING');
    setIsXNext(true);
  };

  const rollDice = () => {
    if (isRolling || !isPlayerTurn) return;
    setIsRolling(true);
    
    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setLastRoll(roll);
      const newPos = Math.min(playerPos + roll, WIN_POS);
      setPlayerPos(newPos);
      setIsRolling(false);

      if (newPos === WIN_POS) {
        finalizeGame('PLAYER');
      } else {
        setIsXNext(false);
        setTimeout(aiTurn, 1000);
      }
    }, 600);
  };

  const aiTurn = () => {
    setIsRolling(true);
    
    setTimeout(() => {
      // "Extreme Luck" Algorithm for AI
      // If AI is behind, its chance of rolling high increases significantly
      let roll;
      const behind = aiPos < playerPos;
      const chance = Math.random();
      
      if (behind && chance < 0.4) {
        roll = 6; // 40% chance of 6 if behind
      } else if (behind && chance < 0.7) {
        roll = 5; // extra 30% chance of 5 if behind
      } else {
        roll = Math.floor(Math.random() * 6) + 1;
      }

      setLastRoll(roll);
      const newPos = Math.min(aiPos + roll, WIN_POS);
      setAiPos(newPos);
      setIsRolling(false);

      if (newPos === WIN_POS) {
        finalizeGame('AI');
      } else {
        setIsXNext(true);
      }
    }, 600);
  };

  const finalizeGame = async (winner: 'PLAYER' | 'AI') => {
    if (!db || !user) return;
    setIsSubmitting(true);
    
    const win = winner === 'PLAYER';
    const reward = win ? stake * 3 : 0;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(win ? (reward - stake) : -stake)
      });

      await addDoc(collection(db, "game_sessions"), {
        userId: user.uid,
        userName: profile.displayName,
        gameType: 'speedludo',
        stake: stake,
        reward: reward,
        win: win,
        createdAt: new Date().toISOString()
      });

      setGameState('RESULT');
    } catch (e: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || profileLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors">
      <div className="container px-4 py-8 mx-auto max-w-lg">
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2" disabled={gameState === 'PLAYING'}>
          <Link href="/dashboard/games"><ArrowLeft className="w-4 h-4" /> Back</Link>
        </Button>

        {gameState === 'IDLE' && (
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900">
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Flag className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-black dark:text-white mb-2">Speed Ludo</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                Race against the TaskHome Master. First to step 20 wins the pool. Be warned: the Master has uncanny luck.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 mb-8 flex justify-between items-center px-6">
                <span className="text-xs font-bold text-slate-400 uppercase">Race Stake</span>
                <span className="text-lg font-black text-primary">₦{stake}</span>
              </div>
              <Button onClick={handleStart} className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-lg shadow-lg">Enter Race</Button>
            </div>
          </Card>
        )}

        {gameState === 'PLAYING' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <Badge className={isPlayerTurn ? "bg-blue-500" : "bg-orange-500"}>
                {isPlayerTurn ? "YOUR TURN" : "MASTER IS ROLLING..."}
              </Badge>
              <div className="flex items-center gap-2">
                <Dices className={`w-6 h-6 text-slate-400 ${isRolling ? 'animate-bounce' : ''}`} />
                <span className="text-xl font-black">{lastRoll || '?'}</span>
              </div>
            </div>

            <Card className="border-none shadow-xl rounded-3xl bg-white dark:bg-slate-900 p-6 space-y-8">
              {/* AI Lane */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-orange-600 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Bot className="w-3 h-3" /> Master AI</span>
                  <span>{aiPos} / {WIN_POS}</span>
                </div>
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border dark:border-slate-700">
                  <div className="h-full bg-orange-500 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{ width: `${(aiPos/WIN_POS)*100}%` }} />
                </div>
              </div>

              {/* Player Lane */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> You (Earner)</span>
                  <span>{playerPos} / {WIN_POS}</span>
                </div>
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border dark:border-slate-700">
                  <div className="h-full bg-blue-500 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${(playerPos/WIN_POS)*100}%` }} />
                </div>
              </div>

              <Button 
                onClick={rollDice} 
                disabled={!isPlayerTurn || isRolling}
                className="w-full h-20 bg-slate-900 dark:bg-slate-800 hover:bg-black rounded-2xl font-black text-2xl gap-4"
              >
                <Dices className="w-8 h-8" /> ROLL DICE
              </Button>
            </Card>
          </div>
        )}

        {gameState === 'RESULT' && (
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900">
            <div className={`p-12 text-center text-white ${playerPos >= WIN_POS ? 'bg-green-500' : 'bg-rose-500'}`}>
              <h2 className="text-4xl font-black mb-2">{playerPos >= WIN_POS ? 'VICTORY!' : 'AI WINS'}</h2>
              <p className="text-white/80 font-bold uppercase tracking-widest text-xs">Speed Race Finalized</p>
            </div>
            <CardContent className="p-10 space-y-6 text-center">
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Session Result</p>
                <p className={`text-3xl font-black ${playerPos >= WIN_POS ? 'text-green-600' : 'text-rose-600'}`}>
                  {playerPos >= WIN_POS ? `+₦${(stake * 3 - stake).toLocaleString()}` : `Stake Lost`}
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setGameState('IDLE')} variant="outline" className="flex-1 h-12 rounded-xl font-bold">Retry</Button>
                <Button asChild className="flex-1 h-12 rounded-xl font-bold bg-primary text-white"><Link href="/dashboard/games/history?game=speedludo">History</Link></Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-5 rounded-[2rem] flex gap-4">
          <ShieldAlert className="w-6 h-6 text-blue-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-blue-800 dark:text-blue-200">Dynamic Difficulty</p>
            <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-relaxed mt-0.5">
              The AI calculates player trajectory. If you are close to winning, the AI utilizes a "Catch-Up" algorithm to increase its dice roll probability. This ensures high house retention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
