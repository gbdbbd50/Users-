
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * FloatingSupport provides a permanent quick-access button to the support page.
 * It features a WhatsApp-themed design without a close button to ensure users can always find help.
 */
export function FloatingSupport() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 animate-in slide-in-from-bottom-10 duration-500">
      <div className="relative group">
        {/* WhatsApp Link */}
        <Link
          href="/support"
          className="flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-[0_8px_30px_rgb(37,211,102,0.4)] hover:scale-110 active:scale-95 transition-all duration-300 relative overflow-hidden"
        >
          {/* Official WhatsApp SVG Path */}
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.411.001 12.048c0 2.123.554 4.197 1.607 6.037L0 24l6.105-1.602a11.834 11.834 0 005.937 1.598h.005c6.637 0 12.048-5.411 12.052-12.048a11.82 11.82 0 00-3.417-8.528z" />
          </svg>

          {/* Pulse Effect */}
          <span className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100 pointer-events-none" />
        </Link>

        {/* Tooltip Label */}
        <div className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-slate-800">
          Need help? Chat now
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-slate-900" />
        </div>
      </div>
    </div>
  );
}
