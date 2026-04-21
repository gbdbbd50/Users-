
"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "./ui/button";

/**
 * InstallButton handles the PWA installation logic.
 * It listens for the 'beforeinstallprompt' event and displays a download icon.
 */
export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if the app is already running in standalone mode
    const checkStandalone = () => {
      if (
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true
      ) {
        setIsStandalone(true);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    });

    checkStandalone();

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Only show the button if the prompt is available and we aren't already installed
  if (isStandalone || !deferredPrompt) return null;

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleInstallClick}
      className="rounded-xl h-9 w-9 text-primary dark:text-primary-foreground hover:bg-primary/10 dark:hover:bg-primary/20 animate-pulse"
      title="Install TaskHome App"
    >
      <Download className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Install App</span>
    </Button>
  );
}
