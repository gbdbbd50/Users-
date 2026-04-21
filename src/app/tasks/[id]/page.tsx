
"use client";

import { use, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  ExternalLink, 
  ShieldCheck, 
  Zap, 
  Globe,
  ShieldAlert,
  CheckCircle2,
  Camera,
  X,
  ImagePlus,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, addDoc, collection, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const UNLIMITED_VAL = 999999;

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const [submission, setSubmission] = useState("");
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  const taskRef = useMemoFirebase(() => db && id ? doc(db, "tasks", id) : null, [db, id]);
  const { data: task, loading: taskLoading } = useDoc<any>(taskRef);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && !profileLoading && profile) {
      if (profile.role !== "EARNER" && profile.role !== "DEVELOPER") router.push("/dashboard");
      else if (profile.status !== 'VERIFIED' && profile.role !== 'DEVELOPER') setShowUpgradeModal(true);
    }
  }, [user, authLoading, profile, profileLoading, router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (proofImages.length + files.length > 5) {
      toast({ variant: "destructive", title: "Limit Exceeded", description: "Maximum 5 images allowed per submission." });
      return;
    }
    
    files.forEach(file => {
      // Basic size validation (limit each image to ~150KB for base64 storage)
      if (file.size > 200000) {
        toast({ variant: "destructive", title: "Image too large", description: `${file.name} exceeds 200KB.` });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => setProofImages(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !profile || !task) return;

    // Check Daily Limit
    const maxDaily = profile.maxDailyTasks || 0;
    if (maxDaily < UNLIMITED_VAL && profile.dailyTaskCount >= maxDaily) {
      toast({ variant: "destructive", title: "Daily Limit Reached", description: "Upgrade your plan to unlock more daily tasks." });
      return;
    }

    if (!submission.trim() && proofImages.length === 0) {
      toast({ title: "Evidence Required", description: "Please provide either a screenshot or proof details.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const percentage = profile.planPercentage || 100;
      const actualReward = task.reward * (percentage / 100);

      await addDoc(collection(db, "submissions"), {
        taskId: id,
        userId: user.uid,
        userName: user.displayName || "Member",
        description: submission,
        proofImages: proofImages,
        status: "PENDING",
        submittedAt: new Date().toISOString(),
        planPercentage: percentage,
        originalReward: task.reward,
        userReward: actualReward,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "users", user.uid), {
        dailyTaskCount: increment(1),
        monthlyTaskCount: increment(1),
        totalTaskCount: increment(1)
      });

      toast({ title: "Work Submitted!", description: "Moderators will review your proof shortly." });
      router.push("/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
      setIsSubmitting(false);
    }
  };

  if (taskLoading || authLoading || profileLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      <div className="container px-4 py-8 mx-auto max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2" disabled={isSubmitting}><Link href="/tasks"><ArrowLeft className="w-4 h-4" /> Back</Link></Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem]">
              <div className="relative h-64 w-full">
                <Image src={task.imageUrl || "https://picsum.photos/seed/task/600/400"} alt="" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <Badge className="bg-primary/90 text-white border-none mb-2">{task.platform}</Badge>
                  <h1 className="text-2xl font-bold text-white leading-tight">{task.title}</h1>
                </div>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Reward</p>
                    <p className="text-3xl font-black text-primary">₦{task.reward.toLocaleString()}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2 dark:text-slate-200"><Zap className="w-4 h-4 text-amber-500" /> Instructions</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border">{task.description}</p>
                  {task.link && (
                    <Button asChild className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold" disabled={isSubmitting}>
                      <a href={task.link} target="_blank" rel="noopener"><Globe className="w-4 h-4" /> Open Link <ExternalLink className="w-4 h-4" /></a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b p-8">
                <CardTitle className="flex items-center gap-2 text-lg"><Send className="w-5 h-5 text-primary" /> Submit Proof</CardTitle>
                <CardDescription>Follow the requirements exactly to ensure approval.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 italic">"{task.requirements}"</p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold">Evidence Screenshots ({proofImages.length}/5)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {proofImages.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border">
                        <img src={img} className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                    {proofImages.length < 5 && !isSubmitting && (
                      <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                        <ImagePlus className="w-6 h-6 text-slate-400" />
                        <span className="text-[10px] mt-1 font-bold text-slate-400">Add Image</span>
                        <Input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Limit: 200KB per image.</p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="submission" className="text-sm font-bold">Username/Links Provided</Label>
                  <Textarea id="submission" placeholder="Enter proof text here..." className="min-h-[120px] rounded-2xl" value={submission} onChange={(e) => setSubmission(e.target.value)} disabled={isSubmitting} />
                </div>
                <Button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="w-full h-14 bg-primary text-white font-bold rounded-2xl text-lg shadow-lg">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Completion"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-lg bg-slate-900 text-white rounded-[2rem] overflow-hidden">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Plan Status</CardTitle></CardHeader>
              <CardContent className="text-[10px] space-y-4 text-slate-400">
                <div className="flex justify-between"><span>Current Tier:</span><span className="text-white font-bold">{profile?.planName || "Starter"}</span></div>
                <div className="flex justify-between"><span>Daily Capacity:</span><span className="text-white font-bold">{profile?.maxDailyTasks >= UNLIMITED_VAL ? "Unlimited" : `${profile?.dailyTaskCount || 0} / ${profile?.maxDailyTasks || 0}`}</span></div>
                <div className="flex justify-between"><span>Reward Rate:</span><span className="text-white font-bold">{profile?.planPercentage || 100}%</span></div>
                <Button asChild variant="link" className="p-0 h-auto text-primary text-[9px] font-bold"><Link href="/upgrade">View Plans & Upgrade</Link></Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showUpgradeModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-primary p-8 text-center text-white"><ShieldAlert className="w-12 h-12 mx-auto mb-4" /><DialogTitle className="text-2xl font-bold mb-2">Plan Activation Required</DialogTitle></div>
          <div className="p-8 flex flex-col gap-4 text-center">
            <p className="text-sm text-slate-600">You must have an active membership plan to start earning from tasks.</p>
            <Button onClick={() => router.push('/upgrade')} className="w-full h-12 bg-primary rounded-xl font-bold">Select a Plan</Button>
            <Button variant="ghost" onClick={() => router.push('/dashboard')} className="w-full h-12">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
