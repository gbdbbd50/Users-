'use client';

/**
 * Firebase configuration object.
 * Values are retrieved from environment variables.
 * Ensure these are set in your Firebase Console and local .env file.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

/**
 * reCAPTCHA Enterprise / V3 Site Key for App Check.
 * This is a public key used to identify your site to reCAPTCHA.
 */
export const recaptchaSiteKey = '6LcJY38sAAAAAHvMtVcxRwZ0tRJJg4BXBfik9ujJ';

/**
 * Payment Gateway Public Keys and API Identifiers
 */
export const paymentKeys = {
  paystack: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
  korapay: process.env.NEXT_PUBLIC_KORAPAY_PUBLIC_KEY || '',
  // Xixapay Configuration
  xixapay: {
    apiKey: '619360e1af12c45986feedd74d2ea5e67474f25d',
    secretKey: 'f7bc293e789946366f4bd11cfa9b55979f6281630b925e40e524bf70def9199503288046b65a888ebd17e50eb645516bf07e30e3aace9cb5371a8c73',
    businessId: '513efd11a6df765205e659742f4716cb089be63c'
  }
};
