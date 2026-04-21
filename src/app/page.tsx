
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Zap, Shield, Users, Download, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";

export default function Home() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPopup, setShowInstallPopup] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show install popup only once per session on the homepage
      const hasDismissed = sessionStorage.getItem('install_popup_dismissed');
      if (!hasDismissed) {
        setShowInstallPopup(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPopup(false);
    }
  };

  const dismissPopup = () => {
    sessionStorage.setItem('install_popup_dismissed', 'true');
    setShowInstallPopup(false);
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-32 md:pb-40">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>
        
        <div className="container relative z-10 px-4 mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-6 animate-in fade-in zoom-in duration-1000">
            <Users className="w-4 h-4" />
            <span>Community-Powered Task Marketplace</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold text-primary tracking-tight mb-6 animate-in fade-in slide-in-from-top-8 duration-700">
            Turn Your Free Time <br /> Into <span className="text-secondary">Earnings</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            TASKHOME is the home to grow your social media presence and also earn income from it. get paid for content enagagment and lots more
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
            <Button asChild size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 shadow-lg hover:shadow-primary/20 transition-all">
              <Link href="/signup">
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="h-14 px-8 text-lg border-2 hover:bg-primary/5">
              <Link href="/login">My Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16 animate-in fade-in duration-1000">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-4">Why TaskHome?</h2>
            <p className="text-muted-foreground">We prioritize your success with transparent, human-verified results.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-muted/30 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-100">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Fast Payouts</h3>
              <p className="text-muted-foreground">No waiting weeks for your money. Once a task is verified and payout is requested, our team processes it promptly.</p>
            </div>
            
            <div className="p-8 rounded-2xl bg-muted/30 border border-border hover:border-secondary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Human Verification</h3>
              <p className="text-muted-foreground">Every task is reviewed by experienced moderators to ensure fairness and quality for both sides.</p>
            </div>
            
            <div className="p-8 rounded-2xl bg-muted/30 border border-border hover:border-green-500/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Safe & Secure</h3>
              <p className="text-muted-foreground">Robust account protection and secure payment processing keep your earnings and data safe.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-white text-center overflow-hidden">
        <div className="container px-4 mx-auto relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          </div>
          <h2 className="text-3xl md:text-5xl font-headline font-bold mb-6 animate-in slide-in-from-top-4 duration-700">Ready to start earning?</h2>
          <p className="text-primary-foreground/80 mb-10 max-w-xl mx-auto text-lg animate-in slide-in-from-bottom-4 duration-700">
            Join thousands of users who are making a difference and getting rewarded every day.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Button asChild size="lg" variant="secondary" className="h-14 px-10 text-lg shadow-xl hover:scale-105 transition-transform animate-in fade-in zoom-in duration-1000 delay-200">
              <Link href="/signup">Join Now</Link>
            </Button>
            
            {deferredPrompt && (
              <Button onClick={handleInstallClick} variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10 gap-2">
                <Download className="w-4 h-4" /> Install App
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* PWA Install Dialog */}
      <Dialog open={showInstallPopup} onOpenChange={setShowInstallPopup}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-primary p-8 text-center text-white relative">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold mb-2">Install TaskHome App</DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-sm">
              Add TaskHome to your home screen for faster access and a better earning experience.
            </DialogDescription>
          </div>
          <div className="p-8 space-y-4">
            <Button onClick={handleInstallClick} className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl font-bold text-lg shadow-lg gap-2">
              <Download className="w-5 h-5" /> Install Now
            </Button>
            <Button variant="ghost" onClick={dismissPopup} className="w-full h-10 text-slate-400 font-bold text-xs uppercase tracking-widest">
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
