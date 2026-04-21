
"use client";

import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Hammer } from "lucide-react";
import { usePathname } from "next/navigation";
import { BrandedLoader } from "./BrandedLoader";

/**
 * MaintenanceGuard protects internal app sections during maintenance.
 * Homepage and Auth pages are allowed, but Dashboards are restricted to Developers.
 */
export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const db = useFirestore();
  const { user } = useUser();
  const pathname = usePathname();

  const settingsRef = useMemoFirebase(() => db ? doc(db, "settings", "global") : null, [db]);
  const { data: settings, loading: settingsLoading } = useDoc<any>(settingsRef);

  const profileRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(profileRef);

  // Allow access to public/auth pages during maintenance
  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password";

  if (settingsLoading || (user && profileLoading)) {
    return <BrandedLoader />;
  }

  const isMaintenanceActive = settings?.maintenanceMode === true;
  
  // If maintenance is OFF, allow access immediately
  if (!isMaintenanceActive) return <>{children}</>;

  // If maintenance is ON and it's a public page, allow access
  if (isPublicPage) return <>{children}</>;

  const isDeveloper = profile?.role === 'DEVELOPER';

  // If maintenance is active and user is NOT a developer on a restricted page
  if (isMaintenanceActive && !isDeveloper) {
    return (
      <div className="fixed inset-0 bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center z-[9999]">
        <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mb-6 shadow-2xl animate-bounce">
          <Hammer className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-4 tracking-tight">Access Restricted</h1>
        <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
          TaskHome is currently undergoing scheduled maintenance. Internal dashboards are restricted to developers during this time.
        </p>
        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-pulse w-full" />
        </div>
        <p className="mt-12 text-[10px] uppercase font-bold text-slate-600 tracking-widest">
          Expected Return: Under 30 Minutes
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
