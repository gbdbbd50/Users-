
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Circle, 
  ArrowLeft, 
  Loader2, 
  Trophy, 
  Zap, 
  ShieldAlert,
  History,
  RotateCcw
} from "lucide-react";
import { doc, updateDoc, increment, addDoc, collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

type Player = 'X' | 'O' | null;

export default function TicTacToePage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'RESULT'>('IDLE');
  const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  const settingsRef = useMemoFirebase(() => db ? doc(db, "settings", "global") : null, [db]);
  const { data: settings } = useDoc<any>(settingsRef);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!profileLoading && profile && profile.role !== 'EARNER') {
      router.push("/dashboard");
    }
  }, [user, authLoading, profile, profileLoading, router]);

  const stake = settings?.gamesConfig?.tictactoe?.minStake || 10;

  const calculateWinner = (squares: Player[]): Player | 'DRAW' | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (squares.every(s => s !== null)) return 'DRAW';
    return null;
  };

  // Minimax Algorithm for unbeatable AI
  const minimax = (squares: Player[], depth: number, isMaximizing: boolean): number => {
    const res = calculateWinner(squares);
    if (res === 'O') return 10 - depth; // AI Wins
    if (res === 'X') return depth - 10; // User Wins
    if (res === 'DRAW') return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = 'O';
          const score = minimax(squares, depth + 1, false);
          squares[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = 'X';
          const score = minimax(squares, depth + 1, true);
          squares[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const getBestMove = (squares: Player[]): number => {
    let bestScore = -Infinity;
    let move = -1;
    for (let i = 0; i < 9; i++) {
      if (squares[i] === null) {
        squares[i] = 'O';
        const score = minimax(squares, 0, false);
        squares[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  };

  const handleStartGame = async () => {
    if (!profile || profile.balance < stake) {
      toast({ variant: "destructive", title: "Insufficient Funds", description: `You need at least ₦${stake} to play.` });
      return;
    }
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setGameState('PLAYING');
    setWinner(null);
  };

  const handleClick = (i: number) => {
    if (board[i] || winner || gameState !== 'PLAYING') return;

    const newBoard = [...board];
    newBoard[i] = 'X';
    setBoard(newBoard);
    
    const gameWinner = calculateWinner(newBoard);
    if (gameWinner) {
      finalizeGame(newBoard, gameWinner);
      return;
    }

    // AI Move
    setIsXNext(false);
    setTimeout(() => {
      const aiMove = getBestMove(newBoard);
      if (aiMove !== -1) {
        newBoard[aiMove] = 'O';
        setBoard(newBoard);
        const nextWinner = calculateWinner(newBoard);
        if (nextWinner) {
          finalizeGame(newBoard, nextWinner);
        } else {
          setIsXNext(true);
        }
      }
    }, 500);
  };

  const finalizeGame = async (finalBoard: Player[], result: Player | 'DRAW') => {
    if (!db || !user) return;
    setIsSubmitting(true);
    setWinner(result);
    
    const win = result === 'X';
    const reward = win ? stake * 5 : 0; // Very high reward because winning is nearly impossible

    try {
      // Deduct stake and add reward if won
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(win ? (reward - stake) : -stake)
      });

      // Log activity
      await addDoc(collection(db, "game_sessions"), {
        userId: user.uid,
        userName: profile.displayName,
        gameType: 'tictactoe',
        stake: stake,
        reward: reward,
        win: win,
        result: result,
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
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2" disabled={isSubmitting}>
          <Link href="/dashboard/games"><ArrowLeft className="w-4 h-4" /> Back to Matrix</Link>
        </Button>

        {gameState === 'IDLE' && (
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900">
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <RotateCcw className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">X and O: Extreme</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                Can you beat the unbeatable? In this extreme mode, a draw counts as a loss. Only a direct win earns the 5x reward.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700 mb-8 flex justify-between items-center px-6">
                <span className="text-xs font-bold text-slate-400 uppercase">Stake Required</span>
                <span className="text-lg font-black text-primary">₦{stake}</span>
              </div>
              <Button onClick={handleStartGame} className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl font-bold text-lg shadow-lg">Start Match</Button>
            </div>
          </Card>
        )}

        {gameState === 'PLAYING' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <Badge className={isXNext ? "bg-blue-500" : "bg-rose-500"}>
                {isXNext ? "YOUR TURN (X)" : "AI IS THINKING (O)..."}
              </Badge>
              <Badge variant="outline" className="border-primary text-primary font-bold">₦{stake} at stake</Badge>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {board.map((square, i) => (
                <button
                  key={i}
                  onClick={() => handleClick(i)}
                  disabled={!!square || !isXNext || isSubmitting}
                  className="aspect-square bg-white dark:bg-slate-900 rounded-2xl shadow-md flex items-center justify-center transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-100"
                >
                  {square === 'X' && <X className="w-12 h-12 text-blue-500 animate-in zoom-in" strokeWidth={3} />}
                  {square === 'O' && <Circle className="w-10 h-10 text-rose-500 animate-in zoom-in" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'RESULT' && (
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900">
            <div className={`p-12 text-center text-white ${winner === 'X' ? 'bg-green-500' : 'bg-rose-500'}`}>
              <h2 className="text-4xl font-black mb-2">{winner === 'X' ? 'VICTORY!' : winner === 'DRAW' ? 'DRAW (LOSS)' : 'AI WINS'}</h2>
              <p className="text-white/80 font-bold uppercase tracking-widest text-xs">Extreme Difficulty Mode</p>
            </div>
            <CardContent className="p-10 space-y-6 text-center">
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Session Result</p>
                <p className={`text-3xl font-black ${winner === 'X' ? 'text-green-600' : 'text-rose-600'}`}>
                  {winner === 'X' ? `+₦${(stake * 5 - stake).toLocaleString()}` : `Stake Lost`}
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setGameState('IDLE')} variant="outline" className="flex-1 h-12 rounded-xl font-bold">Retry</Button>
                <Button asChild className="flex-1 h-12 rounded-xl font-bold bg-primary text-white"><Link href="/dashboard/games/history?game=tictactoe">History</Link></Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-5 rounded-[2rem] flex gap-4">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-800 dark:text-amber-200">Rule Awareness</p>
            <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed mt-0.5">
              In Extreme mode, the AI is mathematically perfect. Winning is near impossible. A draw is considered a failure to outperform the machine and costs the full stake.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
