
"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Megaphone, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { Badge } from "./ui/badge";

/**
 * AnnouncementPopup listens for active broadcasts and displays them based on user role.
 * 
 * Targeting Logic:
 * - ALL: Reaches every visitor, including guests and all registered roles.
 * - EARNER: Targeted specifically at users registered to perform tasks and earn.
 * - ADVERTISER: Targeted at users who fund tasks and manage campaigns.
 * - ADMIN: Targeted at site moderators and staff.
 * - DEVELOPER: Targeted at development accounts.
 * - GUEST: Targeted at users who are not yet signed in.
 */
export function AnnouncementPopup() {
  const { user } = useUser();
  const db = useFirestore();
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<any>(null);

  // Get user profile to determine role
  const profileRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile } = useDoc<any>(profileRef);

  // Fetch all active announcements (sort in memory to avoid index requirements)
  const announcementQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "announcements"),
      where("isActive", "==", true)
    );
  }, [db]);

  const { data: rawAnnouncements } = useCollection<any>(announcementQuery);

  const announcements = useMemo(() => {
    if (!rawAnnouncements) return [];
    return [...rawAnnouncements].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [rawAnnouncements]);

  useEffect(() => {
    if (!announcements || announcements.length === 0) return;

    const latest = announcements[0];
    const role = profile?.role || (user ? "EARNER" : "GUEST");

    // Check targeting logic: ALL or current role match
    const isTargeted = latest.targetRoles?.includes("ALL") || latest.targetRoles?.includes(role);
    
    if (isTargeted) {
      // Check if already dismissed in this session to avoid spamming the user
      const dismissedId = sessionStorage.getItem(`announcement_dismissed_${latest.id}`);
      if (dismissedId !== 'true') {
        setAnnouncement(latest);
        setOpen(true);
      }
    }
  }, [announcements, profile, user]);

  const handleDismiss = () => {
    if (announcement) {
      sessionStorage.setItem(`announcement_dismissed_${announcement.id}`, 'true');
    }
    setOpen(false);
  };

  if (!announcement) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl animate-in fade-in zoom-in duration-300">
        <button 
          onClick={handleDismiss} 
          className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
        >
          <X className="w-4 h-4" />
        </button>

        {announcement.imageUrl && (
          <div className="relative h-56 w-full bg-slate-100">
            <img 
              src={announcement.imageUrl} 
              alt="" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-6 flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
                <Megaphone className="w-5 h-5" />
              </div>
              <Badge className="bg-white/20 backdrop-blur-md text-white border-none uppercase text-[10px] font-black tracking-widest px-2">Official Broadcast</Badge>
            </div>
          </div>
        )}

        <div className="p-8 space-y-4">
          {!announcement.imageUrl && (
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Announcement</p>
                <DialogTitle className="text-xl font-bold text-slate-900">{announcement.title}</DialogTitle>
              </div>
            </div>
          )}
          
          {announcement.imageUrl && (
            <DialogTitle className="text-2xl font-bold text-slate-900">{announcement.title}</DialogTitle>
          )}

          <DialogDescription className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
            {announcement.message}
          </DialogDescription>

          <div className="flex flex-col gap-2 mt-4">
            {announcement.buttons?.map((btn: any, i: number) => (
              <Button key={i} asChild className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 gap-2">
                <Link href={btn.url} target={btn.url.startsWith('http') ? "_blank" : "_self"} onClick={handleDismiss}>
                  {btn.text}
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </Button>
            ))}
          </div>
          
          <Button variant="ghost" onClick={handleDismiss} className="w-full h-10 text-slate-400 font-bold text-xs uppercase tracking-widest">
            Close Message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
