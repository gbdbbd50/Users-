
"use client";

import { useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Gamepad2, 
  Trophy, 
  Target, 
  Zap, 
  History, 
  ArrowLeft, 
  Loader2, 
  Play,
  Dices,
  Star,
  Circle,
  Palette,
  Flag,
  Lock,
  ArrowUpCircle
} from "lucide-react";
import { doc } from "firebase/firestore";

export default function GamesHubPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    return user && db ? doc(db, "users", user.uid) : null;
  }, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  const settingsRef = useMemoFirebase(() => db ? doc(db, "settings", "global") : null, [db]);
  const { data: settings, loading: settingsLoading } = useDoc<any>(settingsRef);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!profileLoading && profile && profile.role !== 'EARNER' && profile.role !== 'DEVELOPER') {
      router.push("/dashboard");
    }
  }, [user, authLoading, profile, profileLoading, router]);

  const gamesConfig = settings?.gamesConfig || {
    trivia: { enabled: true, minStake: 10 },
    predictor: { enabled: true, minStake: 10 },
    labeling: { enabled: true, minStake: 10 },
    raffle: { enabled: true, minStake: 10 },
    tictactoe: { enabled: true, minStake: 10 },
    colorspin: { enabled: true, minStake: 10 },
    speedludo: { enabled: true, minStake: 10 }
  };

  const games = [
    {
      id: "trivia",
      title: "Trivia Pool",
      description: "Answer viral trend questions correctly to multiply your stake.",
      icon: Trophy,
      color: "bg-amber-100 text-amber-600",
      href: "/dashboard/games/trivia",
      enabled: gamesConfig.trivia.enabled,
      stake: gamesConfig.trivia.minStake
    },
    {
      id: "tictactoe",
      title: "X and O: Extreme",
      description: "Play against our unbeatable AI. Only a direct win earns a reward.",
      icon: Circle,
      color: "bg-rose-100 text-rose-600",
      href: "/dashboard/games/tic-tac-toe",
      enabled: gamesConfig.tictactoe?.enabled ?? true,
      stake: gamesConfig.tictactoe?.minStake ?? 10
    },
    {
      id: "colorspin",
      title: "Color Spin",
      description: "Bet on your lucky color. High-risk, high-multiplier wheel game.",
      icon: Palette,
      color: "bg-indigo-100 text-indigo-600",
      href: "/dashboard/games/color-spin",
      enabled: gamesConfig.colorspin?.enabled ?? true,
      stake: gamesConfig.colorspin?.minStake ?? 10
    },
    {
      id: "speedludo",
      title: "Speed Ludo",
      description: "A fast-paced race to the finish against our master AI.",
      icon: Flag,
      color: "bg-orange-100 text-orange-600",
      href: "/dashboard/games/speed-ludo",
      enabled: gamesConfig.speedludo?.enabled ?? true,
      stake: gamesConfig.speedludo?.minStake ?? 10
    },
    {
      id: "predictor",
      title: "Viral Predictor",
      description: "Stake on whether upcoming posts will hit their target metrics.",
      icon: Target,
      color: "bg-blue-100 text-blue-600",
      href: "/dashboard/games/predictor",
      enabled: gamesConfig.predictor.enabled,
      stake: gamesConfig.predictor.minStake
    },
    {
      id: "labeling",
      title: "Labeling Sprint",
      description: "High-speed data verification race. Precision meets rewards.",
      icon: Zap,
      color: "bg-purple-100 text-purple-600",
      href: "/dashboard/games/labeling",
      enabled: gamesConfig.labeling.enabled,
      stake: gamesConfig.labeling.minStake
    },
    {
      id: "raffle",
      title: "Raffle Challenge",
      description: "Invite verified users within time to win huge jackpot prizes.",
      icon: Dices,
      color: "bg-green-100 text-green-600",
      href: "/dashboard/games/raffle",
      enabled: gamesConfig.raffle.enabled,
      stake: gamesConfig.raffle.minStake
    }
  ];

  if (authLoading || settingsLoading || profileLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // Plan guard: check if current plan allows games
  const planAllowsGames = profile?.gamesEnabled !== false;

  if (!planAllowsGames && profile?.role !== 'DEVELOPER') {
    return (
      <div className="container px-4 py-8 mx-auto max-w-lg min-h-[80vh] flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-[3rem] flex items-center justify-center text-slate-400 mb-8 border-4 border-white shadow-xl">
          <Lock className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Games Restricted</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">Your current membership plan <strong>({profile?.planName})</strong> does not include access to the Game Matrix. Upgrade to a higher tier to multiply your earnings through skill games.</p>
        <Button asChild className="h-14 px-10 rounded-2xl bg-primary font-bold text-lg shadow-lg gap-2">
          <Link href="/upgrade"><ArrowUpCircle className="w-5 h-5" /> Upgrade Plan</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors">
      <div className="container px-4 py-8 mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">{profile?.gamePercentage || 100}% Payout Active</Badge>
            <Button asChild variant="outline" size="sm" className="gap-2 rounded-xl">
              <Link href="/dashboard/games/history"><History className="w-4 h-4" /> Global History</Link>
            </Button>
          </div>
        </div>

        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-primary text-white mb-4 shadow-xl shadow-primary/20">
            <Gamepad2 className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Game Matrix</h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">Skill-based challenges to multiply your earnings. Your plan grants you {profile?.gamePercentage || 100}% of every win.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game) => (
            <Card key={game.id} className={`border-none shadow-md rounded-[2rem] overflow-hidden group relative transition-all ${!game.enabled ? 'opacity-60 grayscale' : 'hover:shadow-xl hover:-translate-y-1'}`}>
              <CardContent className="p-0">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl ${game.color} flex items-center justify-center shadow-inner`}>
                      <game.icon className="w-7 h-7" />
                    </div>
                    <Link href={`/dashboard/games/history?game=${game.id}`} className="p-2 text-slate-300 hover:text-primary transition-colors">
                      <History className="w-5 h-5" />
                    </Link>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">{game.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{game.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Min Stake</span>
                      <span className="text-lg font-black text-primary">₦{game.stake}</span>
                    </div>
                    {game.enabled ? (
                      <Button asChild className="rounded-xl h-11 px-6 font-bold gap-2 bg-slate-900 group-hover:bg-primary transition-colors">
                        <Link href={game.href}>Play Now <Play className="w-3.5 h-3.5 fill-current" /></Link>
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="rounded-lg py-1 px-3">Locked by Admin</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">Earn more with Skill Games</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Winning outcomes are credited at <strong>{profile?.gamePercentage || 100}%</strong> of the standard pool reward based on your plan level.</p>
          </div>
          <Button variant="link" asChild className="text-primary font-bold">
            <Link href="/support">Need Help?</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
