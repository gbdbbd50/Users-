
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  Award, 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  ArrowLeft, 
  ShieldCheck, 
  Save,
  Zap,
  Target
} from "lucide-react";
import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function BadgeManagerPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    requiredTasks: 10,
    icon: "Award",
    color: "bg-blue-100 text-blue-600"
  });

  const badgesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "badges"), orderBy("requiredTasks", "asc"));
  }, [db]);

  const { data: badges, loading: badgesLoading } = useCollection<any>(badgesQuery);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const handleSave = async () => {
    if (!db || !formData.name) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        updateDoc(doc(db, "badges", editingId), formData);
        toast({ title: "Badge Updated" });
      } else {
        addDoc(collection(db, "badges"), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        toast({ title: "New Badge Created" });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!db || !confirm("Delete this badge type?")) return;
    
    deleteDoc(doc(db, "badges", id))
      .then(() => {
        toast({ title: "Badge Removed" });
      })
      .catch((e: any) => {
        toast({ variant: "destructive", title: "Error", description: e.message });
      });
  };

  const resetForm = () => {
    setFormData({ name: "", requiredTasks: 10, icon: "Award", color: "bg-blue-100 text-blue-600" });
    setEditingId(null);
  };

  if (authLoading || badgesLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="container px-4 py-8 mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/dashboard/developer"><ArrowLeft className="w-4 h-4" /> Back</Link>
          </Button>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="rounded-xl h-10 gap-2 bg-primary">
            <Plus className="w-4 h-4" /> New Badge
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Award className="w-8 h-8 text-primary" /> Achievement Matrix
          </h1>
          <p className="text-slate-500 text-sm">Define milestones that reward earner consistency.</p>
        </div>

        <div className="grid gap-4">
          {badges?.map((badge: any) => (
            <Card key={badge.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${badge.color} flex items-center justify-center`}>
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{badge.name}</h3>
                    <p className="text-xs text-slate-400">Target: {badge.requiredTasks} Approved Tasks</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingId(badge.id); setFormData(badge); setIsModalOpen(true); }} className="text-slate-400 hover:text-primary"><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(badge.id)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-3xl border-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Badge Config</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Badge Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Master Earner" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Tasks Required</Label>
              <Input type="number" value={formData.requiredTasks} onChange={(e) => setFormData({...formData, requiredTasks: parseInt(e.target.value)})} className="h-12 rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={isSubmitting} className="w-full h-12 rounded-xl font-bold">
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Save Badge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
