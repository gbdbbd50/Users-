
"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * BrandedLoader provides a professional splash screen/preloader for the application.
 * It features the "CD" brand mark, a welcome message, and synchronized animations.
 */
export function BrandedLoader({ fullScreen = true, welcome = true }: { fullScreen?: boolean, welcome?: boolean }) {
  return (
    <div className={cn(
        "flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors duration-500",
        fullScreen ? "fixed inset-0 z-[9999]" : "min-h-[40vh] w-full py-12"
    )}>
        <div className="relative mb-8">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            
            {/* Branded Icon */}
            <div className="relative bg-primary text-white w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl font-black tracking-tighter shadow-2xl shadow-primary/30 animate-bounce">
                CD
            </div>
            
            {/* Decorative Stars */}
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-pulse" />
        </div>

        <div className="text-center space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {welcome && (
                <h2 className="text-2xl font-black text-primary dark:text-white tracking-tight">
                    Welcome to <span className="text-slate-900 dark:text-slate-100">TaskHome</span>
                </h2>
            )}
            
            <div className="flex flex-col items-center gap-3">
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-duration:1s] [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-duration:1s] [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-duration:1s]" />
                </div>
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] ml-1">
                    Synchronizing Matrix
                </span>
            </div>
        </div>
    </div>
  );
}
