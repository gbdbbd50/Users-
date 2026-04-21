'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { firebaseConfig, recaptchaSiteKey } from './config';

/**
 * Initializes Firebase services safely.
 * Optimized for cloud workstation environments to prevent connection drops.
 */
export function initializeFirebase() {
  const hasConfig = firebaseConfig.apiKey && firebaseConfig.apiKey !== '';
  
  if (!hasConfig) {
    console.warn("Firebase configuration is missing or invalid. Please check your environment variables.");
    return { app: null as any, auth: null as any, firestore: null as any };
  }

  // Handle singleton initialization
  const isNewApp = getApps().length === 0;
  const app = isNewApp ? initializeApp(firebaseConfig) : getApp();

  // App Check Initialization (Only on the client)
  if (typeof window !== 'undefined' && isNewApp && recaptchaSiteKey) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (e) {
      console.warn("App Check failed to initialize:", e);
    }
  }

  const auth = getAuth(app);
  
  // Use initializeFirestore with forced long polling to bypass WebSocket restrictions in cloud proxies
  let firestore;
  try {
    firestore = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch (e) {
    // If already initialized, just get the existing instance
    firestore = getFirestore(app);
  }
  
  return { app, auth, firestore };
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/use-memo-firebase';
