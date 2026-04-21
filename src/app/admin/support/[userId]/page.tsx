
"use client";

import { use, useState, useEffect, useRef } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  User, 
  ShieldCheck,
  Headset,
  CheckCircle2,
  Mail
} from "lucide-react";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, limit, updateDoc } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { SafeDate } from "@/components/SafeDate";

export default function AdminChatRoom({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const targetUserRef = useMemoFirebase(() => db ? doc(db, "users", userId) : null, [db, userId]);
  const { data: targetUser } = useDoc<any>(targetUserRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return query(
      collection(db, "support_chats", userId, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );
  }, [db, userId]);

  const { data: chatMessages, loading: messagesLoading } = useCollection<any>(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (db && userId) {
      // Mark session as read when admin enters the room
      updateDoc(doc(db, "support_sessions", userId), { unreadByAdmin: false });
    }
  }, [db, userId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !message.trim() || isSending) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, "support_chats", userId, "messages"), {
        text: message,
        senderId: user.uid,
        senderName: "TaskHome Support",
        isAdmin: true,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "support_sessions", userId), {
        lastMessage: message,
        lastMessageAt: serverTimestamp(),
        unreadByAdmin: false
      });

      setMessage("");
    } catch (e) {
      console.error("Admin chat error:", e);
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading || messagesLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-12">
      <div className="container px-4 py-8 mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/admin/support">
              <ArrowLeft className="w-4 h-4" /> Back to Inbox
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-xl text-lg font-black tracking-tighter">CD</span>
            <span className="text-xl font-bold text-primary dark:text-white">Moderator Console</span>
          </div>
        </div>

        <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden flex flex-col h-[700px] bg-white dark:bg-slate-900">
          <CardHeader className="bg-slate-900 text-white p-6 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {targetUser?.displayName || "Member"}
                    {targetUser?.status === 'VERIFIED' && <ShieldCheck className="w-4 h-4 text-primary" />}
                  </CardTitle>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-1">
                      <Mail className="w-2.5 h-2.5" /> {targetUser?.email || "No email linked"}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">ID: {userId.slice(-8)}</p>
                  </div>
                </div>
              </div>
              <Badge className="bg-primary text-white border-none text-[9px] font-bold uppercase tracking-widest">
                Support Agent Mode
              </Badge>
            </div>
          </CardHeader>

          <CardContent 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/20 scrollbar-hide"
          >
            {chatMessages?.map((msg: any) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.isAdmin ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.isAdmin 
                    ? 'bg-slate-800 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border dark:border-slate-700'
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase px-1">
                  {msg.isAdmin ? 'You' : (targetUser?.displayName || 'Member')} • <SafeDate date={msg.createdAt} format="time" />
                </p>
              </div>
            ))}
          </CardContent>

          <CardFooter className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800 shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
              <Input 
                placeholder="Type response to member..." 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none shadow-inner"
                disabled={isSending}
              />
              <Button 
                type="submit" 
                disabled={!message.trim() || isSending}
                className="h-12 w-12 rounded-xl bg-slate-900 shadow-lg p-0"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </form>
          </CardFooter>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-blue-800 dark:text-blue-200">Protocol Awareness</p>
            <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-relaxed">
              Your identity is displayed as "TaskHome Support" to the user. Maintain professional tone and verify transaction proofs carefully.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
