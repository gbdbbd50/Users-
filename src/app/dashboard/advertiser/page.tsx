
"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  PlusCircle, 
  Loader2, 
  Briefcase, 
  Plus, 
  CreditCard, 
  X, 
  BellRing, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  ChevronRight,
  LayoutList,
  ImagePlus,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  Users
} from "lucide-react";
import { doc, collection, query, where, addDoc, serverTimestamp, increment, updateDoc, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BrandedLoader } from "@/components/BrandedLoader";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, CellProps, Pie, PieChart } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TEMPLATES = [
  { id: 'tiktok', name: 'TikTok Viral Follow', platform: 'TikTok', type: 'Follow', basePrice: 20, instructions: 'Follow the account and watch at least 1 video for 15 seconds.', proof: 'Screenshot of following and watch history.' },
  { id: 'ig-boost', name: 'Instagram Like & Comment', platform: 'Instagram', type: 'Engagement', basePrice: 25, instructions: 'Like the most recent post and leave a meaningful 5-word comment.', proof: 'Screenshot of your comment.' },
  { id: 'whatsapp-status', name: 'WhatsApp Status Ad', platform: 'WhatsApp', type: 'Status', basePrice: 50, instructions: 'Post the attached image/link to your WhatsApp status and keep for 24h.', proof: 'Screenshot of status views after 20 hours.' }
];

