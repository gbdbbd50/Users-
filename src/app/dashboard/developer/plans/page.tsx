
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  ShieldCheck, 
  Save,
  Zap,
  Clock,
  Percent,
  Wallet,
  Gamepad2,
  Infinity as InfinityIcon,
  Users,
  Coins
} from "lucide-react";
import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const UNLIMITED_VAL = 999999;

export default function PlanManagerPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    cost: 0,
    maxDailyTasks: 5,
    maxMonthlyTasks: 100,
    maxTotalTasks: 500,
    periodDays: 30,
    taskPercentage: 100,
    withdrawalCharge: 0,
    minWithdrawal: 100,
    maxWithdrawalCount: 10,
    gamesEnabled: true,
    gamePercentage: 100,
    inviterBonusPercentage: 0,
    advertiserCommissionPercentage: 0
  });

  const [unlimited, setUnlimited] = useState({
    daily: false,
    monthly: false,
    total: false,
    withdrawCount: false
  });

  const plansQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "plans"), orderBy("cost", "asc"));
  }, [db]);

  const { data: plans, loading: plansLoading } = useCollection<any>(plansQuery);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const handleSave = async () => {
    if (!db || !formData.name) return;
    setIsSubmitting(true);
    
    const finalData = {
      ...formData,
      maxDailyTasks: unlimited.daily ? UNLIMITED_VAL : formData.maxDailyTasks,
      maxMonthlyTasks: unlimited.monthly ? UNLIMITED_VAL : formData.maxMonthlyTasks,
      maxTotalTasks: unlimited.total ? UNLIMITED_VAL : formData.maxTotalTasks,
      maxWithdrawalCount: unlimited.withdrawCount ? UNLIMITED_VAL : formData.maxWithdrawalCount,
    };

    try {
      if (editingId) {
        updateDoc(doc(db, "plans", editingId), finalData);
        toast({ title: "Plan Updated" });
      } else {
        addDoc(collection(db, "plans"), {
          ...finalData,
          createdAt: new Date().toISOString()
        });
        toast({ title: "New Plan Created" });
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
    if (!db || !confirm("Delete this plan? Users currently on this plan will keep it until expiry.")) return;
    
    deleteDoc(doc(db, "plans", id))
      .then(() => {
        toast({ title: "Plan Deleted" });
      })
      .catch((e: any) => {
        toast({ variant: "destructive", title: "Error", description: e.message });
      });
  };

  const resetForm = () => {
    setFormData({
      name: "", cost: 0, maxDailyTasks: 5, maxMonthlyTasks: 100, maxTotalTasks: 500,
      periodDays: 30, taskPercentage: 100, withdrawalCharge: 0, minWithdrawal: 100, 
      maxWithdrawalCount: 10, gamesEnabled: true, gamePercentage: 100,
      inviterBonusPercentage: 0, advertiserCommissionPercentage: 0
    });
    setUnlimited({ daily: false, monthly: false, total: false, withdrawCount: false });
    setEditingId(null);
  };

  const openEdit = (plan: any) => {
    setEditingId(plan.id);
    setFormData({
      ...formData,
      ...plan
    });
    setUnlimited({
      daily: plan.maxDailyTasks >= UNLIMITED_VAL,
      monthly: plan.maxMonthlyTasks >= UNLIMITED_VAL,
      total: plan.maxTotalTasks >= UNLIMITED_VAL,
      withdrawCount: plan.maxWithdrawalCount >= UNLIMITED_VAL
    });
    setIsModalOpen(true);
  };

  if (authLoading || plansLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="container px-4 py-8 mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/dashboard/developer"><ArrowLeft className="w-4 h-4" /> Console</Link>
          </Button>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="rounded-xl h-10 gap-2 bg-primary shadow-lg">
            <Plus className="w-4 h-4" /> New Plan
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-8 h-8 text-primary" /> Membership Matrix
          </h1>
          <p className="text-slate-500 text-sm">Define levels, work constraints, and referral bonuses.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans?.map((plan: any) => (
            <Card key={plan.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
              <CardHeader className="bg-slate-50/50 border-b p-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">{plan.name}</CardTitle>
                  <p className="text-xl font-black text-primary">₦{plan.cost.toLocaleString()}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(plan)} className="h-9 w-9 text-slate-400 hover:text-primary"><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)} className="h-9 w-9 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-2 gap-y-4 gap-x-2 text-[11px] font-medium text-slate-600">
                <div className="flex items-center gap-2"><Clock className="w-3 h-3 text-slate-400" /> {plan.periodDays} Days</div>
                <div className="flex items-center gap-2"><Percent className="w-3 h-3 text-slate-400" /> {plan.taskPercentage}% Task Share</div>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-blue-500" /> {plan.inviterBonusPercentage || 0}% Upgrade Bonus
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="w-3 h-3 text-emerald-500" /> {plan.advertiserCommissionPercentage || 0}% Deposit Comm
                </div>
                <div className="flex items-center gap-2 col-span-2 border-t pt-2 mt-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Limits:</span>
                  <Badge variant="outline" className="text-[9px]">
                    {plan.maxDailyTasks >= UNLIMITED_VAL ? "∞ Daily" : `${plan.maxDailyTasks} Daily`}
                  </Badge>
                  <Badge variant="outline" className="text-[9px]">Min Out: ₦{plan.minWithdrawal}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] border-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modify Membership" : "Create Membership Level"}</DialogTitle>
            <DialogDescription>Set rules and reward shares for this plan.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Plan Name</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Bronze" className="h-12 rounded-xl" /></div>
              <div className="space-y-2"><Label>Cost (₦)</Label><Input type="number" value={formData.cost} onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value) || 0})} className="h-12 rounded-xl" /></div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest border-b pb-2">Work Constraints</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Max Daily Tasks</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox id="daily-unlimited" checked={unlimited.daily} onCheckedChange={(v) => setUnlimited({...unlimited, daily: !!v})} />
                      <Label htmlFor="daily-unlimited" className="text-[10px] font-bold text-primary flex items-center gap-1 cursor-pointer"><InfinityIcon className="w-3 h-3" /> Unlimited</Label>
                    </div>
                  </div>
                  <Input type="number" value={unlimited.daily ? "" : formData.maxDailyTasks} onChange={(e) => setFormData({...formData, maxDailyTasks: parseInt(e.target.value) || 0})} disabled={unlimited.daily} className="h-12 rounded-xl disabled:bg-slate-50" placeholder={unlimited.daily ? "Unlimited Active" : "5"} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Max Monthly Tasks</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox id="monthly-unlimited" checked={unlimited.monthly} onCheckedChange={(v) => setUnlimited({...unlimited, monthly: !!v})} />
                      <Label htmlFor="monthly-unlimited" className="text-[10px] font-bold text-primary flex items-center gap-1 cursor-pointer"><InfinityIcon className="w-3 h-3" /> Unlimited</Label>
                    </div>
                  </div>
                  <Input type="number" value={unlimited.monthly ? "" : formData.maxMonthlyTasks} onChange={(e) => setFormData({...formData, maxMonthlyTasks: parseInt(e.target.value) || 0})} disabled={unlimited.monthly} className="h-12 rounded-xl disabled:bg-slate-50" placeholder={unlimited.monthly ? "Unlimited Active" : "100"} />
                </div>
                
                <div className="space-y-2"><Label>Validity Period (Days)</Label><Input type="number" value={formData.periodDays} onChange={(e) => setFormData({...formData, periodDays: parseInt(e.target.value) || 0})} className="h-12 rounded-xl" /></div>
                <div className="space-y-2"><Label>Task Payout Share (%)</Label><Input type="number" value={formData.taskPercentage} onChange={(e) => setFormData({...formData, taskPercentage: parseInt(e.target.value) || 0})} className="h-12 rounded-xl" /></div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest border-b pb-2">Referral & Incentives</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Inviter Bonus % (on Referral Upgrade)</Label>
                  <Input type="number" value={formData.inviterBonusPercentage} onChange={(e) => setFormData({...formData, inviterBonusPercentage: parseInt(e.target.value) || 0})} className="h-12 rounded-xl" />
                  <p className="text-[10px] text-slate-400">Percentage of upgrade fee given to the inviter.</p>
                </div>
                <div className="space-y-2">
                  <Label>Advertiser Commission % (on Referral Deposit)</Label>
                  <Input type="number" value={formData.advertiserCommissionPercentage} onChange={(e) => setFormData({...formData, advertiserCommissionPercentage: parseInt(e.target.value) || 0})} className="h-12 rounded-xl" />
                  <p className="text-[10px] text-slate-400">Percentage of deposits given to the inviter.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest border-b pb-2">Financials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label>Min Withdrawal (₦)</Label><Input type="number" value={formData.minWithdrawal} onChange={(e) => setFormData({...formData, minWithdrawal: parseInt(e.target.value) || 0})} className="h-12 rounded-xl" /></div>
                <div className="space-y-2"><Label>Withdrawal Charge (₦)</Label><Input type="number" value={formData.withdrawalCharge} onChange={(e) => setFormData({...formData, withdrawalCharge: parseInt(e.target.value) || 0})} className="h-12 rounded-xl" /></div>
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={isSubmitting} className="w-full h-14 rounded-2xl font-bold bg-primary shadow-xl">{isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Sync Plan Matrix</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
