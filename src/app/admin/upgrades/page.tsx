
"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  ArrowUpCircle, 
  Loader2, 
  Search, 
  User, 
  History,
  CreditCard
} from "lucide-react";
import { collection, query, orderBy } from "firebase/firestore";
import { SafeDate } from "@/components/SafeDate";
import { Input } from "@/components/ui/input";

export default function AdminUpgradesAuditPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const upgradesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "upgrades"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: upgrades, loading: upgradesLoading } = useCollection<any>(upgradesQuery);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const filtered = upgrades?.filter(u => 
    u.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.planName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || upgradesLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="container px-4 py-8 mx-auto max-w-5xl">
        <div className="mb-6"><Button asChild variant="ghost" size="sm" className="gap-2"><Link href="/admin"><ArrowLeft className="w-4 h-4" /> Admin Hub</Link></Button></div>

        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
              <ArrowUpCircle className="w-8 h-8" /> Upgrade Audit
            </h1>
            <p className="text-slate-600 text-sm mt-1">Review all membership transitions and payments.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search user or plan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-11 rounded-xl bg-white border-none shadow-sm" />
          </div>
        </div>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="px-6 font-bold text-[10px] uppercase">User</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase">Plan Tier</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase">Payment</TableHead>
                  <TableHead className="text-right px-6 font-bold text-[10px] uppercase">Activated At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.map((upg: any) => (
                  <TableRow key={upg.id} className="hover:bg-slate-50/50">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User className="w-4 h-4" /></div>
                        <div><p className="text-sm font-bold">{upg.userName}</p><p className="text-[10px] text-slate-400 font-mono">{upg.userId.slice(-8)}</p></div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="font-bold text-[10px] uppercase">{upg.planName}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <p className="text-sm font-black text-primary">₦{upg.amount?.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{upg.reference || 'SYSTEM'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <p className="text-[10px] font-bold"><SafeDate date={upg.createdAt} /></p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(!filtered || filtered.length === 0) && (
              <div className="text-center py-24"><History className="w-12 h-12 text-slate-200 mx-auto mb-4" /><p className="text-slate-400 font-bold">No upgrade records found.</p></div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
