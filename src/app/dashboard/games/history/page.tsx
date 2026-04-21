
"use client";

import { useEffect } from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  History, 
  Loader2, 
  Trophy, 
  Target, 
  Zap, 
  Dices,
  Clock
} from "lucide-react";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import { SafeDate } from "@/components/SafeDate";
import { Suspense } from "react";

function HistoryList() {
  const { user } = useUser();
  const db = useFirestore();
  const searchParams = useSearchParams();
  const gameFilter = searchParams.get('game');

  const historyQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    let q = query(
      collection(db, "game_sessions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    return q;
  }, [db, user]);

  const { data: rawHistory, loading } = useCollection<any>(historyQuery);

  const history = gameFilter 
    ? rawHistory?.filter(h => h.gameType === gameFilter) 
    : rawHistory;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  const getIcon = (type: string) => {
    switch(type) {
      case 'trivia': return Trophy;
      case 'predictor': return Target;
      case 'labeling': return Zap;
      case 'raffle': return Dices;
      default: return History;
    }
  };

  return (
    <div className="space-y-3">
      {history?.map((h: any) => {
        const Icon = getIcon(h.gameType);
        return (
          <Card key={h.id} className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${h.win ? 'text-green-600' : 'text-slate-400'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold capitalize">{h.gameType} Session</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <span className="text-[10px] text-slate-400 font-medium">
                      <SafeDate date={h.createdAt} />
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black ${h.win ? 'text-green-600' : 'text-slate-400'}`}>
                  {h.win ? `+₦${h.reward}` : `-₦${h.stake}`}
                </p>
                <Badge variant={h.win ? "default" : "outline"} className="text-[8px] h-4 px-1.5 uppercase font-black tracking-tighter">
                  {h.win ? 'Victory' : 'Lost'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {(!history || history.length === 0) && (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed">
          <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-bold">No sessions found</p>
          <Button asChild variant="link" className="mt-2 text-primary">
            <Link href="/dashboard/games">Go Play Now</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function GameHistoryPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    return user && db ? doc(db, "users", user.uid) : null;
  }, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!profileLoading && profile && profile.role !== 'EARNER') {
      router.push("/dashboard");
    }
  }, [user, authLoading, profile, profileLoading, router]);

  if (authLoading || profileLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors">
      <div className="container px-4 py-8 mx-auto max-w-lg">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/dashboard/games"><ArrowLeft className="w-4 h-4" /> Back to Matrix</Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-primary flex items-center gap-3">
            <History className="w-8 h-8" /> Session Log
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Audit trail of your skill game performance.</p>
        </div>

        <Suspense fallback={<Loader2 className="animate-spin mx-auto mt-20" />}>
          <HistoryList />
        </Suspense>
      </div>
    </div>
  );
}
