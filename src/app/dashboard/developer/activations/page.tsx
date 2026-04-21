
"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  UserCheck, 
  Loader2, 
  CreditCard, 
  Smartphone, 
  ShieldCheck, 
  Activity,
  History,
  Search
} from "lucide-react";
import { collection, query, where, orderBy } from "firebase/firestore";
import { SafeDate } from "@/components/SafeDate";
import { Input } from "@/components/ui/input";

export default function ActivationsAuditPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const activationsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "deposits"), 
      where("type", "==", "ACTIVATION"),
      orderBy("createdAt", "desc")
    );
  }, [db]);

  const usersQuery = useMemoFirebase(() => db ? collection(db, "users") : null, [db]);

  const { data: activations, loading: activationsLoading } = useCollection<any>(activationsQuery);
  const { data: allUsers } = useCollection<any>(usersQuery);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading || activationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'PAYSTACK': return <CreditCard className="w-3.5 h-3.5" />;
      case 'MANUAL': return <Smartphone className="w-3.5 h-3.5" />;
      case 'AUTHORITY': return <ShieldCheck className="w-3.5 h-3.5" />;
      default: return <Activity className="w-3.5 h-3.5" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'PAYSTACK': return "bg-blue-50 text-blue-600 border-blue-100";
      case 'MANUAL': return "bg-amber-50 text-amber-600 border-amber-100";
      case 'AUTHORITY': return "bg-purple-50 text-purple-600 border-purple-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const filteredActivations = activations?.filter((act: any) => {
    const userData = allUsers?.find(u => u.id === act.userId);
    const combined = `${userData?.displayName} ${userData?.email} ${act.reference}`.toLowerCase();
    return combined.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="container px-4 py-8 mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/dashboard/developer">
              <ArrowLeft className="w-4 h-4" /> Console
            </Link>
          </Button>
        </div>

        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-primary" /> Activation Matrix
            </h1>
            <p className="text-slate-500 text-sm">Audit trail of verified member onboarding.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search user or ref..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-white border-none shadow-sm"
            />
          </div>
        </div>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="px-6 font-bold text-[10px] uppercase">User Identity</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase">Method</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase">Reference</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase">Status</TableHead>
                  <TableHead className="text-right px-6 font-bold text-[10px] uppercase">Processed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivations?.map((act: any) => {
                  const userData = allUsers?.find(u => u.id === act.userId);
                  return (
                    <TableRow key={act.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-800">{userData?.displayName || 'Unknown'}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                          {userData?.email || userData?.phoneNumber || act.userId.slice(-8)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`flex items-center gap-1.5 w-fit font-bold text-[9px] uppercase h-6 px-2 ${getMethodColor(act.method)}`}>
                          {getMethodIcon(act.method)}
                          {act.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-tighter">
                          {act.reference || '---'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={act.status === 'APPROVED' ? 'default' : 'outline'} className="text-[9px] uppercase px-2">
                          {act.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex flex-col items-end">
                          <p className="text-[10px] font-bold text-slate-700">
                            <SafeDate date={act.createdAt} />
                          </p>
                          <p className="text-[9px] text-slate-400 uppercase font-medium">Verified</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {(!filteredActivations || filteredActivations.length === 0) && (
              <div className="text-center py-32">
                <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium text-sm">No activation records found matching criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