export default function AdvertiserDashboard() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creationStep, setCreationStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newTask, setNewTask] = useState({
    platform: "", type: "", basePrice: 0, instructions: "", proof: "", quantity: "10", link: "", sampleImages: [] as string[]
  });

  const profileRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(profileRef);

  const tasksQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "tasks"), where("advertiserId", "==", user.uid));
  }, [db, user]);
  const { data: myTasks, loading: tasksLoading } = useCollection<any>(tasksQuery);

  const catalogQuery = useMemoFirebase(() => db ? query(collection(db, "catalog"), orderBy("name", "asc")) : null, [db]);
  const { data: catalog } = useCollection<any>(catalogQuery);

  // Analytics Real-time data
  const chartData = useMemo(() => {
    if (!myTasks) return [];
    return myTasks.map(t => ({
      name: t.title.slice(0, 10),
      completes: t.completedSlots || 0,
      slots: t.quantity || 1
    })).slice(0, 5);
  }, [myTasks]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const applyTemplate = (t: any) => {
    setNewTask({ ...newTask, platform: t.platform, type: t.type, basePrice: t.basePrice, instructions: t.instructions, proof: t.proof });
    setCreationStep(2);
  };

  const totalCost = (newTask.basePrice * parseInt(newTask.quantity || "0")) || 0;

  const handleSampleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (newTask.sampleImages.length >= 3) {
      toast({ variant: "destructive", title: "Limit Reached", description: "Maximum 3 sample images allowed." });
      return;
    }

    if (file.size > 200000) {
      toast({ variant: "destructive", title: "Image too large", description: "Each image must be under 200KB." });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewTask(prev => ({ ...prev, sampleImages: [...prev.sampleImages, reader.result as string] }));
    };
    reader.readAsDataURL(file);
  };

  const removeSampleImage = (index: number) => {
    setNewTask(prev => ({ ...prev, sampleImages: prev.sampleImages.filter((_, i) => i !== index) }));
  };

  const handleCreateTask = async () => {
    if (!db || !user || !profile) return;
    if (profile.balance < totalCost) { toast({ variant: "destructive", title: "Insufficient Credit" }); return; }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "tasks"), {
        title: `${newTask.platform}: ${newTask.type}`,
        platform: newTask.platform,
        taskType: newTask.type,
        description: newTask.instructions,
        requirements: newTask.proof,
        reward: newTask.basePrice,
        quantity: parseInt(newTask.quantity),
        completedSlots: 0,
        totalCost: totalCost,
        link: newTask.link,
        sampleImages: newTask.sampleImages,
        advertiserId: user.uid,
        advertiserName: profile.displayName,
        status: "PENDING",
        createdAt: serverTimestamp(),
        category: newTask.platform,
        imageUrl: `https://picsum.photos/seed/${newTask.platform}/600/400`
      });
      await updateDoc(doc(db, "users", user.uid), { balance: increment(-totalCost) });
      toast({ title: "Campaign Submitted" });
      setIsCreateModalOpen(false);
      setCreationStep(1);
      setNewTask({ platform: "", type: "", basePrice: 0, instructions: "", proof: "", quantity: "10", link: "", sampleImages: [] });
    } catch (e: any) { toast({ variant: "destructive", title: "Failed", description: e.message }); } finally { setIsSubmitting(false); }
  };

  if (authLoading || profileLoading || tasksLoading || !user) return <BrandedLoader welcome={false} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-12">
      <div className="container px-4 py-6 mx-auto max-w-lg md:max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Advertiser Hub</h1>
            <p className="text-slate-500 text-sm">Real-time Campaign Intel</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-xl h-11 bg-primary font-bold gap-2"><Plus className="w-4 h-4" /> New Campaign</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-md bg-white dark:bg-slate-900 rounded-[2rem] p-6">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Available Credit</p>
            <h2 className="text-3xl font-black text-primary">₦{profile?.balance?.toLocaleString()}</h2>
            <Link href="/dashboard/advertiser/top-up" className="text-xs font-bold text-blue-600 mt-2 block hover:underline">Top up wallet →</Link>
          </Card>
          <Card className="border-none shadow-md bg-white dark:bg-slate-900 rounded-[2rem] p-6">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Active Tasks</p>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white">{myTasks?.filter(t => t.status === 'ACTIVE').length || 0}</h2>
            <p className="text-xs text-slate-500 mt-2">Currently running campaigns</p>
          </Card>
          <Card className="border-none shadow-md bg-white dark:bg-slate-900 rounded-[2rem] p-6">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Impact Factor</p>
            <h2 className="text-3xl font-black text-emerald-600">{myTasks?.reduce((acc, curr) => acc + (curr.completedSlots || 0), 0).toLocaleString()}</h2>
            <p className="text-xs text-slate-500 mt-2">Total engagements delivered</p>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-900 p-1 rounded-2xl h-14 w-full md:w-fit shadow-sm">
            <TabsTrigger value="overview" className="rounded-xl px-6 font-bold">Overview</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl px-6 font-bold">Analytics</TabsTrigger>
            <TabsTrigger value="tools" className="rounded-xl px-6 font-bold">More Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Campaigns</h2>
              <Link href="/dashboard/advertiser/campaigns" className="text-xs font-bold text-primary">Manage All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myTasks?.slice(0, 4).map(task => (
                <Link key={task.id} href={`/dashboard/advertiser/campaigns/${task.id}/submissions`}>
                  <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl overflow-hidden hover:shadow-md transition-all">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><Zap className="w-6 h-6" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{task.title}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{task.completedSlots} / {task.quantity} Delivered</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-slate-900 p-8">
              <div className="flex items-center gap-2 mb-8">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Engagement Velocity</h2>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#94a3b8'}} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="completes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">ROI Efficiency</p>
                  <p className="text-sm font-bold">High Precision Delivery</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Growth Forecast</p>
                  <p className="text-sm font-bold">Stable Community Response</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="tools">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/dashboard/advertiser/jobs">
                <Card className="border-none shadow-md rounded-3xl p-6 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                  <Briefcase className="w-8 h-8 mb-4" />
                  <h3 className="text-xl font-bold">Job Board</h3>
                  <p className="text-xs text-indigo-100 mt-2">Hire long-term specialists from our verified network.</p>
                </Card>
              </Link>
              <Link href="/referrals">
                <Card className="border-none shadow-md rounded-3xl p-6 bg-slate-900 text-white hover:bg-black transition-colors">
                  <Users className="w-8 h-8 mb-4" />
                  <h3 className="text-xl font-bold">Referral Engine</h3>
                  <p className="text-xs text-slate-400 mt-2">Earn commissions by referring other advertisers.</p>
                </Card>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-[425px] rounded-[2.5rem] border-none p-0 overflow-hidden dark:bg-slate-900">
          <div className="bg-primary p-6 text-white"><DialogTitle className="text-2xl font-bold">New Campaign</DialogTitle></div>
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {creationStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 px-1">Use a Template</p>
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => applyTemplate(t)} className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-left hover:border-primary transition-all group">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t.name}</p>
                        <Badge variant="outline" className="text-[8px]">₦{t.basePrice}</Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{t.instructions}</p>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest px-1"><span className="flex-1 h-px bg-slate-100" /> OR <span className="flex-1 h-px bg-slate-100" /></div>
                <Button onClick={() => setCreationStep(2)} variant="outline" className="w-full h-12 rounded-xl border-dashed">Start from Scratch</Button>
              </div>
            )}
            {creationStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Target Link</Label>
                  <Input placeholder="https://..." value={newTask.link} onChange={(e) => setNewTask({...newTask, link: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-slate-400">Workers</Label><Input type="number" value={newTask.quantity} onChange={(e) => setNewTask({...newTask, quantity: e.target.value})} className="h-12 rounded-xl" /></div>
                  <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-slate-400">Price/Slot (₦)</Label><Input type="number" value={newTask.basePrice} onChange={(e) => setNewTask({...newTask, basePrice: parseFloat(e.target.value) || 0})} className="h-12 rounded-xl" /></div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Instructions</Label>
                  <Textarea value={newTask.instructions} onChange={(e) => setNewTask({...newTask, instructions: e.target.value})} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Required Proof</Label>
                  <Textarea value={newTask.proof} onChange={(e) => setNewTask({...newTask, proof: e.target.value})} className="rounded-xl" />
                </div>
                
                {/* Sample Proof Upload Section */}
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Sample Proof Images (Max 3)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {newTask.sampleImages.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border">
                        <img src={img} className="w-full h-full object-cover" />
                        <button onClick={() => removeSampleImage(i)} className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full transition-transform active:scale-90">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {newTask.sampleImages.length < 3 && (
                      <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <ImagePlus className="w-5 h-5 text-slate-400" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleSampleUpload} />
                      </label>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 italic">Provide visual examples to earners.</p>
                </div>

                <Button onClick={() => setCreationStep(3)} className="w-full h-12 rounded-xl font-bold">Review & Pay</Button>
              </div>
            )}
            {creationStep === 3 && (
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border space-y-3">
                  <div className="flex justify-between font-bold"><span>Campaign Budget</span><span className="text-primary">₦{totalCost.toLocaleString()}</span></div>
                  <div className="flex justify-between text-xs text-slate-400"><span>Target Workers</span><span>{newTask.quantity}</span></div>
                </div>
                <Button onClick={handleCreateTask} disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black text-lg bg-primary shadow-xl">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Launch Campaign"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
