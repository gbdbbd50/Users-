
"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  MessageCircle, 
  ImagePlus, 
  ArrowLeft, 
  Send, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  History,
  TrendingUp,
  X,
  Trash2,
  Edit2,
  Ban,
  ShieldAlert
} from "lucide-react";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, limit, updateDoc, deleteDoc } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { SafeDate } from "@/components/SafeDate";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;

export default function CommunityHubPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [chatMessage, setChatMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofNote, setProofProofNote] = useState("");

  const profileRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile } = useDoc<any>(profileRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "community_messages"), orderBy("createdAt", "asc"), limit(100));
  }, [db]);

  const proofsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "payment_proofs"), orderBy("createdAt", "desc"), limit(30));
  }, [db]);

  const { data: messages, loading: messagesLoading } = useCollection<any>(messagesQuery);
  const { data: proofs, loading: proofsLoading } = useCollection<any>(proofsQuery);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'DEVELOPER';

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !chatMessage.trim() || isSending) return;

    // Link detection policy
    if (URL_REGEX.test(chatMessage)) {
      toast({
        variant: "destructive",
        title: "Policy Violation",
        description: "External links are prohibited to prevent spam and maintain safety."
      });
      return;
    }

    setIsSending(true);
    try {
      if (editingMsgId) {
        await updateDoc(doc(db, "community_messages", editingMsgId), {
          text: chatMessage,
          edited: true,
          updatedAt: serverTimestamp()
        });
        setEditingMsgId(null);
        toast({ title: "Message updated" });
      } else {
        await addDoc(collection(db, "community_messages"), {
          text: chatMessage,
          senderId: user.uid,
          senderName: profile?.displayName || "Member",
          role: profile?.role || "EARNER",
          isVerified: profile?.status === 'VERIFIED',
          createdAt: serverTimestamp()
        });
      }
      setChatMessage("");
    } catch (e) { 
      toast({ variant: "destructive", title: "Action failed" }); 
    } finally { 
      setIsSending(false); 
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!db || !confirm("Delete this message?")) return;
    try {
      await deleteDoc(doc(db, "community_messages", id));
      toast({ title: "Message deleted" });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete failed" });
    }
  };

  const handleDeleteProof = async (id: string) => {
    if (!db || !confirm("Permanently remove this proof from the wall?")) return;
    try {
      await deleteDoc(doc(db, "payment_proofs", id));
      toast({ title: "Proof entry removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action failed" });
    }
  };

  const startEditing = (msg: any) => {
    setEditingMsgId(msg.id);
    setChatMessage(msg.text);
  };

  const cancelEditing = () => {
    setEditingMsgId(null);
    setChatMessage("");
  };

  const handlePostProof = async () => {
    if (!db || !user || !proofImage) return;
    setIsSending(true);
    try {
      await addDoc(collection(db, "payment_proofs"), {
        imageUrl: proofImage,
        note: proofNote,
        userId: user.uid,
        userName: profile?.displayName || "Member",
        createdAt: serverTimestamp()
      });
      toast({ title: "Proof Published!", description: "Thank you for sharing your success." });
      setIsUploadModalOpen(false);
      setProofImage(null);
      setProofProofNote("");
    } catch (e) { toast({ variant: "destructive", title: "Upload failed" }); } finally { setIsSending(false); }
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-12">
      <div className="container px-4 py-8 mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /> Back</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary shadow-sm">Community Hub</Badge>
            {isAdmin && <Badge variant="outline" className="text-amber-600 border-amber-200">Moderator Mode</Badge>}
          </div>
        </div>

        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border h-14 w-full md:w-fit">
            <TabsTrigger value="chat" className="rounded-xl px-8 gap-2 h-11 font-bold"><MessageCircle className="w-4 h-4" /> Member Chat</TabsTrigger>
            <TabsTrigger value="proofs" className="rounded-xl px-8 gap-2 h-11 font-bold"><CheckCircle2 className="w-4 h-4" /> Proof Wall</TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col h-[700px] bg-white dark:bg-slate-900">
              <CardHeader className="bg-primary text-white p-6 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md"><Users className="w-6 h-6" /></div>
                  <div>
                    <CardTitle className="text-xl">Global Community</CardTitle>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Public Room • No links allowed</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/20">
                {messages?.map((msg: any) => {
                  const isOwner = msg.senderId === user?.uid;
                  const canDelete = isOwner || isAdmin;
                  
                  return (
                    <div key={msg.id} className={`flex flex-col ${isOwner ? 'items-end' : 'items-start'} group`}>
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[10px] font-black uppercase text-slate-400">{msg.senderName}</span>
                        {msg.isVerified && <ShieldCheck className="w-3 h-3 text-blue-500" />}
                        {msg.role === 'ADMIN' && <Badge className="text-[7px] h-3.5 px-1 bg-amber-500 font-bold uppercase">Staff</Badge>}
                      </div>
                      <div className="flex items-center gap-2 max-w-[85%]">
                        {isOwner && (
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEditing(msg)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-primary shadow-sm border"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => handleDeleteMessage(msg.id)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 shadow-sm border"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        )}
                        <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm flex-1 ${isOwner ? 'bg-primary text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border'}`}>
                          <p className="leading-relaxed">{msg.text}</p>
                          {msg.edited && <span className="text-[8px] opacity-60 mt-1 block">(edited)</span>}
                        </div>
                        {!isOwner && canDelete && (
                          <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 shadow-sm border"><Trash2 className="w-3 h-3" /></button>
                        )}
                      </div>
                      <p className="text-[8px] text-slate-400 mt-1 uppercase font-bold px-1"><SafeDate date={msg.createdAt} format="time" /></p>
                    </div>
                  );
                })}
              </CardContent>
              <CardFooter className="p-4 bg-white dark:bg-slate-900 border-t shrink-0 flex flex-col gap-2">
                {editingMsgId && (
                  <div className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-[10px] font-bold">
                    <span className="text-primary flex items-center gap-1"><Edit2 className="w-3 h-3" /> Editing message...</span>
                    <button onClick={cancelEditing} className="text-slate-400 hover:text-rose-500">Cancel</button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
                  <Input 
                    placeholder="Share tips with the team... (No links)" 
                    value={chatMessage} 
                    onChange={(e) => setChatMessage(e.target.value)} 
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none shadow-inner" 
                    disabled={isSending} 
                  />
                  <Button type="submit" disabled={!chatMessage.trim() || isSending} className="h-12 w-12 rounded-xl bg-primary shadow-lg p-0">
                    {isSending ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="proofs" className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-bold">Recent Withdrawals</h2>
              <Button onClick={() => setIsUploadModalOpen(true)} className="rounded-xl h-10 gap-2 bg-green-600 shadow-lg shadow-green-500/20">
                <ImagePlus className="w-4 h-4" /> Share My Alert
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {proofs?.map((proof: any) => (
                <Card key={proof.id} className="border-none shadow-md bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden group relative">
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeleteProof(proof.id)}
                      className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 hover:bg-rose-500 hover:text-white text-rose-500 rounded-full shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
                    <img src={proof.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="Proof" />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{proof.userName?.slice(0, 1)}</div>
                      <div>
                        <p className="text-sm font-bold">{proof.userName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase"><SafeDate date={proof.createdAt} format="date" /></p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed italic">"{proof.note || 'Just got paid! TaskHome is legit.'}"</p>
                  </CardContent>
                </Card>
              ))}

              {(!proofs || proofs.length === 0) && (
                <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed">
                  <ShieldAlert className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold">Wall is currently empty</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-green-600 p-8 text-center text-white">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
            <DialogTitle className="text-2xl font-bold">Share Your Success</DialogTitle>
            <DialogDescription className="text-green-100 text-sm">Post your bank alert to inspire the community.</DialogDescription>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-slate-400">Alert Screenshot</Label>
                {proofImage ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border">
                    <img src={proofImage} className="w-full h-full object-cover" />
                    <button onClick={() => setProofImage(null)} className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <ImagePlus className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-[10px] font-bold text-slate-400">Click to upload screenshot</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setProofImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-slate-400">Short Note</Label>
                <Input value={proofNote} onChange={(e) => setProofProofNote(e.target.value)} placeholder="e.g. ₦10,000 received! Best platform." className="h-12 rounded-xl" />
              </div>
            </div>
            <Button onClick={handlePostProof} disabled={isSending || !proofImage} className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black text-lg rounded-2xl shadow-xl">
              {isSending ? <Loader2 className="animate-spin" /> : "Post to Proof Wall"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
