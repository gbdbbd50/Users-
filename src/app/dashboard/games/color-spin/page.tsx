
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Palette, 
  ArrowLeft, 
  Loader2, 
  Trophy, 
  Zap, 
  ShieldAlert,
  RotateCw,
  Coins
} from "lucide-react";
import { doc, updateDoc, increment, addDoc, collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

type ColorOption = {
  id: string;
  name: string;
  hex: string;
  multiplier: number;
};

const DEFAULT_COLORS: ColorOption[] = [
  { id: 'red', name: 'Ruby Red', hex: '#e11d48', multiplier: 3 },
  { id: 'blue', name: 'Azure Blue', hex: '#2563eb', multiplier: 3 },
  { id: 'green', name: 'Emerald', hex: '#16a34a', multiplier: 3 },
  { id: 'yellow', name: 'Gold', hex: '#ca8a04', multiplier: 3 },
];

export default function ColorSpinPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultColor, setResultColor] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
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

  // Merge default colors with multipliers from settings if available
  const colors = DEFAULT_COLORS.map(color => ({
    ...color,
    multiplier: settings?.gamesConfig?.colorspin?.multipliers?.[color.id] || color.multiplier
  }));

  const stake = settings?.gamesConfig?.colorspin?.minStake || 10;

  const handleSpin = async () => {
    if (isSpinning || isSubmitting) return;

    if (!selectedColor) {
      toast({ 
        variant: "destructive", 
        title: "Color Required", 
        description: "Please pick your lucky color before spinning the wheel." 
      });
      return;
    }

    if (!profile || profile.balance < stake) {
      toast({ variant: "destructive", title: "Insufficient Funds", description: `You need at least ₦${stake} to spin.` });
      return;
    }

    setIsSpinning(true);
    setResultColor(null);

    // Dynamic Extreme Difficulty: House retention check
    const isHouseWin = Math.random() < (settings?.gamesConfig?.colorspin?.houseEdge || 0.25); 
    const finalResult = isHouseWin ? 'black' : colors[Math.floor(Math.random() * colors.length)].id;

    // Animation logic
    const extraRotations = 5 + Math.floor(Math.random() * 5);
    const newRotation = rotation + (extraRotations * 360) + (Math.random() * 360);
    setRotation(newRotation);

    setTimeout(async () => {
      try {
        setResultColor(finalResult);
        await finalizeGame(finalResult);
      } catch (e) {
        console.error("Game finalization error:", e);
        setIsSpinning(false);
      }
    }, 3000);
  };

  const finalizeGame = async (result: string) => {
    if (!db || !user) return;
    setIsSubmitting(true);
    
    const win = selectedColor === result;
    const selectedColorData = colors.find(c => c.id === selectedColor);
    const reward = win ? stake * (selectedColorData?.multiplier || 3) : 0;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(win ? (reward - stake) : -stake)
      });

      await addDoc(collection(db, "game_sessions"), {
        userId: user.uid,
        userName: profile.displayName,
        gameType: 'colorspin',
        stake: stake,
        reward: reward,
        win: win,
        bet: selectedColor,
        result: result,
        createdAt: new Date().toISOString()
      });

      if (win) {
        toast({ title: "JACKPOT!", description: `The wheel landed on your color! You earned ₦${reward}.` });
      } else {
        const colorName = result === 'black' ? 'House Black' : (colors.find(c => c.id === result)?.name || result);
        toast({ 
          variant: "destructive", 
          title: "Stake Lost", 
          description: `Landed on ${colorName}.` 
        });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: e.message });
    } finally {
      setIsSubmitting(false);
      setIsSpinning(false);
    }
  };

  if (authLoading || profileLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors">
      <div className="container px-4 py-8 mx-auto max-w-lg">
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2" disabled={isSpinning}>
          <Link href="/dashboard/games"><ArrowLeft className="w-4 h-4" /> Back</Link>
        </Button>

        <div className="mb-8 text-center">
          <Palette className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-3xl font-black dark:text-white">Color Spin</h1>
          <p className="text-slate-500 text-sm mt-2">Pick a color, spin the wheel, multiply your earnings.</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 mb-8">
          <CardContent className="p-8 flex flex-col items-center">
            {/* The Wheel UI */}
            <div className="relative w-64 h-64 mb-12">
              <div 
                className="w-full h-full rounded-full border-8 border-slate-100 dark:border-slate-800 transition-transform"
                style={{ 
                  transform: `rotate(${rotation}deg)`,
                  transitionDuration: '3000ms',
                  transitionTimingFunction: 'cubic-bezier(0.15, 0, 0.15, 1)',
                  background: `conic-gradient(
                    #e11d48 0deg 72deg, 
                    #2563eb 72deg 144deg, 
                    #16a34a 144deg 216deg, 
                    #ca8a04 216deg 288deg,
                    #000000 288deg 360deg
                  )`
                }}
              />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 w-4 h-8 bg-slate-900 dark:bg-white z-10" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-full shadow-lg border-4 border-slate-50 dark:border-slate-800 flex items-center justify-center">
                  <RotateCw className={`w-6 h-6 text-indigo-600 ${isSpinning ? 'animate-spin' : ''}`} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              {colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(color.id)}
                  disabled={isSpinning || isSubmitting}
                  className={`h-16 rounded-2xl border-4 transition-all flex flex-col items-center justify-center ${
                    selectedColor === color.id 
                      ? 'border-indigo-600 scale-95 shadow-inner bg-indigo-50/50 dark:bg-indigo-900/20' 
                      : 'border-transparent bg-slate-50 dark:bg-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full mb-1" style={{ backgroundColor: color.hex }} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{color.name}</span>
                  <span className="text-[8px] font-bold text-slate-400">{color.multiplier}x Payout</span>
                </button>
              ))}
            </div>
          </CardContent>
          <CardFooter className="p-8 pt-0">
            <Button 
              onClick={handleSpin} 
              disabled={isSpinning || isSubmitting}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-500/20"
            >
              {isSpinning || isSubmitting ? <Loader2 className="animate-spin" /> : `Spin for ₦${stake}`}
            </Button>
          </CardFooter>
        </Card>

        <div className="bg-slate-900 text-white p-6 rounded-[2rem] border border-white/5 flex gap-4">
          <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-500">Extreme Risk Mode</p>
            <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
              The wheel includes a <strong>House Black</strong> slice. If the wheel lands on Black, all bets are lost. Payouts are high, but the house always maintains an edge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
