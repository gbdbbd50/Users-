"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCcw } from "lucide-react";
import { Button } from "./ui/button";

/**
 * OfflineGuard monitors the browser's connectivity status.
 * If offline, it displays a user-friendly error message with a reload button.
 */
export function OfflineGuard({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initial status check
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed inset-0 z-[10000] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
        <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-rose-500/10">
          <WifiOff className="w-12 h-12" />
        </div>
        <div className="max-w-md space-y-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
            sorry seems like your network isn't stable or offline. please check your internet connection and try again
          </h2>
          <Button 
            onClick={() => window.location.reload()} 
            className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-bold gap-3 shadow-xl shadow-primary/20 transition-transform active:scale-95"
          >
            <RefreshCcw className="w-5 h-5" /> Try Again
          </Button>
        </div>
        <div className="absolute bottom-8 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
          Connectivity Check Active
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
