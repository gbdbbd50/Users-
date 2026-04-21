
'use client';

import { useFirebase } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

/**
 * A banner that warns the user if Firebase is not properly configured.
 * It checks the availability of the Firebase app instance.
 */
export function FirebaseStatusBanner() {
  const { app } = useFirebase();

  // If app is initialized, don't show the warning
  if (app) return null;

  return (
    <div className="container mx-auto px-4 pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <Alert variant="destructive" className="border-amber-500 bg-amber-50/50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 shadow-sm">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="font-bold">Backend Disconnected</AlertTitle>
        <AlertDescription className="text-sm">
          Firebase configuration is missing. Please add your <strong>NEXT_PUBLIC_FIREBASE_API_KEY</strong> and other credentials to your environment to enable login and task submissions.
        </AlertDescription>
      </Alert>
    </div>
  );
}
