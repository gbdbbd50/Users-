# TaskHome - Micro-Task Marketplace

TaskHome is a professional platform connecting Advertisers with Earners for social media and digital tasks. It is designed with security, transparency, and user growth at its core.

## 🛠 Technical Matrix

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe application logic |
| **Framework** | [Next.js 15](https://nextjs.org/) | App Router, Server Actions, & SSR |
| **UI Library** | [React 19](https://react.dev/) | Component-based interface |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utility-first responsive design |
| **Components** | [ShadCN UI](https://ui.shadcn.com/) | Accessible UI primitives (Radix UI) |
| **Database** | [Firestore](https://firebase.google.com/docs/firestore) | Real-time NoSQL data storage |
| **Auth** | [Firebase Auth](https://firebase.google.com/docs/auth) | Email, Google, and Phone verification |
| **Payments** | [Paystack API](https://paystack.com/) | Automated deposits and payouts |
| **Charts** | [Recharts](https://recharts.org/) | Data visualization for earnings |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, consistent iconography |

## 🚀 Professional Features
- **Reputation System**: 5-star rating and feedback for every task completed.
- **Visual Evidence**: Multi-modal proof submission including screenshot uploads.
- **Dispute Center**: Formal appeal process for rejected tasks with admin mediation.
- **Live Analytics**: Real-time earning trend charts for earners.
- **Financial Matrix**: Automated Paystack integration for deposits and activations.
- **Dark Mode**: System-wide high-contrast theme for professional use.
- **Developer Console**: Root-level control over global pricing, auth methods, and system maintenance.

## 📂 Project Architecture
- `src/app`: Next.js App Router (Pages and API logic)
- `src/components`: Reusable UI components and complex dashboard widgets
- `src/firebase`: Backend initialization and custom React hooks for data fetching
- `src/hooks`: Custom lifecycle and utility hooks
- `src/lib`: Utility functions and static data definitions

## 🚀 How to Export & Push to GitHub

To move your code from this editor to your GitHub account, follow these steps in your terminal:

### 1. Initialize Git & Commit
```bash
git init
git add .
git commit -m "Initial commit: TaskHome Professional Platform"
git branch -M main
```

### 2. Connect to GitHub
Create a new, empty repository on [GitHub](https://github.com/new), then copy the URL and run:
```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

### 3. Security & Deployment
- **Security**: The `.gitignore` file prevents your `.env` file from being uploaded to GitHub.
- **Environment Variables**: Ensure you copy all keys from your `.env` file to your hosting provider's (e.g., Vercel) dashboard.

© 2024 TaskHome. All rights reserved.
