"use client";

import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Hammer } from "lucide-react";

/**
 * MaintenanceBanner displays a sitewide notification when maintenance mode is active.
 */
export function MaintenanceBanner() {
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => db ? doc(db, "settings", "global") : null, [db]);
  const { data: settings } = useDoc<any>(settingsRef);

  if (!settings?.maintenanceMode) return null;

  return (
    <div className="bg-primary text-white py-2 px-4 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider z-[60] relative animate-in slide-in-from-top duration-500">
      <Hammer className="w-3.5 h-3.5" />
      <span>Notice: System maintenance is currently active. Some features may be restricted.</span>
    </div>
  );
}
