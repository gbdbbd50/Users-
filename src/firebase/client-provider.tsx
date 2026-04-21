
'use client';

import React, { useMemo } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const { app, auth, firestore } = useMemo(() => initializeFirebase(), []);

  // If app is not initialized (e.g. missing API key), we still render the provider
  // but hooks like useAuth() will return null/undefined which the app handles.
  return (
    <FirebaseProvider app={app} auth={auth} firestore={firestore}>
      {children}
    </FirebaseProvider>
  );
}
