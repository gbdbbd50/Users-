
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Briefcase, 
  ArrowLeft, 
  Search, 
  Loader2, 
  Building2, 
  MapPin, 
  DollarSign, 
  CheckCircle2,
  Lock,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function JobBoardPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const userProfileRef = useMemoFirebase(() => user && db ? doc(db, "users", user.uid) : null, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  const jobsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "jobs"), where("status", "==", "ACTIVE"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: jobs, loading: jobsLoading } = useCollection<any>(jobsQuery);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading || profileLoading || jobsLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" /></div>;

  const isUnverified = profile?.status !== 'VERIFIED';
  const filteredJobs = jobs?.filter(j => j.title.toLowerCase().includes(searchTerm.toLowerCase()) || j.company.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-12">
      <div className="container px-4 py-8 mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /> Dashboard</Link>
          </Button>
          <div className="relative w-48 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search jobs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-10 rounded-xl bg-white" />
          </div>
        </div>

        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-blue-600 text-white mb-4 shadow-lg shadow-blue-500/20">
            <Briefcase className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Job Board</h1>
          <p className="text-slate-500 text-sm">Find long-term digital roles and careers.</p>
        </div>

        {isUnverified ? (
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white p-12 text-center mb-10">
            <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Board Restricted</h2>
            <p className="text-slate-400 mb-8 max-w-xs mx-auto leading-relaxed">Only verified members can view and apply for high-value job vacancies.</p>
            <Button asChild className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold text-lg shadow-lg">
              <Link href="/upgrade">Activate Your Account</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs?.map((job: any) => (
              <Card key={job.id} className="border-none shadow-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden hover:shadow-xl transition-all group">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Building2 className="w-7 h-7 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{job.title}</h3>
                          <Badge variant="outline" className="text-[9px] uppercase font-bold">{job.type}</Badge>
                        </div>
                        <p className="font-bold text-blue-600 mb-2">{job.company}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                          <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> ₦{job.salary}/mo</span>
                        </div>
                      </div>
                    </div>
                    <Button asChild className="h-12 px-8 rounded-xl bg-slate-900 dark:bg-slate-800 font-bold group-hover:bg-blue-600 transition-colors">
                      <Link href={`/jobs/${job.id}`}>View Details <ChevronRight className="ml-2 w-4 h-4" /></Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {(!filteredJobs || filteredJobs.length === 0) && (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                <Briefcase className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">No vacancies found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
