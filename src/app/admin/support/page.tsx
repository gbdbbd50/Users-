
"use client";

import { useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  MessageSquare, 
  Loader2, 
  User, 
  ChevronRight,
  Clock,
  Inbox
} from "lucide-react";
import { collection, query, orderBy } from "firebase/firestore";
import { SafeDate } from "@/components/SafeDate";

export default function AdminSupportInbox() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const sessionsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "support_sessions"), orderBy("lastMessageAt", "desc"));
  }, [db]);

  const { data: sessions, loading: sessionsLoading } = useCollection<any>(sessionsQuery);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors">
      <div className="container px-4 py-8 mx-auto max-w-2xl">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4" /> Admin Hub
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary dark:text-primary-foreground flex items-center gap-3">
            <MessageSquare className="w-8 h-8" /> Support Inbox
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Manage real-time communication with members.</p>
        </div>

        <div className="space-y-3">
          {sessions?.map((session: any) => (
            <Link key={session.id} href={`/admin/support/${session.userId}`}>
              <Card className={`border-none shadow-md hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all cursor-pointer rounded-2xl overflow-hidden group ${session.unreadByAdmin ? 'ring-2 ring-primary/20 bg-white dark:bg-slate-900' : 'bg-white/80 dark:bg-slate-900/80 opacity-90'}`}>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <User className={`w-6 h-6 ${session.unreadByAdmin ? 'text-primary' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{session.userName || "Unknown Member"}</p>
                      {session.unreadByAdmin && (
                        <Badge className="bg-primary text-white text-[8px] font-black uppercase tracking-tighter h-4 px-1.5">New</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-relaxed">
                      {session.lastMessage}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3 h-3 text-slate-300" />
                      <span className="text-[10px] text-slate-400 font-medium">
                        <SafeDate date={session.lastMessageAt} />
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}

          {(!sessions || sessions.length === 0) && (
            <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed dark:border-slate-800">
              <Inbox className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">No active support chats</p>
              <p className="text-xs text-slate-300 mt-1 px-8">When users send messages through the Online Chat, they will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
