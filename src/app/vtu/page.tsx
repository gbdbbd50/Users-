
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  Smartphone, 
  Wifi, 
  Tv, 
  Zap, 
  ArrowLeft, 
  ChevronRight, 
  Loader2, 
  ShieldCheck,
  CreditCard,
  Building2,
  Clock,
  History,
  Lock,
  Wallet
} from "lucide-react";
import { doc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const VTU_CATEGORIES = [
  { id: 'airtime', name: 'Airtime Top-up', icon: Smartphone, color: 'bg-blue-100 text-blue-600', description: 'Recharge any network instantly.' },
  { id: 'data', name: 'Data Bundles', icon: Wifi, color: 'bg-purple-100 text-purple-600', description: 'High-speed internet for all networks.' },
  { id: 'cable', name: 'Cable TV', icon: Tv, color: 'bg-orange-100 text-orange-600', description: 'DSTV, GOtv & StarTimes.' },
  { id: 'electricity', name: 'Electricity', icon: Zap, color: 'bg-amber-100 text-amber-600', description: 'Pay utility bills across Nigeria.' },
];

export default function VTUServicesPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedService, setSelectedService] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const profileRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(profileRef);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const handlePurchase = () => {
    setIsProcessing(true);
    // Mock processing delay
    setTimeout(() => {
      setIsProcessing(false);
      setSelectedService(null);
      toast({
        variant: "destructive",
        title: "Service Unavailable",
        description: "VTU purchasing is temporarily disabled for maintenance. Please check back later."
      });
    }, 2000);
  };

  if (authLoading || profileLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-12">
      <div className="container px-4 py-8 mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /> Back</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-xl gap-2 h-9">
            <Link href="/history"><History className="w-4 h-4" /> Bill History</Link>
          </Button>
        </div>

        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Digital Services</h1>
          <p className="text-slate-500 text-sm">Purchase airtime, data and pay bills using your TaskHome balance.</p>
        </div>

        <Card className="mb-8 border-none shadow-md bg-white dark:bg-slate-900 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Available Wallet</p>
              <h2 className="text-2xl font-black text-primary">₦{profile?.balance?.toLocaleString() || "0"}</h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          {VTU_CATEGORIES.map((cat) => (
            <Card 
              key={cat.id} 
              className="border-none shadow-sm hover:shadow-xl transition-all rounded-3xl overflow-hidden cursor-pointer bg-white dark:bg-slate-900 group"
              onClick={() => setSelectedService(cat)}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${cat.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                    <cat.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">{cat.name}</h3>
                    <p className="text-xs text-slate-400">{cat.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 bg-primary/5 dark:bg-primary/10 border border-primary/10 p-6 rounded-[2rem] flex gap-4">
          <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
          <div>
            <p className="text-xs font-bold text-primary">Secure Bill Payment</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
              All transactions are encrypted. Your wallet balance is used directly for instant fulfillment. 24/7 service availability.
            </p>
          </div>
        </div>
      </div>

      {/* Service Modal */}
      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          {selectedService && (
            <>
              <div className={`p-8 text-center text-white ${selectedService.color.split(' ')[1]}`}>
                <selectedService.icon className="w-12 h-12 mx-auto mb-4" />
                <DialogTitle className="text-2xl font-bold">{selectedService.name}</DialogTitle>
                <DialogDescription className="text-white/80 text-sm">Purchase instantly with your wallet.</DialogDescription>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">Choose Provider</Label>
                    <Select>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select Network/Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mtn">MTN Nigeria</SelectItem>
                        <SelectItem value="airtel">Airtel Nigeria</SelectItem>
                        <SelectItem value="glo">Glo Nigeria</SelectItem>
                        <SelectItem value="9mobile">9mobile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">Target Number / ID</Label>
                    <Input placeholder="080 0000 0000" className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">Amount (₦)</Label>
                    <Input type="number" placeholder="500" className="h-12 rounded-xl font-bold" />
                  </div>
                </div>
                <Button 
                  onClick={handlePurchase} 
                  disabled={isProcessing}
                  className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl font-black text-lg shadow-lg"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "PROCEED TO PAY"}
                </Button>
                <div className="flex items-center justify-center gap-2">
                  <Lock className="w-3 h-3 text-slate-300" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Secured Transaction</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
