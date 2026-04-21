
"use client";

import { useEffect, useRef } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit, doc, updateDoc } from "firebase/firestore";

/**
 * NotificationListener listens for new Firestore notifications and triggers
 * native browser push notifications if permissions are granted.
 */
export function NotificationListener() {
  const { user } = useUser();
  const db = useFirestore();
  const lastProcessedId = useRef<string | null>(null);

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("read", "==", false),
      orderBy("createdAt", "desc"),
      limit(1)
    );
  }, [db, user]);

  const { data: notifications } = useCollection<any>(notificationsQuery);

  useEffect(() => {
    if (!notifications || notifications.length === 0 || !db) return;

    const latest = notifications[0];

    // Avoid double-processing the same notification
    if (latest.id === lastProcessedId.current) return;
    lastProcessedId.current = latest.id;

    // Trigger Browser Notification safely
    if (typeof window !== 'undefined' && "Notification" in window && Notification.permission === "granted") {
      try {
        const title = latest.title || "TaskHome Update";
        const options = {
          body: latest.message || "",
          icon: "/icon.png",
        };

        // Some browsers require showing notifications via ServiceWorker on mobile
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, options);
          }).catch(err => {
            console.warn("ServiceWorker notification failed:", err);
            // Fallback to standard Notification
            if (typeof Notification === 'function') {
              new Notification(title, options);
            }
          });
        } else if (typeof Notification === 'function') {
          new Notification(title, options);
        }
      } catch (e) {
        console.warn("Notification system error:", e);
      }
    }

    // Auto-mark as read after displaying
    updateDoc(doc(db, "notifications", latest.id), { read: true })
      .catch(err => console.error("Error marking notification as read:", err));
      
  }, [notifications, db]);

  return null;
}
