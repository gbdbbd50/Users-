
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Building2, 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  CreditCard, 
  Smartphone
} from "lucide-react";
import { collection, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const NIGERIAN_BANKS = [
  { name: "OPay (Digital Bank)", code: "999992" },
  { name: "PalmPay (Digital Bank)", code: "999991" },
  { name: "Moniepoint (MFB)", code: "50515" },
  { name: "Kuda Bank", code: "50211" },
  { name: "FairMoney MFB", code: "51318" },
  { name: "VFD Microfinance Bank (V Bank)", code: "566" },
  { name: "Access Bank", code: "044" },
  { name: "First Bank", code: "011" },
  { name: "GTBank", code: "058" },
  { name: "UBA", code: "033" },
  { name: "Zenith Bank", code: "057" },
  { name: "Fidelity Bank", code: "070" },
  { name: "Stanbic IBTC", code: "039" },
  { name: "Wema Bank", code: "035" },
  { name: "Union Bank", code: "032" },
  { name: "Sterling Bank", code: "030" },
  { name: "Polaris Bank", code: "076" },
  { name: "Keystone Bank", code: "082" },
  { name: "Ecobank", code: "050" },
  { name: "Unity Bank", code: "215" }
].sort((a, b) => a.name.localeCompare(b.name));

export default function BankAccountsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    accountNumber: "",
    accountName: "",
    bankName: "",
    bankCode: ""
  });

  const bankQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "bankAccounts");
  }, [db, user]);

  const { data: bankAccounts, loading: banksLoading } = useCollection<any>(bankQuery);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !formData.accountNumber || !formData.accountName || !formData.bankName) {
      toast({ variant: "destructive", title: "Missing Fields", description: "All fields are required." });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "users", user.uid, "bankAccounts", editingId), formData);
        toast({ title: "Account Updated", description: "Your bank details have been saved." });
      } else {
        await addDoc(collection(db, "users", user.uid, "bankAccounts"), formData);
        toast({ title: "Account Added", description: "New bank account linked successfully." });
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to save bank account." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !user || !confirm("Delete this bank account?")) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "bankAccounts", id));
      toast({ title: "Deleted", description: "Bank account removed." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete account." });
    }
  };

  const handleEdit = (bank: any) => {
    setEditingId(bank.id);
    setFormData({
      accountNumber: bank.accountNumber,
      accountName: bank.accountName,
      bankName: bank.bankName,
      bankCode: bank.bankCode || ""
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ accountNumber: "", accountName: "", bankName: "", bankCode: "" });
    setEditingId(null);
  };

  if (authLoading || banksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="container px-4 py-8 mx-auto max-w-lg">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="gap-2" disabled={isSubmitting}>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary mb-1">Bank Details</h1>
            <p className="text-slate-600 text-sm">Commercial and Digital/Fintech banks supported.</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setIsModalOpen(true); }} 
            className="bg-primary hover:bg-primary/90 rounded-xl"
            disabled={isSubmitting}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Bank
          </Button>
        </div>

        <div className="space-y-4">
          {bankAccounts?.length === 0 ? (
            <Card className="border-none shadow-sm bg-white p-12 text-center rounded-3xl">
              <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No bank accounts added yet.</p>
              <Button 
                variant="link" 
                onClick={() => setIsModalOpen(true)}
                className="text-primary font-bold mt-2"
              >
                Add your first account
              </Button>
            </Card>
          ) : (
            bankAccounts?.map((bank: any) => (
              <Card key={bank.id} className="border-none shadow-md bg-white rounded-2xl overflow-hidden group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-primary">
                      {bank.bankName.includes("Digital") || bank.bankName.includes("MFB") ? (
                        <Smartphone className="w-6 h-6" />
                      ) : (
                        <CreditCard className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{bank.bankName}</p>
                      <p className="text-xs text-slate-500 font-medium">{bank.accountNumber} • {bank.accountName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(bank)} className="h-8 w-8 text-slate-400 hover:text-primary">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(bank.id)} className="h-8 w-8 text-slate-400 hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Bank Account" : "Add Bank Account"}</DialogTitle>
            <DialogDescription>Link any Nigerian commercial or digital bank for withdrawals.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Select Bank</Label>
              <Select 
                onValueChange={(v) => {
                  const selected = NIGERIAN_BANKS.find(b => b.name === v);
                  setFormData({...formData, bankName: v, bankCode: selected?.code || ""});
                }} 
                value={formData.bankName}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Choose a bank (includes Fintechs)" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_BANKS.map(bank => (
                    <SelectItem key={bank.code} value={bank.name}>{bank.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input 
                id="accountNumber" 
                placeholder="0123456789" 
                maxLength={10}
                value={formData.accountNumber}
                onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                className="h-12 rounded-xl"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input 
                id="accountName" 
                placeholder="Name on your bank account" 
                value={formData.accountName}
                onChange={(e) => setFormData({...formData, accountName: e.target.value})}
                className="h-12 rounded-xl"
                required
                disabled={isSubmitting}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-primary rounded-xl font-bold">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Bank Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
