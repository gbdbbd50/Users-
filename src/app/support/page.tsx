"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  MessageCircle, 
  Send, 
  Bot, 
  MessageSquare, 
  ArrowLeft,
  Headset,
  ExternalLink,
  Loader2,
  Lock,
  User,
  ShieldCheck,
  Users,
  Megaphone
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, limit, setDoc } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SafeDate } from "@/components/SafeDate";

export default function SupportPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const profileRef = useMemoFirebase(() => {
    return user && db ? doc(db, "users", user.uid) : null;
  }, [user, db]);

  const { data: profile, loading: profileLoading } = useDoc<any>(profileRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "support_chats", user.uid, "messages"),
      orderBy("createdAt", "asc"),
      limit(50)
    );
  }, [db, user]);

  const { data: chatMessages, loading: messagesLoading } = useCollection<any>(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const getDashboardHref = () => {
    if (profile?.role === "ADVERTISER") return "/dashboard/advertiser";
    if (profile?.role === "DEVELOPER") return "/dashboard/developer";
    if (profile?.role === "ADMIN") return "/admin";
    return "/dashboard";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !message.trim() || isSending) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, "support_chats", user.uid, "messages"), {
        text: message,
        senderId: user.uid,
        senderName: user.displayName || "Member",
        isAdmin: false,
        createdAt: serverTimestamp()
      });

      await setDoc(doc(db, "support_sessions", user.uid), {
        userId: user.uid,
        userName: user.displayName || "Member",
        lastMessage: message,
        lastMessageAt: serverTimestamp(),
        status: 'PENDING',
        unreadByAdmin: true
      }, { merge: true });

      setMessage("");
    } catch (e) {
      console.error("Chat error:", e);
    } finally {
      setIsSending(false);
    }
  };

  const supportChannels = [
    {
      category: "Direct Assistance",
      items: [
        {
          name: "WhatsApp Direct Support",
          description: "Instant chat with our dedicated support team.",
          url: "https://wa.me/2349039226769",
          icon: MessageCircle,
          color: "bg-[#25D366]",
          label: "Fastest"
        },
        {
          name: "Chisom Response Bot",
          description: "Get instant answers from our automated assistant.",
          url: "https://t.me/chisom_quick_response_bot",
          icon: Bot,
          color: "bg-primary",
          label: "24/7 Bot"
        },
        {
          name: "Telegram Support DM",
          description: "Chat directly with a human moderator.",
          url: "https://t.me/Glitz_media",
          icon: MessageSquare,
          color: "bg-blue-500",
          label: "Direct"
        }
      ]
    },
    {
      category: "Official Communities",
      items: [
        {
          name: "WhatsApp Community",
          description: "Join our official group for updates and member support.",
          url: "https://chat.whatsapp.com/KG0U1mX9m8O9ZGSTbd8J3s",
          icon: Users,
          color: "bg-[#128C7E]",
          label: "Group"
        },
        {
          name: "Telegram Channel",
          description: "The primary source for all TaskHome news and alerts.",
          url: "https://t.me/Taskhomebychiboydatabase",
          icon: Megaphone,
          color: "bg-[#0088cc]",
          label: "Channel"
        }
      ]
    }
  ];

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-12">
      <div className="container px-4 py-8 mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href={getDashboardHref()}>
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-xl text-lg font-black tracking-tighter shadow-sm shadow-primary/20">
              CD
            </span>
            <span className="text-xl font-bold text-primary dark:text-white">TaskHome</span>
          </div>
        </div>

        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary text-white mb-4 shadow-lg shadow-primary/20">
            <Headset className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-primary dark:text-white mb-2">Support Center</h1>
          <p className="text-slate-600 dark:text-slate-400">Need help? Connect with our team instantly or join our community.</p>
        </div>

        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm p-1">
            <TabsTrigger value="chat" className="rounded-xl font-bold gap-2">
              <MessageSquare className="w-4 h-4" /> Online Chat
            </TabsTrigger>
            <TabsTrigger value="external" className="rounded-xl font-bold gap-2">
              <MessageCircle className="w-4 h-4" /> External Links
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            {!user ? (
              <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900">
                <CardContent className="p-12 text-center flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-slate-400">
                    <Lock className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Secure Access Required</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
                      Please sign in to your TaskHome account to access real-time chat with our support agents.
                    </p>
                  </div>
                  <Button asChild className="h-12 px-10 rounded-xl bg-primary font-bold shadow-lg">
                    <Link href="/login">Login to Chat</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden flex flex-col h-[600px] bg-white dark:bg-slate-900">
                <CardHeader className="bg-primary text-white p-6 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Live Support Agent</CardTitle>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Support Online</p>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-white/30 text-white text-[9px] font-bold uppercase tracking-widest">
                      Encrypted
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/20 scrollbar-hide"
                >
                  <div className="flex justify-center mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-tighter flex items-center gap-2 border border-blue-100 dark:border-blue-900/30">
                      <ShieldCheck className="w-3 h-3" /> Chat history is visible only to you and moderators
                    </div>
                  </div>

                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                  ) : !chatMessages || chatMessages.length === 0 ? (
                    <div className="text-center py-20">
                      <Bot className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                      <p className="text-slate-400 text-sm font-medium">No messages yet. Say hello!</p>
                    </div>
                  ) : (
                    chatMessages.map((msg: any) => (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col ${msg.senderId === user.uid ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          msg.senderId === user.uid 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border dark:border-slate-700'
                        }`}>
                          <p className="leading-relaxed">{msg.text}</p>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase px-1">
                          {msg.senderId === user.uid ? 'You' : msg.senderName} • <SafeDate date={msg.createdAt} format="time" />
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>

                <CardFooter className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800 shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
                    <Input 
                      placeholder="Type your message..." 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none shadow-inner text-slate-900 dark:text-white"
                      disabled={isSending}
                    />
                    <Button 
                      type="submit" 
                      disabled={!message.trim() || isSending}
                      className="h-12 w-12 rounded-xl bg-primary shadow-lg p-0"
                    >
                      {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                  </form>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="external" className="space-y-10">
            {supportChannels.map((group) => (
              <div key={group.category} className="space-y-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">
                  {group.category}
                </h2>
                <div className="grid gap-4">
                  {group.items.map((channel) => {
                    const Icon = channel.icon;
                    return (
                      <Link key={channel.name} href={channel.url} target="_blank">
                        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer rounded-2xl overflow-hidden group">
                          <CardContent className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl ${channel.color} text-white flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow`}>
                                <Icon className="w-6 h-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{channel.name}</p>
                                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-bold uppercase tracking-tighter">
                                    {channel.label}
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">{channel.description}</p>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <div className="mt-12 bg-primary/5 dark:bg-primary/10 border border-primary/10 p-6 rounded-[2rem] text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">Average Response Time</p>
          <p className="text-xs text-primary dark:text-primary-foreground font-bold uppercase tracking-wider">Under 15 Minutes</p>
        </div>
      </div>
    </div>
  );
}
