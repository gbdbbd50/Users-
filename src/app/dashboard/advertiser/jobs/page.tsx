
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  ArrowLeft, 
  Building2,
  Users,
  Search,
  Globe
} from "lucide-react";
import { collection, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function AdvertiserJobsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    type: "Full-time",
    location: "Remote",
    salary: "",
    description: "",
    requirements: ""
  });

  const jobsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "jobs"), where("advertiserId", "==", user.uid), orderBy("createdAt", "desc"));
  }, [db, user]);

  const { data: myJobs, loading: jobsLoading } = useCollection<any>(jobsQuery);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const handlePostJob = async () => {
    if (!db || !user || !formData.title) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "jobs"), {
        ...formData,
        advertiserId: user.uid,
        status: "ACTIVE",
        createdAt: serverTimestamp()
      });
      toast({ title: "Job Posted", description: "Your vacancy is now live on the board." });
      setIsModalOpen(false);
      setFormData({ title: "", company: "", type: "Full-time", location: "Remote", salary: "", description: "", requirements: "" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Post Failed", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || jobsLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-12">
      <div className="container px-4 py-8 mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/dashboard/advertiser"><ArrowLeft className="w-4 h-4" /> Advertiser Hub</Link>
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="rounded-xl h-11 bg-primary font-bold shadow-lg">
            <Plus className="w-4 h-4 mr-2" /> Post Vacancy
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary" /> My Job Postings
          </h1>
          <p className="text-slate-500 text-sm">Hire long-term talent from our verified network.</p>
        </div>

        <div className="space-y-4">
          {myJobs?.map((job: any) => (
            <Card key={job.id} className="border-none shadow-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge variant="secondary" className="mb-2 text-[10px] font-bold uppercase">{job.type}</Badge>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{job.title}</h3>
                    <p className="text-sm text-slate-500 font-medium">{job.company} • {job.location}</p>
                  </div>
                  <Badge variant={job.status === 'ACTIVE' ? 'default' : 'outline'}>{job.status}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl h-10 text-xs font-bold">Applications (0)</Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-rose-500"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!myJobs || myJobs.length === 0) && (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
              <Building2 className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No job postings yet.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post a Job Vacancy</DialogTitle>
            <DialogDescription>Describe the role and find permanent talent.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Role Title</Label><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Social Media Manager" /></div>
              <div className="space-y-2"><Label>Company Name</Label><Input value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} placeholder="e.g. Acme Ads" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Location</Label><Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. Lagos or Remote" /></div>
              <div className="space-y-2"><Label>Monthly Salary (₦)</Label><Input value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})} placeholder="e.g. 50,000" /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="min-h-[100px]" /></div>
            <div className="space-y-2"><Label>Requirements</Label><Textarea value={formData.requirements} onChange={(e) => setFormData({...formData, requirements: e.target.value})} className="min-h-[80px]" /></div>
          </div>
          <DialogFooter>
            <Button onClick={handlePostJob} disabled={isSubmitting} className="w-full h-14 rounded-2xl font-bold bg-primary shadow-xl">
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Publish Job Board"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
