
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  ArrowLeft, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  ShieldCheck,
  Zap,
  Clock,
  MessageCircle,
  Dices,
  CheckCircle2
} from "lucide-react";
import { doc, updateDoc, increment, addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function PredictorPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [userPredictions, setUserPredictions] = useState<Set<string>>(new Set());

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  const settingsRef = useMemoFirebase(() => db ? doc(db, "settings", "global") : null, [db]);
  const { data: settings } = useDoc<any>(settingsRef);

  const predictorQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "game_catalog"), where("type", "==", "predictor"), where("active", "==", true));
  }, [db]);

  const { data: challenges, loading: challengesLoading } = useCollection<any>(predictorQuery);

  useEffect(() => {
    if (db && user) {
      const fetchPredictions = async () => {
        const q = query(collection(db, "game_sessions"), where("userId", "==", user.uid), where("gameType", "==", "predictor"));
        const snap = await getDocs(q);
        const ids = new Set<string>();
        snap.forEach(doc => ids.add(doc.data().challengeId));
        setUserPredictions(ids);
      };
      fetchPredictions();
    }
  }, [db, user]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!profileLoading && profile && profile.role !== 'EARNER') {
      router.push("/dashboard");
    }
  }, [user, authLoading, profile, profileLoading, router]);

  const globalMinStake = settings?.gamesConfig?.predictor?.minStake || 10;

  const handlePredict = async (challenge: any, prediction: 'YES' | 'NO') => {
    if (userPredictions.has(challenge.id)) {
      toast({ variant: "destructive", title: "Already Predicted", description: "You can only predict once for this event." });
      return;
    }

    const stake = challenge.stake || globalMinStake;
    if (!db || !user || !profile || profile.balance < stake) {
      toast({ variant: "destructive", title: "Insufficient Funds", description: "You need more balance to stake." });
      return;
    }

    setIsSubmitting(true);
    // Simulation: In production, result would be verified against social API or manual entry
    const win = Math.random() > 0.5;
    const reward = win ? Math.floor(stake * challenge.odds) : 0;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(win ? (reward - stake) : -stake)
      });

      await addDoc(collection(db, "game_sessions"), {
        userId: user.uid,
        userName: profile.displayName,
        gameType: 'predictor',
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        stake: stake,
        reward: reward,
        win: win,
        prediction: prediction,
        createdAt: new Date().toISOString()
      });

      setUserPredictions(prev => new Set(prev).add(challenge.id));
      toast({
        title: win ? "PREDICTION CORRECT!" : "PREDICTION FAILED",
        description: win ? `You earned ₦${reward}.` : `Better luck next time!`,
        variant: win ? "default" : "destructive"
      });
      setSelectedChallenge(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || profileLoading || challengesLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors">
      <div className="container px-4 py-8 mx-auto max-w-lg">
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2" disabled={isSubmitting}>
          <Link href="/dashboard/games"><ArrowLeft className="w-4 h-4" /> Back</Link>
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Viral Predictor</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time outcome staking. Pick your side.</p>
        </div>

        <div className="space-y-4">
          {challenges && challenges.length > 0 ? (
            challenges.map((c: any) => {
              const played = userPredictions.has(c.id);
              return (
                <Card key={c.id} className={`border-none shadow-md rounded-3xl overflow-hidden transition-all ${selectedChallenge?.id === c.id ? 'ring-2 ring-primary' : ''} ${played ? 'opacity-60' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Badge className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-none mb-2">{c.odds}x Payout</Badge>
                        <h3 className="font-bold text-lg dark:text-slate-200">{c.title}</h3>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                        {played ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 italic">"{c.description}"</p>
                    
                    {played ? (
                      <Button disabled className="w-full h-12 rounded-xl bg-slate-100 text-slate-400 font-bold border">
                        Already Predicted
                      </Button>
                    ) : selectedChallenge?.id === c.id ? (
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => handlePredict(c, 'YES')} 
                          disabled={isSubmitting}
                          className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 font-black gap-2"
                        >
                          <TrendingUp className="w-4 h-4" /> YES
                        </Button>
                        <Button 
                          onClick={() => handlePredict(c, 'NO')} 
                          disabled={isSubmitting}
                          className="flex-1 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 font-black gap-2"
                        >
                          <TrendingDown className="w-4 h-4" /> NO
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => setSelectedChallenge(c)} 
                        className="w-full h-12 rounded-xl bg-slate-900 dark:bg-slate-800 font-bold"
                      >
                        Stake ₦{c.stake || globalMinStake}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border-none shadow-sm rounded-[2.5rem] p-10 text-center bg-white dark:bg-slate-900 border-2 border-dashed">
              <Dices className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Active Events</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                Currently, there are no social events available for prediction. Follow our news groups for upcoming viral events.
              </p>
              <Button asChild className="w-full h-12 rounded-xl font-bold gap-2">
                <Link href="/support"><MessageCircle className="w-4 h-4" /> Support & News</Link>
              </Button>
            </Card>
          )}
        </div>

        <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-5 rounded-[2rem] flex gap-4">
          <Zap className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-800 dark:text-amber-200">Dynamic Multipliers</p>
            <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed mt-0.5">Odds are calculated based on current social sentiment and historical data. Multipliers lock in at the moment of staking.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
