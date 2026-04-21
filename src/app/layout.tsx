
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { FirebaseStatusBanner } from '@/components/FirebaseStatusBanner';
import { MaintenanceGuard } from '@/components/MaintenanceGuard';
import { MaintenanceBanner } from '@/components/MaintenanceBanner';
import { NotificationListener } from '@/components/NotificationListener';
import { FloatingSupport } from '@/components/FloatingSupport';
import { AnnouncementPopup } from '@/components/AnnouncementPopup';
import { OfflineGuard } from '@/components/OfflineGuard';
import { Twitter, Globe } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'TaskHome - Earn by Completing Simple Tasks',
  description: 'TaskHome connects users with small tasks for quick rewards. Secure, fast, and human-powered.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TaskHome',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  }
};

export const viewport: Viewport = {
  themeColor: '#001f3f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background text-foreground transition-colors duration-300">
        <FirebaseClientProvider>
          <OfflineGuard>
            <NotificationListener />
            <AnnouncementPopup />
            <MaintenanceBanner />
            <MaintenanceGuard>
              <div className="flex flex-col min-h-screen">
                <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b dark:border-slate-800">
                  <Navigation />
                </header>
                <FirebaseStatusBanner />
                <main className="flex-grow">
                  {children}
                </main>
                <FloatingSupport />
                <footer className="py-12 bg-white dark:bg-slate-950 border-t dark:border-slate-800">
                  <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-8">
                    <div className="flex items-center gap-6">
                      <Link 
                        href="https://chat.whatsapp.com/KG0U1mX9m8O9ZGSTbd8J3s" 
                        target="_blank" 
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#25D366] hover:bg-[#25D366]/5 transition-all"
                        title="WhatsApp Group"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.411.001 12.048c0 2.123.554 4.197 1.607 6.037L0 24l6.105-1.602a11.834 11.834 0 005.937 1.598h.005c6.637 0 12.048-5.411 12.052-12.048a11.82 11.82 0 00-3.417-8.528z"/>
                        </svg>
                      </Link>
                      <Link 
                        href="https://x.com/favour15563" 
                        target="_blank" 
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-black hover:bg-slate-100 transition-all"
                        title="Twitter / X"
                      >
                        <Twitter className="w-5 h-5" />
                      </Link>
                      <Link 
                        href="https://chisomstudio.vercel.app" 
                        target="_blank" 
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                        title="Website"
                      >
                        <Globe className="w-5 h-5" />
                      </Link>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">&copy; {new Date().getFullYear()} TaskHome Platform</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-black">Empowering Digital Growth</p>
                      <Link 
                        href="https://chisomstudio.vercel.app" 
                        target="_blank"
                        className="text-[9px] text-slate-400 hover:text-primary transition-colors mt-4 block font-bold"
                      >
                        Powered by chiboydatabase
                      </Link>
                    </div>
                  </div>
                </footer>
              </div>
            </MaintenanceGuard>
          </OfflineGuard>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
