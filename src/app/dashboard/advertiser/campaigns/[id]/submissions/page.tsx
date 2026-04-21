
"use client";

import { use, useEffect, useState } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  CheckCircle2, 
  XCircle, 
  Star, 
  Eye,
  AlertCircle,
  ImageIcon,
  FileText
} from "lucide-react";
import { doc, collection, query, where, orderBy, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CampaignSubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<{rating: number, feedback: string}>({ rating: 5, feedback: "" });

  const taskRef = useMemoFirebase(() => db ? doc(db, "tasks", id) : null, [db, id]);
  const { data: task, loading: taskLoading } = useDoc<any>(taskRef);

  const userProfileRef = useMemoFirebase(() => {
    return user && db ? doc(db, "users", user.uid) : null;
  }, [user, db]);
  const { data: profile } = useDoc<any>(userProfileRef);

  const subsQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, "submissions"), where("taskId", "==", id), orderBy("submittedAt", "desc"));
  }, [db, id]);

  const { data: submissions, loading: subsLoading } = useCollection<any>(subsQuery);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && profile && profile.role !== 'ADVERTISER' && profile.role !== 'DEVELOPER' && profile.role !== 'ADMIN') {
      router.push("/dashboard");
    }
  }, [user, authLoading, profile, router]);

  const handleAction = async (sub: any, action: 'APPROVED' | 'REJECTED') => {
    if (!db || !task) return;
    setProcessingId(`${sub.id}-${action}`);

    try {
      // Use the reward amount tailored to the user's plan percentage
      const releaseAmount = sub.userReward || task.reward;

      await updateDoc(doc(db, "submissions", sub.id), {
        status: action,
        reviewedAt: new Date().toISOString(),
        rating: action === 'APPROVED' ? reviewData.rating : null,
        feedback: reviewData.feedback,
        rewardReleased: action === 'APPROVED' ? releaseAmount : 0 
      });

      if (action === 'APPROVED') {
        // Credit the Earner with the calculated reward
        await updateDoc(doc(db, "users", sub.userId), {
          balance: increment(releaseAmount),
          completedTasks: increment(1)
        });
        
        // Mark slot as completed in task
        await updateDoc(doc(db, "tasks", task.id), {
          completedSlots: increment(1)
        });
      }

      toast({ title: `Submission ${action.toLowerCase()}` });
      setReviewData({ rating: 5, feedback: "" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update failed", description: e.message });
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading || taskLoading || subsLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-12">
      <div className="container px-4 py-8 mx-auto max-w-2xl">
        <div className="mb-6"><Button asChild variant="ghost" size="sm" className="gap-2"><Link href="/dashboard/advertiser/campaigns"><ArrowLeft className="w-4 h-4" /> Campaigns</Link></Button></div>
        <div className="mb-8">
          <Badge className="mb-2 border-primary text-primary">{task?.category}</Badge>
          <h1 className="text-3xl font-bold text-primary">{task?.title}</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm italic">Review work evidence to release payments.</p>
        </div>

        <div className="space-y-6">
          {submissions?.map((sub: any) => {
            const isPending = sub.status === 'PENDING';
            const isApproving = processingId === `${sub.id}-APPROVED`;
            const isRejecting = processingId === `${sub.id}-REJECTED`;
            
            const hasImages = (sub.proofImages && sub.proofImages.length > 0) || sub.proofImageUrl;
            const hasDescription = sub.description && sub.description.trim().length > 0;

            return (
              <Card key={sub.id} className="border-none shadow-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden group">
                <CardHeader className="bg-slate-50/30 border-b dark:border-slate-800 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><User className="w-5 h-5" /></div>
                      <div>
                        <p className="text-sm font-bold dark:text-slate-200">{sub.userName}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-medium">Earner Identity Verified</p>
                      </div>
                    </div>
                    <Badge variant={sub.status === 'APPROVED' ? 'default' : isPending ? 'outline' : 'destructive'} className="text-[9px] uppercase h-6">{sub.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Evidence Display Logic */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Visual Evidence</span>
                    </div>
                    
                    {hasImages ? (
                      <div className="grid grid-cols-2 gap-2">
                        {(sub.proofImages || [sub.proofImageUrl]).filter(Boolean).map((img: string, i: number) => (
                          <div key={i} className="rounded-2xl overflow-hidden border dark:border-slate-800 aspect-video bg-slate-100 dark:bg-slate-800 relative group">
                            <img src={img} className="w-full h-full object-cover cursor-zoom-in" onClick={() => window.open(img, '_blank')} />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <Eye className="text-white w-6 h-6" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert variant="destructive" className="bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900 rounded-2xl py-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="text-xs font-bold">No Screenshots Provided</AlertTitle>
                        <AlertDescription className="text-[10px]">
                          This earner did not upload any visual proof for this task.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex items-center gap-2 text-slate-400 mt-6">
                      <FileText className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Verification Details</span>
                    </div>

                    {hasDescription ? (
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border dark:border-slate-700">
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap italic">"{sub.description}"</p>
                      </div>
                    ) : (
                      <Alert className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl py-3">
                        <AlertCircle className="h-4 w-4 text-slate-400" />
                        <AlertTitle className="text-xs font-bold text-slate-500">No Text Proof</AlertTitle>
                        <AlertDescription className="text-[10px] text-slate-400">
                          The earner did not provide any descriptive text or links.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  {isPending && (
                    <div className="space-y-4 pt-4 border-t dark:border-slate-800">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-3">Review Earner Quality</p>
                        <div className="flex gap-2 mb-4">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star} 
                              onClick={() => !processingId && setReviewData({...reviewData, rating: star})} 
                              className={`w-6 h-6 cursor-pointer transition-colors ${star <= reviewData.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'} ${processingId ? 'opacity-50 cursor-not-allowed' : ''}`} 
                            />
                          ))}
                        </div>
                        <Input 
                          placeholder="Internal feedback (e.g. Good work!)" 
                          value={reviewData.feedback} 
                          onChange={(e) => setReviewData({...reviewData, feedback: e.target.value})} 
                          className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none" 
                          disabled={!!processingId} 
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
                {isPending && (
                  <CardFooter className="flex gap-3 p-6 pt-0">
                    <Button 
                      onClick={() => handleAction(sub, 'REJECTED')} 
                      variant="outline" 
                      disabled={!!processingId} 
                      className="flex-1 rounded-2xl h-12 border-rose-200 text-rose-600 gap-2 font-bold"
                    >
                      {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
                    </Button>
                    <Button 
                      onClick={() => handleAction(sub, 'APPROVED')} 
                      disabled={!!processingId} 
                      className="flex-1 rounded-2xl h-12 bg-primary text-white gap-2 font-bold shadow-lg shadow-primary/20"
                    >
                      {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Approve & Pay
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}

          {(!submissions || submissions.length === 0) && (
            <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed dark:border-slate-800">
              <ImageIcon className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">No submissions yet.</p>
              <p className="text-xs text-slate-300 mt-1 px-8">Earnings will appear here as soon as workers start completing your task.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
