"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  Dices, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  Ticket,
  Users,
  Trophy,
  History,
  MessageCircle,
  Stars,
  Timer,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { doc, updateDoc, increment, addDoc, collection, query, where, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { SafeDate } from "@/components/SafeDate";

export default function RafflePage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'SELECT' | 'DETAIL' | 'ACTIVE'>('SELECT');
  const [selectedRaffle, setSelectedRaffle] = useState<any>(null);
  const [isBuying, setIsBuying] = useState(false);

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  const raffleQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "game_catalog"), where("type", "==", "raffle"), where("active", "==", true));
  }, [db]);

  const { data: raffles, loading: rafflesLoading } = useCollection<any>(raffleQuery);

  // Check for user's active raffle entry
  const userEntryQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "game_sessions"), 
      where("userId", "==", user.uid), 
      where("gameType", "==", "raffle"),
      where("status", "==", "ACTIVE")
    );
  }, [db, user]);

  const { data: activeEntries } = useCollection<any>(userEntryQuery);
  const currentActiveEntry = activeEntries?.[0];

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!profileLoading && profile && profile.role !== 'EARNER') {
      router.push("/dashboard");
    }
  }, [user, authLoading, profile, profileLoading, router]);

  const handleJoin = async () => {
    if (!db || !user || !profile || !selectedRaffle) return;
    
    if (currentActiveEntry) {
      toast({ variant: "destructive", title: "Challenge in Progress", description: "You already have an active raffle challenge." });
      return;
    }

    const fee = selectedRaffle.stake || 0;
    if (profile.balance < fee) {
      toast({ variant: "destructive", title: "Insufficient Funds", description: "You need more balance to join this raffle." });
      return;
    }

    setIsBuying(true);
    try {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + (selectedRaffle.durationDays || 7));

      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(-fee)
      });

      await addDoc(collection(db, "game_sessions"), {
        userId: user.uid,
        userName: profile.displayName,
        gameType: 'raffle',
        catalogId: selectedRaffle.id,
        raffleTitle: selectedRaffle.title,
        stake: fee,
        reward: selectedRaffle.reward,
        referralTarget: selectedRaffle.referralTarget,
        startReferralCount: profile.verifiedReferralCount || 0,
        status: 'ACTIVE',
        expiryAt: expiry.toISOString(),
        createdAt: new Date().toISOString()
      });

      toast({ title: "Challenge Started!", description: "Invites earned from now will count towards your goal." });
      setGameState('ACTIVE');
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsBuying(false);
    }
  };

  const claimReward = async () => {
    if (!db || !user || !currentActiveEntry) return;
    setIsBuying(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(currentActiveEntry.reward)
      });
      await updateDoc(doc(db, "game_sessions", currentActiveEntry.id), {
        status: 'COMPLETED',
        win: true,
        claimedAt: new Date().toISOString()
      });
      toast({ title: "Jackpot Claimed!", description: `₦${currentActiveEntry.reward} added to your wallet.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Claim failed" });
    } finally {
      setIsBuying(false);
    }
  };

  if (authLoading || profileLoading || rafflesLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors">
      <div className="container px-4 py-8 mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/dashboard/games"><ArrowLeft className="w-4 h-4" /> Matrix</Link>
          </Button>
          <Link href="/dashboard/games/history?game=raffle" className="text-slate-400 hover:text-primary transition-colors">
            <History className="w-5 h-5" />
          </Link>
        </div>

        {currentActiveEntry ? (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Timer className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">Active Challenge</h1>
              <p className="text-slate-500 text-sm mt-2">{currentActiveEntry.raffleTitle}</p>
            </div>

            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Progress</p>
                    <h3 className="text-3xl font-black">
                      {Math.max(0, (profile.verifiedReferralCount || 0) - currentActiveEntry.startReferralCount)} / {currentActiveEntry.referralTarget}
                    </h3>
                  </div>
                  <Badge className="bg-primary mb-1">₦{currentActiveEntry.reward.toLocaleString()} Prize</Badge>
                </div>
                <Progress value={Math.min(100, (((profile.verifiedReferralCount || 0) - currentActiveEntry.startReferralCount) / currentActiveEntry.referralTarget) * 100)} className="h-3 bg-white/10" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-[9px] uppercase font-bold text-slate-500">Expires</p>
                  <p className="text-xs font-bold truncate"><SafeDate date={currentActiveEntry.expiryAt} /></p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-[9px] uppercase font-bold text-slate-500">Starting Count</p>
                  <p className="text-xs font-bold">{currentActiveEntry.startReferralCount} verified</p>
                </div>
              </div>

              {(profile.verifiedReferralCount || 0) - currentActiveEntry.startReferralCount >= currentActiveEntry.referralTarget ? (
                <Button onClick={claimReward} disabled={isBuying} className="w-full h-14 bg-green-600 hover:bg-green-700 rounded-2xl font-black text-lg animate-bounce">
                  {isBuying ? <Loader2 className="animate-spin" /> : "CLAIM ₦" + currentActiveEntry.reward}
                </Button>
              ) : (
                <Button asChild className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl font-black text-lg">
                  <Link href="/referrals">Invite More People <ArrowRight className="ml-2 w-5 h-5" /></Link>
                </Button>
              )}
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Stars className="w-12 h-12 text-primary mx-auto mb-4" />
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">Raffle Challenges</h1>
              <p className="text-slate-500 text-sm mt-2">Win huge jackpots by growing your network within time.</p>
            </div>

            {raffles && raffles.length > 0 ? (
              <div className="grid gap-4">
                {raffles.map((r: any) => (
                  <Card key={r.id} className="border-none shadow-md hover:shadow-xl transition-all rounded-3xl overflow-hidden cursor-pointer bg-white dark:bg-slate-900 border border-slate-100" onClick={() => { setSelectedRaffle(r); setGameState('DETAIL'); }}>
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                          <Ticket className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold dark:text-white">{r.title}</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Reward: ₦{r.reward?.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-primary">₦{r.stake || 0} Fee</p>
                        <Badge className="bg-primary/10 text-primary border-none text-[8px] uppercase mt-1">Start</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-none shadow-sm rounded-[2.5rem] p-10 text-center bg-white dark:bg-slate-900 border-2 border-dashed">
                <Ticket className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Active Raffles</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">Check back later for new jackpot challenges.</p>
                <Button asChild className="w-full h-12 rounded-xl font-bold gap-2">
                  <Link href="/support"><MessageCircle className="w-4 h-4" /> Support & News</Link>
                </Button>
              </Card>
            )}
          </div>
        )}

        {gameState === 'DETAIL' && selectedRaffle && !currentActiveEntry && (
          <Dialog open={true} onOpenChange={() => setGameState('SELECT')}>
            <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
              <div className="bg-primary p-8 text-center text-white relative">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <DialogTitle className="text-2xl font-bold mb-2">Join Challenge</DialogTitle>
                <DialogDescription className="text-primary-foreground/80 text-sm">
                  Entry Fee: ₦{selectedRaffle.stake || 0}
                </DialogDescription>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-500 shrink-0" />
                    <p className="text-sm font-medium">Invite <strong>{selectedRaffle.referralTarget}</strong> verified users</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Timer className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-sm font-medium">Complete within <strong>{selectedRaffle.durationDays}</strong> days</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <p className="text-sm font-medium">Win <strong>₦{selectedRaffle.reward?.toLocaleString()}</strong> instantly</p>
                  </div>
                </div>
                <Button onClick={handleJoin} disabled={isBuying} className="w-full h-12 rounded-xl bg-primary font-bold shadow-lg shadow-primary/20">
                  {isBuying ? <Loader2 className="animate-spin" /> : "Pay Fee & Start"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
