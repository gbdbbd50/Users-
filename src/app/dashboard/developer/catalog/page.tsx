
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  LayoutGrid, 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  ArrowLeft, 
  PlusCircle,
  Save,
  Globe,
  Settings2,
  ChevronRight,
  MoreVertical
} from "lucide-react";
import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function CatalogManagerPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentPlatform, setCurrentPlatform] = useState<any>(null);
  const [editingTypeIndex, setEditingTypeIndex] = useState<number | null>(null);

  const [platformName, setPlatformName] = useState("");
  const [typeName, setTypeName] = useState("");
  const [advertiserPrice, setAdvertiserPrice] = useState("");
  const [earnerPrice, setEarnerPrice] = useState("");

  const catalogQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "catalog"), orderBy("name", "asc"));
  }, [db]);

  const { data: platforms, loading: catalogLoading } = useCollection<any>(catalogQuery);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const handleSavePlatform = async () => {
    if (!db || !platformName) return;
    setIsSubmitting(true);
    try {
      if (currentPlatform) {
        updateDoc(doc(db, "catalog", currentPlatform.id), { name: platformName });
        toast({ title: "Platform Updated" });
      } else {
        addDoc(collection(db, "catalog"), { name: platformName, types: [] });
        toast({ title: "Platform Added" });
      }
      setIsPlatformModalOpen(false);
      resetPlatformForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlatform = (id: string) => {
    if (!db || !confirm("Delete this platform and all its types?")) return;
    
    deleteDoc(doc(db, "catalog", id))
      .then(() => {
        toast({ title: "Platform Deleted" });
      })
      .catch((e: any) => {
        toast({ variant: "destructive", title: "Error", description: e.message });
      });
  };

  const handleSaveType = async () => {
    if (!db || !currentPlatform || !typeName || !advertiserPrice || !earnerPrice) return;
    setIsSubmitting(true);
    try {
      const updatedTypes = [...(currentPlatform.types || [])];
      const newType = {
        name: typeName,
        advertiserPrice: parseFloat(advertiserPrice),
        earnerPrice: parseFloat(earnerPrice)
      };

      if (editingTypeIndex !== null) {
        updatedTypes[editingTypeIndex] = newType;
      } else {
        updatedTypes.push(newType);
      }

      updateDoc(doc(db, "catalog", currentPlatform.id), { types: updatedTypes });
      toast({ title: editingTypeIndex !== null ? "Type Updated" : "Type Added" });
      setIsTypeModalOpen(false);
      resetTypeForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteType = (platform: any, index: number) => {
    if (!db || !confirm("Delete this task type?")) return;
    
    const updatedTypes = platform.types.filter((_: any, i: number) => i !== index);
    updateDoc(doc(db, "catalog", platform.id), { types: updatedTypes })
      .then(() => {
        toast({ title: "Type Removed" });
      })
      .catch((e: any) => {
        toast({ variant: "destructive", title: "Error", description: e.message });
      });
  };

  const resetPlatformForm = () => {
    setPlatformName("");
    setCurrentPlatform(null);
  };

  const resetTypeForm = () => {
    setTypeName("");
    setAdvertiserPrice("");
    setEarnerPrice("");
    setEditingTypeIndex(null);
  };

  if (authLoading || catalogLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="container px-4 py-8 mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/dashboard/developer">
              <ArrowLeft className="w-4 h-4" /> Console
            </Link>
          </Button>
          <Button 
            onClick={() => { resetPlatformForm(); setIsPlatformModalOpen(true); }}
            className="rounded-xl h-10 gap-2 bg-primary shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Add Platform
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-primary" /> Offerings Catalog
          </h1>
          <p className="text-slate-500 text-sm">Define what advertisers can buy and earners can perform.</p>
        </div>

        <div className="space-y-6">
          {platforms?.map((platform: any) => (
            <Card key={platform.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between p-6">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">{platform.name}</CardTitle>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{platform.types?.length || 0} Task Types</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => { 
                      setCurrentPlatform(platform); 
                      setPlatformName(platform.name); 
                      setIsPlatformModalOpen(true); 
                    }}
                    className="h-9 w-9 rounded-xl text-slate-400 hover:text-primary"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeletePlatform(platform.id)}
                    className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid gap-3">
                  {platform.types?.map((type: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                      <div className="flex-grow">
                        <p className="text-sm font-bold text-slate-800">{type.name}</p>
                        <div className="flex gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Adv:</span>
                            <span className="text-[10px] font-mono font-bold text-primary">₦{type.advertiserPrice}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Earn:</span>
                            <span className="text-[10px] font-mono font-bold text-blue-600">₦{type.earnerPrice}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setCurrentPlatform(platform);
                            setEditingTypeIndex(index);
                            setTypeName(type.name);
                            setAdvertiserPrice(type.advertiserPrice.toString());
                            setEarnerPrice(type.earnerPrice.toString());
                            setIsTypeModalOpen(true);
                          }}
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteType(platform, index)}
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="ghost" 
                    onClick={() => { 
                      setCurrentPlatform(platform); 
                      resetTypeForm(); 
                      setIsTypeModalOpen(true); 
                    }}
                    className="w-full h-12 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 font-bold gap-2"
                  >
                    <PlusCircle className="w-4 h-4" /> Add Task Type
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!platforms || platforms.length === 0) && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <Settings2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No catalog entries found. Start by adding a platform.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isPlatformModalOpen} onOpenChange={setIsPlatformModalOpen}>
        <DialogContent className="rounded-3xl border-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentPlatform ? "Edit Platform" : "Add New Platform"}</DialogTitle>
            <DialogDescription>Create a container for task types (e.g. WhatsApp, TikTok).</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input 
                value={platformName} 
                onChange={(e) => setPlatformName(e.target.value)}
                placeholder="e.g. Instagram"
                className="h-12 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSavePlatform} disabled={isSubmitting || !platformName} className="w-full h-12 rounded-xl font-bold gap-2">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4" />}
              Save Platform
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTypeModalOpen} onOpenChange={setIsTypeModalOpen}>
        <DialogContent className="rounded-3xl border-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTypeIndex !== null ? "Edit Task Type" : "Add Task Type"}</DialogTitle>
            <DialogDescription>Define pricing for {currentPlatform?.name}.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Type Name</Label>
              <Input 
                value={typeName} 
                onChange={(e) => setTypeName(e.target.value)}
                placeholder="e.g. Follow & Like"
                className="h-12 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Advertiser Price (₦)</Label>
                <Input 
                  type="number"
                  value={advertiserPrice} 
                  onChange={(e) => setAdvertiserPrice(e.target.value)}
                  placeholder="30"
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Earner Price (₦)</Label>
                <Input 
                  type="number"
                  value={earnerPrice} 
                  onChange={(e) => setEarnerPrice(e.target.value)}
                  placeholder="20"
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveType} disabled={isSubmitting || !typeName || !advertiserPrice || !earnerPrice} className="w-full h-12 rounded-xl font-bold gap-2">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4" />}
              Save Task Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
