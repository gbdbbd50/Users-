# TaskHome - Micro-Task Marketplace

TaskHome is a professional platform connecting Advertisers with Earners for social media and digital tasks.

## 🚀 Production Deployment Checklist

To go live, follow these steps:

### 1. Firebase Setup
*   **Project**: Create a new project in the [Firebase Console](https://console.firebase.google.com/).
*   **Auth**: Enable the **Email/Password** provider.
*   **Firestore**: Create a database. Start in "Production Mode".
*   **Configuration**: Copy your Web App config (API Key, Project ID, etc.) into your environment variables.

### 2. Xixapay Integration Guide (Virtual Accounts)
To make Xixapay work perfectly, you must complete these 3 steps in your [Xixapay Dashboard](https://dashboard.xixapay.com):

1.  **Switch to Live Mode**: Ensure your account is verified (KYC) and toggled to "Live".
2.  **Configure Webhooks**: 
    *   Set your Webhook URL to: `https://YOUR_DOMAIN.com/api/webhooks/xixapay`
    *   This allows the system to automatically credit user wallets when they pay.
3.  **IP Whitelisting**:
    *   Find the "Security" or "API Settings" tab.
    *   **Recommended**: Disable IP Whitelisting if possible for development.
    *   **Production**: If using Vercel, you can find their outbound IP ranges in the Vercel documentation, though it is usually preferred to disable this check if your token is kept secure on the server (as it is in this app).

### 3. Paystack Integration
*   **API Keys**: Add `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` to your environment variables.
*   **Secret Key**: Add `PAYSTACK_SECRET_KEY` to your server-side environment variables.

### 4. Hosting (Vercel Recommended)
1.  Push your code to a private GitHub repository.
2.  Import the repository into **Vercel**.
3.  **CRITICAL**: Add all keys from your `.env` file to the **Environment Variables** section in the Vercel Dashboard.

---

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database/Auth**: Firebase (Firestore & Auth)
- **Styling**: Tailwind CSS + ShadCN UI
- **Payments**: Paystack & Xixapay

## 🔒 Security Note
Your `.env` file contains private API keys. The `.gitignore` file included in this project is configured to **not** upload the `.env` file to GitHub. You will need to manually create these environment variables on your hosting provider dashboard.

© 2024 TaskHome. All rights reserved.
