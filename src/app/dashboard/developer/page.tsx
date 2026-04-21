
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Terminal, 
  Loader2, 
  ArrowLeft, 
  Users, 
  Edit, 
  Settings,
  Wallet,
  Zap,
  Activity,
  LayoutGrid,
  Coins,
  Gamepad2,
  History,
  ArrowRight,
  Database,
  X,
  Save,
  Megaphone,
  Plus,
  Trash2,
  ImagePlus,
  ArrowUpCircle,
  ShieldCheck,
  Globe,
  Settings2,
  User,
  Percent,
  PlusCircle,
  ExternalLink,
  Info,
  Award
} from "lucide-react";
import { doc, collection, query, setDoc, where, orderBy, updateDoc, addDoc, deleteDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { SafeDate } from "@/components/SafeDate";
import { BrandedLoader } from "@/components/BrandedLoader";

export default function DeveloperDashboard() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  const globalSettingsRef = useMemoFirebase(() => db ? doc(db, "settings", "global") : null, [db]);
  const { data: globalSettings, loading: settingsLoading } = useDoc<any>(globalSettingsRef);

  const usersQuery = useMemoFirebase(() => db ? collection(db, "users") : null, [db]);
  const announcementsQuery = useMemoFirebase(() => db ? query(collection(db, "announcements"), orderBy("createdAt", "desc")) : null, [db]);
  const plansQuery = useMemoFirebase(() => db ? query(collection(db, "plans"), orderBy("cost", "asc")) : null, [db]);

  const { data: allUsers, loading: usersLoading } = useCollection<any>(usersQuery);
  const { data: announcements, loading: announcementsLoading } = useCollection<any>(announcementsQuery);
  const { data: plans } = useCollection<any>(plansQuery);

  const [searchTerm, setSearchTerm] = useState("");
  const [newAnnouncement, setNewAnnouncement] = useState<any>({
    title: "", 
    message: "", 
    imageUrl: "", 
    buttons: [], 
    targetRoles: ["ALL"], 
    isActive: true
  });

  const [config, setConfig] = useState({
    maintenanceMode: false,
    minWithdrawal: 100,
    activationFee: 1000,
    googleAuthEnabled: true,
    phoneAuthEnabled: true,
    referralReward: 100,
    referralCommission: 0.5
  });

  useEffect(() => {
    if (globalSettings) {
      setConfig({
        maintenanceMode: globalSettings.maintenanceMode ?? false,
        minWithdrawal: globalSettings.minWithdrawal ?? 100,
        activationFee: globalSettings.activationFee ?? 1000,
        googleAuthEnabled: globalSettings.googleAuthEnabled ?? true,
        phoneAuthEnabled: globalSettings.phoneAuthEnabled ?? true,
        referralReward: globalSettings.referralReward ?? 100,
        referralCommission: globalSettings.referralCommission ?? 0.5
      });
    }
  }, [globalSettings]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!profileLoading && profile && profile.role !== "DEVELOPER") router.push("/dashboard");
  }, [user, authLoading, profile, profileLoading, router]);

  const handleAnnouncementImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`https://api.imgbb.com/1/upload?key=619360e1af12c45986feedd74d2ea5e67474f25d`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setNewAnnouncement((prev: any) => ({ ...prev, imageUrl: result.data.url }));
        toast({ title: "Header Uploaded Successfully" });
      } else {
        toast({ variant: "destructive", title: "Upload failed", description: result.error?.message || "Unknown error" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload error", description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const addAnnouncementButton = () => {
    setNewAnnouncement((prev: any) => ({
      ...prev,
      buttons: [...(prev.buttons || []), { text: "", url: "" }]
    }));
  };

  const removeAnnouncementButton = (index: number) => {
    setNewAnnouncement((prev: any) => ({
      ...prev,
      buttons: prev.buttons.filter((_: any, i: number) => i !== index)
    }));
  };

  const updateAnnouncementButton = (index: number, field: string, value: string) => {
    setNewAnnouncement((prev: any) => {
      const updatedButtons = [...(prev.buttons || [])];
      updatedButtons[index] = { ...updatedButtons[index], [field]: value };
      return { ...prev, buttons: updatedButtons };
    });
  };

  const handleSaveSettings = async () => {
    if (!db) return;
    setProcessingId('save-settings');
    try {
      await setDoc(doc(db, "settings", "global"), config, { merge: true });
      toast({ title: "Global Sync Complete" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!db || !newAnnouncement.title || !newAnnouncement.message) return;
    setProcessingId('create-announcement');
    try {
      await addDoc(collection(db, "announcements"), { 
        ...newAnnouncement, 
        createdAt: serverTimestamp() 
      });
      toast({ title: "Broadcast Published" });
      setIsAnnouncementModalOpen(false);
      setNewAnnouncement({ 
        title: "", 
        message: "", 
        imageUrl: "", 
        buttons: [], 
        targetRoles: ["ALL"], 
        isActive: true 
      });
    } catch (e) { 
      toast({ variant: "destructive", title: "Failed to publish" }); 
    } finally { 
      setProcessingId(null); 
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !editingUser) return;
    setProcessingId('update-user');
    try {
      const updates: any = {
        displayName: editingUser.displayName,
        legalFullName: editingUser.legalFullName || "",
        role: editingUser.role,
        status: editingUser.status,
        balance: parseFloat(editingUser.balance) || 0,
        planId: editingUser.planId || null,
        planName: editingUser.planName || "Starter"
      };

      if (editingUser.planId && plans) {
        const p = plans.find((p: any) => p.id === editingUser.planId);
        if (p) {
          updates.planPercentage = p.taskPercentage;
          updates.maxDailyTasks = p.maxDailyTasks;
          updates.maxMonthlyTasks = p.maxMonthlyTasks;
          updates.maxTotalTasks = p.maxTotalTasks;
          updates.minWithdrawal = p.minWithdrawal;
          updates.withdrawalCharge = p.withdrawalCharge;
          updates.maxWithdrawalCount = p.maxWithdrawalCount;
        }
      } else if (editingUser.planId === 'starter') {
        updates.planId = null;
        updates.planName = "Starter";
        updates.planPercentage = 100;
        updates.maxDailyTasks = 5;
        updates.maxMonthlyTasks = 100;
        updates.maxTotalTasks = 500;
        updates.minWithdrawal = 100;
        updates.withdrawalCharge = 0;
        updates.maxWithdrawalCount = 10;
      }

      await updateDoc(doc(db, "users", editingUser.id), updates);
      toast({ title: "User Identity Synced" });
      setIsEditModalOpen(false);
    } catch (e) { 
      toast({ variant: "destructive", title: "Update Failed" }); 
    } finally { 
      setProcessingId(null); 
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!db || !confirm("Permanently delete this broadcast?")) return;
    try {
      await deleteDoc(doc(db, "announcements", id));
      toast({ title: "Broadcast Removed" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  const filteredUsers = allUsers?.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || profileLoading || settingsLoading || usersLoading || !user) {
    return <BrandedLoader welcome={false} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 transition-colors">
      <div className="container px-4 py-8 mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon" className="rounded-full"><Link href="/dashboard"><ArrowLeft className="w-5 h-5" /></Link></Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Terminal className="w-6 h-6 text-primary" /> Dev Console
              </h1>
              <p className="text-slate-500 text-xs">Platform Command Plane</p>
            </div>
          </div>
          <Badge variant="outline" className="border-primary text-primary font-bold px-3 py-1">Root Level</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {[
            { name: "Plans", icon: ArrowUpCircle, color: "text-amber-600 bg-amber-100", href: "/dashboard/developer/plans", sub: "Tiers" },
            { name: "Badges", icon: Award, color: "text-blue-600 bg-blue-100", href: "/dashboard/developer/badges", sub: "Achievements" },
            { name: "Upgrades", icon: History, color: "text-rose-600 bg-rose-100", href: "/admin/upgrades", sub: "Audit" },
            { name: "Catalog", icon: LayoutGrid, color: "text-emerald-600 bg-emerald-100", href: "/dashboard/developer/catalog", sub: "Tasks" },
            { name: "Games", icon: Gamepad2, color: "text-purple-600 bg-purple-100", href: "/dashboard/developer/games/catalog", sub: "Skill" },
            { name: "Matrix", icon: Zap, color: "text-indigo-600 bg-indigo-100", href: "/dashboard/developer/activations", sub: "Audit" },
          ].map((item) => (
            <Link key={item.name} href={item.href}>
              <Card className="border-none shadow-sm hover:shadow-md transition-all p-4 flex flex-col items-center text-center gap-2 bg-white rounded-[1.5rem] cursor-pointer group h-32 justify-center">
                <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-tighter">{item.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.sub}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-14 w-full justify-start overflow-x-auto scrollbar-hide">
            <TabsTrigger value="users" className="rounded-xl px-6 gap-2 h-11 font-bold">
              <Users className="w-4 h-4" /> Identity Matrix
            </TabsTrigger>
            <TabsTrigger value="announcements" className="rounded-xl px-6 gap-2 h-11 font-bold">
              <Megaphone className="w-4 h-4" /> Broadcasts
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl px-6 gap-2 h-11 font-bold">
              <Settings2 className="w-4 h-4" /> Global Matrix
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b bg-slate-50/50 p-6">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" /> Identity Manager
                  </CardTitle>
                  <p className="text-xs text-slate-500">Manual profile override and verification.</p>
                </div>
                <div className="relative">
                  <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Search UID or Name..." 
                    className="pl-10 w-full md:w-64 rounded-xl h-11 bg-white" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="px-6 font-bold text-[10px] uppercase">Member</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase">Plan Tier</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase">Balance</TableHead>
                      <TableHead className="text-right px-6 font-bold text-[10px] uppercase">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((u: any) => (
                      <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">
                              {u.displayName?.slice(0, 1)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{u.displayName}</p>
                              <p className="text-[9px] text-slate-400 font-mono">{u.email || u.phoneNumber || u.id.slice(-8)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] uppercase font-bold border-primary/20 text-primary">
                            {u.planName || 'STARTER'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-black text-xs text-slate-700">₦{u.balance?.toLocaleString()}</TableCell>
                        <TableCell className="text-right px-6">
                          <Button size="icon" variant="ghost" onClick={() => { setEditingUser(u); setIsEditModalOpen(true); }} className="text-slate-400 hover:text-primary rounded-xl">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-xl font-bold">Official Broadcasts</h2>
                <p className="text-xs text-slate-500">Push real-time notifications to users.</p>
              </div>
              <Button onClick={() => setIsAnnouncementModalOpen(true)} className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> New Announcement
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {announcements?.map((anno: any) => (
                <Card key={anno.id} className="border-none shadow-md bg-white rounded-3xl overflow-hidden group">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1">
                          {anno.targetRoles?.map((r: string) => (
                            <Badge key={r} variant="secondary" className="text-[8px] h-4 px-1.5 uppercase font-bold bg-primary/10 text-primary border-none">{r}</Badge>
                          ))}
                        </div>
                        <h3 className="font-bold text-slate-800 leading-tight">{anno.title}</h3>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-500 rounded-lg" onClick={() => handleDeleteAnnouncement(anno.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {anno.imageUrl && (
                      <div className="aspect-video w-full rounded-xl overflow-hidden mb-2">
                        <img src={anno.imageUrl} className="w-full h-full object-cover" alt="" />
                      </div>
                    )}
                    <p className="text-xs text-slate-500 line-clamp-2 italic">"{anno.message}"</p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                        <SafeDate date={anno.createdAt} format="date" />
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{anno.isActive ? 'Active' : 'Hidden'}</span>
                        <Switch checked={anno.isActive} onCheckedChange={async () => { if(!db) return; await updateDoc(doc(db, "announcements", anno.id), { isActive: !anno.isActive }) }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-widest">Security & Auth</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div className="space-y-0.5">
                        <Label className="font-bold text-sm">Maintenance Mode</Label>
                        <p className="text-[10px] text-slate-400">Lock down platform dashboards.</p>
                      </div>
                      <Switch checked={config.maintenanceMode} onCheckedChange={(v) => setConfig({...config, maintenanceMode: v})} />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <Label className="font-bold text-sm">Google Login</Label>
                      <Switch checked={config.googleAuthEnabled} onCheckedChange={(v) => setConfig({...config, googleAuthEnabled: v})} />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <Label className="font-bold text-sm">Phone OTP Login</Label>
                      <Switch checked={config.phoneAuthEnabled} onCheckedChange={(v) => setConfig({...config, phoneAuthEnabled: v})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Coins className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-widest">Financial Defaults</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">Global Min Payout (₦)</Label>
                      <Input type="number" value={config.minWithdrawal} onChange={(e) => setConfig({...config, minWithdrawal: parseFloat(e.target.value) || 0})} className="rounded-xl h-12 bg-slate-50 border-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">Ref Reward (₦)</Label>
                        <Input type="number" value={config.referralReward} onChange={(e) => setConfig({...config, referralReward: parseFloat(e.target.value) || 0})} className="rounded-xl h-12 bg-slate-50 border-none" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">Ref Comm (%)</Label>
                        <Input type="number" step="0.1" value={config.referralCommission} onChange={(e) => setConfig({...config, referralCommission: parseFloat(e.target.value) || 0})} className="rounded-xl h-12 bg-slate-50 border-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button className="w-full h-14 rounded-[1.5rem] font-bold text-lg shadow-xl shadow-primary/20 gap-2" onClick={handleSaveSettings} disabled={!!processingId}>
                {processingId === 'save-settings' ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                Save Master Configuration
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="rounded-[2rem] border-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Profile Override
            </DialogTitle>
            <DialogDescription>Modify core identity and wallet parameters.</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="py-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Username</Label>
                <Input value={editingUser.displayName} onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Legal Full Name</Label>
                <Input value={editingUser.legalFullName || ""} onChange={(e) => setEditingUser({...editingUser, legalFullName: e.target.value})} className="h-12 rounded-xl" placeholder="Real name for payments" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Platform Role</Label>
                  <Select value={editingUser.role} onValueChange={(v) => setEditingUser({...editingUser, role: v})}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EARNER">Earner</SelectItem>
                      <SelectItem value="ADVERTISER">Advertiser</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="DEVELOPER">Developer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Security Status</Label>
                  <Select value={editingUser.status} onValueChange={(v) => setEditingUser({...editingUser, status: v})}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VERIFIED">Verified</SelectItem>
                      <SelectItem value="UNVERIFIED">Unverified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Membership Level (Plan)</Label>
                <Select 
                  value={editingUser.planId || "starter"} 
                  onValueChange={(v) => {
                    const selectedPlan = plans?.find(p => p.id === v);
                    if (v === 'starter') {
                      setEditingUser({...editingUser, planId: 'starter', planName: "Starter"});
                    } else if (selectedPlan) {
                      setEditingUser({...editingUser, planId: v, planName: selectedPlan.name});
                    }
                  }}
                >
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter (Free)</SelectItem>
                    {plans?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Wallet Balance (₦)</Label>
                <Input type="number" value={editingUser.balance} onChange={(e) => setEditingUser({...editingUser, balance: e.target.value})} className="h-14 rounded-xl font-black text-xl text-primary" />
              </div>
              <Button type="submit" disabled={!!processingId} className="w-full h-14 rounded-2xl font-bold text-lg bg-primary mt-4">
                {processingId === 'update-user' ? <Loader2 className="animate-spin w-5 h-5" /> : "Commit Identity Sync"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAnnouncementModalOpen} onOpenChange={setIsAnnouncementModalOpen}>
        <DialogContent className="rounded-[2.5rem] border-none sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" /> Push Broadcast</DialogTitle>
            <DialogDescription>Broadcast a role-targeted message to the platform.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Header Image</Label>
              {newAnnouncement.imageUrl ? (
                <div className="relative aspect-video rounded-xl overflow-hidden border">
                  <img src={newAnnouncement.imageUrl} className="w-full h-full object-cover" alt="" />
                  <button 
                    onClick={() => setNewAnnouncement({...newAnnouncement, imageUrl: ""})}
                    className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <ImagePlus className="w-6 h-6 text-slate-400" />}
                  <span className="text-[10px] mt-2 font-bold text-slate-400">Upload Header (Direct to ImgBB)</span>
                  <Input type="file" accept="image/*" className="hidden" onChange={handleAnnouncementImageUpload} disabled={isUploading} />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Title</Label>
              <Input value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} placeholder="e.g. Major Update" className="rounded-xl h-12" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Message Content</Label>
              <Textarea value={newAnnouncement.message} onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})} className="rounded-xl min-h-[100px]" placeholder="Type your broadcast message..." />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Action Buttons (Addable/Optional)</Label>
                <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={addAnnouncementButton}>
                  <PlusCircle className="w-3 h-3" /> Add Button
                </Button>
              </div>
              <div className="space-y-3">
                {(newAnnouncement.buttons || []).map((btn: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 relative">
                    <button 
                      onClick={() => removeAnnouncementButton(idx)}
                      className="absolute top-2 right-2 text-slate-300 hover:text-rose-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <Input 
                      placeholder="Button Text" 
                      value={btn.text} 
                      onChange={(e) => updateAnnouncementButton(idx, 'text', e.target.value)} 
                      className="h-9 text-xs rounded-lg"
                    />
                    <Input 
                      placeholder="Button URL" 
                      value={btn.url} 
                      onChange={(e) => updateAnnouncementButton(idx, 'url', e.target.value)} 
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Target Audience</Label>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">(ALL/EARNER/ADV/GUEST)</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {['ALL', 'EARNER', 'ADVERTISER', 'ADMIN', 'DEVELOPER', 'GUEST'].map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      const current = newAnnouncement.targetRoles;
                      const next = current.includes(role) ? current.filter((r: string) => r !== role) : [...current, role];
                      setNewAnnouncement({...newAnnouncement, targetRoles: next.length ? next : ['ALL']});
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border-2 transition-all ${newAnnouncement.targetRoles.includes(role) ? 'bg-primary border-primary text-white' : 'border-slate-100 text-slate-400 hover:border-primary/30'}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateAnnouncement} disabled={!!processingId || !newAnnouncement.title || !newAnnouncement.message} className="w-full h-14 rounded-2xl font-bold text-lg bg-primary shadow-lg">
              {processingId === 'create-announcement' ? <Loader2 className="animate-spin w-5 h-5" /> : "Publish Broadcast"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
