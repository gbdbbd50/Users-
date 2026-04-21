
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  ArrowLeft, 
  Database,
  Trophy,
  Target,
  Zap,
  Dices,
  Save,
  PlusCircle,
  X,
  CheckCircle2,
  Settings2,
  History,
  Play,
  ArrowRight,
  ShieldCheck,
  Palette,
  Flag,
  Circle,
  Users,
  Timer
} from "lucide-react";
import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function GameCatalogManager() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({
    type: "trivia",
    title: "",
    description: "",
    stake: 10,
    active: true,
    multiplier: 1.5,
    odds: 1.8,
    reward: 5000,
    questions: [],
    tasks: [],
    referralTarget: 5,
    durationDays: 7,
    validUntil: ""
  });

  const catalogQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "game_catalog"), orderBy("type", "asc"));
  }, [db]);

  const { data: catalog, loading: catalogLoading } = useCollection<any>(catalogQuery);

  const settingsRef = useMemoFirebase(() => db ? doc(db, "settings", "global") : null, [db]);
  const { data: globalSettings } = useDoc<any>(settingsRef);

  const [gamesConfig, setGamesConfig] = useState<any>({
    colorspin: { enabled: true, minStake: 10, multipliers: { red: 3, blue: 3, green: 3, yellow: 3 }, houseEdge: 0.25 },
    tictactoe: { enabled: true, minStake: 10, payoutMultiplier: 5 },
    speedludo: { enabled: true, minStake: 10, payoutMultiplier: 3 },
    trivia: { enabled: true, minStake: 10 },
    predictor: { enabled: true, minStake: 10 },
    labeling: { enabled: true, minStake: 10 },
    raffle: { enabled: true, minStake: 10 }
  });

  useEffect(() => {
    if (globalSettings?.gamesConfig) {
      setGamesConfig({ ...gamesConfig, ...globalSettings.gamesConfig });
    }
  }, [globalSettings]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const handleSaveCatalog = async () => {
    if (!db || !formData.title) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        updateDoc(doc(db, "game_catalog", editingId), formData);
        toast({ title: "Catalog Updated" });
      } else {
        addDoc(collection(db, "game_catalog"), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        toast({ title: "Item Added to Catalog" });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveGameConfig = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      updateDoc(doc(db, "settings", "global"), { gamesConfig });
      toast({ title: "Game Engine Synced" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to Sync", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!db || !confirm("Permanently remove this from catalog?")) return;
    
    deleteDoc(doc(db, "game_catalog", id))
      .then(() => {
        toast({ title: "Catalog Item Removed" });
      })
      .catch((e: any) => {
        toast({ variant: "destructive", title: "Error", description: e.message });
      });
  };

  const resetForm = () => {
    setFormData({
      type: "trivia",
      title: "",
      description: "",
      stake: 10,
      active: true,
      multiplier: 1.5,
      odds: 1.8,
      reward: 5000,
      questions: [],
      tasks: [],
      referralTarget: 5,
      durationDays: 7,
      validUntil: ""
    });
    setEditingId(null);
  };

  const addTriviaQuestion = () => {
    const questions = [...(formData.questions || [])];
    questions.push({ q: "New Question?", a: ["Option 1", "Option 2", "Option 3", "Option 4"], c: 0 });
    setFormData({ ...formData, questions });
  };

  const removeTriviaQuestion = (idx: number) => {
    const questions = formData.questions.filter((_: any, i: number) => i !== idx);
    setFormData({ ...formData, questions });
  };

  const updateTriviaQuestion = (idx: number, field: string, val: any) => {
    const questions = [...formData.questions];
    questions[idx] = { ...questions[idx], [field]: val };
    setFormData({ ...formData, questions });
  };

  const addLabelingTask = () => {
    const tasks = [...(formData.tasks || [])];
    tasks.push({ q: "Identify this object", img: "", a: "YES" });
    setFormData({ ...formData, tasks });
  };

  const removeLabelingTask = (idx: number) => {
    const tasks = formData.tasks.filter((_: any, i: number) => i !== idx);
    setFormData({ ...formData, tasks });
  };

  const updateLabelingTask = (idx: number, field: string, val: any) => {
    const tasks = [...formData.tasks];
    tasks[idx] = { ...tasks[idx], [field]: val };
    setFormData({ ...formData, tasks });
  };

  if (authLoading || catalogLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="container px-4 py-8 mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/dashboard/developer"><ArrowLeft className="w-4 h-4" /> Back to Console</Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" /> Game Matrix
          </h1>
          <p className="text-slate-500 text-sm">Control game rules, content, and payouts.</p>
        </div>

        <Tabs defaultValue="catalog" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-14 w-full md:w-fit">
            <TabsTrigger value="catalog" className="rounded-xl px-6 gap-2 h-11 font-bold"><History className="w-4 h-4" /> Content Catalog</TabsTrigger>
            <TabsTrigger value="engine" className="rounded-xl px-6 gap-2 h-11 font-bold"><Settings2 className="w-4 h-4" /> Game Engine Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="space-y-6">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-bold">Dynamic Content</h2>
              <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="rounded-xl h-10 gap-2 bg-primary shadow-lg">
                <Plus className="w-4 h-4" /> New Session
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {catalog?.map((item: any) => {
                const Icon = item.type === 'trivia' ? Trophy : item.type === 'predictor' ? Target : item.type === 'labeling' ? Zap : Dices;
                return (
                  <Card key={item.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <Badge variant="outline" className="text-[8px] uppercase tracking-widest font-black mb-1">{item.type}</Badge>
                            <h3 className="font-bold text-slate-800 line-clamp-1">{item.title}</h3>
                          </div>
                        </div>
                        <Badge className={item.active ? "bg-green-500" : "bg-slate-300"}>{item.active ? "Live" : "Draft"}</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                          Stake: <span className="text-primary font-mono">₦{item.stake}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingId(item.id); setFormData(item); setIsModalOpen(true); }} className="h-8 w-8 text-slate-400 hover:text-primary">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-slate-400 hover:text-rose-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="engine" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
              <div>
                <h2 className="text-xl font-bold">Built-in Game Logic</h2>
                <p className="text-xs text-slate-500">Configure stakes and payouts for the fixed game engine.</p>
              </div>
              <Button onClick={handleSaveGameConfig} disabled={isSubmitting} className="rounded-xl font-bold gap-2 h-12 px-8">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Sync Engine Settings
              </Button>
            </div>

            <div className="grid gap-6">
              {/* Color Spin Config */}
              <Card className="border-none shadow-md rounded-3xl overflow-hidden bg-white">
                <CardHeader className="bg-indigo-50 border-b border-indigo-100 flex flex-row items-center justify-between p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm"><Palette className="w-5 h-5" /></div>
                    <CardTitle className="text-lg">Color Spin</CardTitle>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm" className="rounded-lg h-8 gap-1.5 border-indigo-200 text-indigo-600"><Link href="/dashboard/games/history?game=colorspin"><History className="w-3.5 h-3.5" /> History</Link></Button>
                    <Switch checked={gamesConfig.colorspin.enabled} onCheckedChange={(v) => setGamesConfig({...gamesConfig, colorspin: {...gamesConfig.colorspin, enabled: v}})} />
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Minimum Stake (₦)</Label>
                      <Input type="number" value={gamesConfig.colorspin.minStake} onChange={(e) => setGamesConfig({...gamesConfig, colorspin: {...gamesConfig.colorspin, minStake: parseFloat(e.target.value) || 0}})} className="rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label>House Edge Probability (0 to 1)</Label>
                      <Input type="number" step="0.01" value={gamesConfig.colorspin.houseEdge} onChange={(e) => setGamesConfig({...gamesConfig, colorspin: {...gamesConfig.colorspin, houseEdge: parseFloat(e.target.value) || 0}})} className="rounded-xl h-12" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs uppercase font-black text-slate-400">Payout Multipliers</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['red', 'blue', 'green', 'yellow'].map((color) => (
                        <div key={color} className="space-y-1.5">
                          <Label className="text-[10px] uppercase font-bold capitalize">{color}</Label>
                          <Input 
                            type="number" 
                            step="0.1" 
                            value={gamesConfig.colorspin.multipliers[color]} 
                            onChange={(e) => setGamesConfig({
                              ...gamesConfig, 
                              colorspin: {
                                ...gamesConfig.colorspin, 
                                multipliers: { ...gamesConfig.colorspin.multipliers, [color]: parseFloat(e.target.value) || 0 }
                              }
                            })} 
                            className="h-10 rounded-xl font-bold" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tic Tac Toe Config */}
              <Card className="border-none shadow-md rounded-3xl overflow-hidden bg-white">
                <CardHeader className="bg-rose-50 border-b border-rose-100 flex flex-row items-center justify-between p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-rose-600 shadow-sm"><Circle className="w-5 h-5" /></div>
                    <CardTitle className="text-lg">X and O: Extreme</CardTitle>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm" className="rounded-lg h-8 gap-1.5 border-rose-200 text-rose-600"><Link href="/dashboard/games/history?game=tictactoe"><History className="w-3.5 h-3.5" /> History</Link></Button>
                    <Switch checked={gamesConfig.tictactoe.enabled} onCheckedChange={(v) => setGamesConfig({...gamesConfig, tictactoe: {...gamesConfig.tictactoe, enabled: v}})} />
                  </div>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Minimum Stake (₦)</Label>
                    <Input type="number" value={gamesConfig.tictactoe.minStake} onChange={(e) => setGamesConfig({...gamesConfig, tictactoe: {...gamesConfig.tictactoe, minStake: parseFloat(e.target.value) || 0}})} className="rounded-xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label>Win Multiplier</Label>
                    <Input type="number" step="0.1" value={gamesConfig.tictactoe.payoutMultiplier} onChange={(e) => setGamesConfig({...gamesConfig, tictactoe: {...gamesConfig.tictactoe, payoutMultiplier: parseFloat(e.target.value) || 0}})} className="rounded-xl h-12" />
                  </div>
                </CardContent>
              </Card>

              {/* Speed Ludo Config */}
              <Card className="border-none shadow-md rounded-3xl overflow-hidden bg-white">
                <CardHeader className="bg-orange-50 border-b border-orange-100 flex flex-row items-center justify-between p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-600 shadow-sm"><Flag className="w-5 h-5" /></div>
                    <CardTitle className="text-lg">Speed Ludo</CardTitle>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm" className="rounded-lg h-8 gap-1.5 border-orange-200 text-orange-600"><Link href="/dashboard/games/history?game=speedludo"><History className="w-3.5 h-3.5" /> History</Link></Button>
                    <Switch checked={gamesConfig.speedludo.enabled} onCheckedChange={(v) => setGamesConfig({...gamesConfig, speedludo: {...gamesConfig.speedludo, enabled: v}})} />
                  </div>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Minimum Stake (₦)</Label>
                    <Input type="number" value={gamesConfig.speedludo.minStake} onChange={(e) => setGamesConfig({...gamesConfig, speedludo: {...gamesConfig.speedludo, minStake: parseFloat(e.target.value) || 0}})} className="rounded-xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label>Win Multiplier</Label>
                    <Input type="number" step="0.1" value={gamesConfig.speedludo.payoutMultiplier} onChange={(e) => setGamesConfig({...gamesConfig, speedludo: {...gamesConfig.speedludo, payoutMultiplier: parseFloat(e.target.value) || 0}})} className="rounded-xl h-12" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Game Content" : "Add Game Content"}</DialogTitle>
            <DialogDescription>Configure the rules and rewards for this game session.</DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Game Category</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trivia">Trivia Pool</SelectItem>
                    <SelectItem value="predictor">Viral Predictor</SelectItem>
                    <SelectItem value="labeling">Labeling Sprint</SelectItem>
                    <SelectItem value="raffle">Referral Raffle (Challenge)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{formData.type === 'raffle' ? 'Entry Fee (₦)' : 'Stake (₦)'}</Label>
                <Input type="number" value={formData.stake} onChange={(e) => setFormData({...formData, stake: parseFloat(e.target.value) || 0})} className="h-12 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Session Title</Label>
              <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Weekly Viral Quiz" className="h-12 rounded-xl" />
            </div>

            {formData.type === 'raffle' && (
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-blue-800 uppercase text-[10px] tracking-widest">Raffle Challenge Config</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Referral Target (Users)</Label>
                    <Input type="number" value={formData.referralTarget} onChange={(e) => setFormData({...formData, referralTarget: parseInt(e.target.value) || 0})} className="h-12 rounded-xl bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Prize Amount (₦)</Label>
                    <Input type="number" value={formData.reward} onChange={(e) => setFormData({...formData, reward: parseFloat(e.target.value) || 0})} className="h-12 rounded-xl bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Challenge Duration (Days)</Label>
                    <Input type="number" value={formData.durationDays} onChange={(e) => setFormData({...formData, durationDays: parseInt(e.target.value) || 0})} className="h-12 rounded-xl bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until (Catalog Expiry)</Label>
                    <Input type="date" value={formData.validUntil} onChange={(e) => setFormData({...formData, validUntil: e.target.value})} className="h-12 rounded-xl bg-white" />
                  </div>
                </div>
              </div>
            )}

            {formData.type === 'trivia' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-slate-400">Questions ({formData.questions?.length || 0})</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addTriviaQuestion} className="h-8 rounded-lg gap-1.5"><PlusCircle className="w-3.5 h-3.5" /> Add Question</Button>
                </div>
                {formData.questions?.map((q: any, i: number) => (
                  <Card key={i} className="p-4 bg-slate-50 dark:bg-slate-800 border-none relative space-y-3">
                    <button onClick={() => removeTriviaQuestion(i)} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500"><X className="w-4 h-4" /></button>
                    <Input value={q.q} onChange={(e) => updateTriviaQuestion(i, 'q', e.target.value)} placeholder="Question text" />
                    <div className="grid grid-cols-2 gap-2">
                      {q.a.map((opt: string, j: number) => (
                        <div key={j} className="flex gap-2">
                          <Input 
                            value={opt} 
                            onChange={(e) => {
                              const newA = [...q.a];
                              newA[j] = e.target.value;
                              updateTriviaQuestion(i, 'a', newA);
                            }} 
                            placeholder={`Option ${j+1}`} 
                            className={q.c === j ? 'border-primary ring-1 ring-primary' : ''} 
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-[10px] uppercase font-bold text-slate-400">Correct Index:</Label>
                      <Select value={q.c.toString()} onValueChange={(v) => updateTriviaQuestion(i, 'c', parseInt(v))}>
                        <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {q.a.map((_: any, idx: number) => (
                            <SelectItem key={idx} value={idx.toString()}>Option {idx + 1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {formData.type === 'predictor' && (
              <div className="space-y-4">
                <Label>Win Multiplier / Odds (e.g. 1.8)</Label>
                <Input type="number" step="0.1" value={formData.odds} onChange={(e) => setFormData({...formData, odds: parseFloat(e.target.value) || 0})} className="h-12 rounded-xl" />
              </div>
            )}

            {formData.type === 'labeling' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-slate-400">Tasks ({formData.tasks?.length || 0})</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLabelingTask} className="h-8 rounded-lg gap-1.5"><PlusCircle className="w-3.5 h-3.5" /> Add Task</Button>
                </div>
                {formData.tasks?.map((t: any, i: number) => (
                  <Card key={i} className="p-4 bg-slate-50 dark:bg-slate-800 border-none relative space-y-3">
                    <button onClick={() => removeLabelingTask(i)} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500"><X className="w-4 h-4" /></button>
                    <Input value={t.q} onChange={(e) => updateLabelingTask(i, 'q', e.target.value)} placeholder="Instruction (e.g. Is this a cat?)" />
                    <Input value={t.img} onChange={(e) => updateLabelingTask(i, 'img', e.target.value)} placeholder="Image URL" />
                    <div className="flex items-center gap-3">
                      <Label className="text-[10px] uppercase font-bold text-slate-400">Correct Answer:</Label>
                      <Select value={t.a} onValueChange={(v) => updateLabelingTask(i, 'a', v)}>
                        <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YES">YES</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Description / Instructions</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="rounded-xl min-h-[80px]" />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <div className="space-y-0.5">
                <Label className="font-bold">Active Status</Label>
                <p className="text-[10px] text-slate-400">If disabled, earners won't see this session.</p>
              </div>
              <Switch checked={formData.active} onCheckedChange={(v) => setFormData({...formData, active: v})} />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSaveCatalog} disabled={isSubmitting} className="w-full h-12 rounded-xl font-bold gap-2">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? "Update Content" : "Publish to Catalog"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
