
"use client";

import { useEffect, useState } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, CheckCircle, XCircle, Eye, Loader2, ArrowLeft, BarChart3, TrendingUp, Users, FileCheck } from "lucide-react";
import { collection, doc, updateDoc, query, orderBy, where } from "firebase/firestore";
import { SafeDate } from "@/components/SafeDate";

export default function AdminSubmissionsPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const subsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "submissions"));
  }, [db]);

  const allUsersQuery = useMemoFirebase(() => db ? collection(db, "users") : null, [db]);

  const { data: rawSubmissions, loading: subsLoading } = useCollection<any>(subsQuery);
  const { data: allUsers } = useCollection<any>(allUsersQuery);

  // Sorting in memory
  const submissions = [...(rawSubmissions || [])].sort((a, b) => {
    const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(a.submittedAt);
    const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(b.submittedAt);
    return dateB - dateA;
  });

  const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    if (!db) return;
    setProcessingId(`${id}-${action}`);
    
    try {
      await updateDoc(doc(db, "submissions", id), {
        status: action,
        reviewedAt: new Date().toISOString(),
        reviewerId: user?.uid
      });

      toast({
        title: `Submission ${action.toLowerCase()}`,
        description: `Status updated to ${action}.`
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Could not update submission status."
      });
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || subsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = submissions?.filter((s: any) => s.status === 'PENDING').length || 0;
  const approvedCount = submissions?.filter((s: any) => s.status === 'APPROVED').length || 0;

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href="/admin">
            <ArrowLeft className="w-4 h-4" /> Back to Admin Hub
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary mb-2">Admin Monitoring</h1>
          <p className="text-muted-foreground">Oversee platform health and review user submissions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" /> Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers?.length || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Growth: +12% this week</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <FileCheck className="w-4 h-4" /> Finalized Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-[10px] text-green-600 font-medium mt-1">Approval Rate: 88%</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Activity Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Stable</div>
            <p className="text-[10px] text-muted-foreground mt-1">Status: High Traffic</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5" /> Submissions Queue
          </h2>
          <Badge variant="outline" className="text-primary border-primary">
            {pendingCount} Pending Review
          </Badge>
        </div>

        <div className="grid gap-6">
          {submissions?.map((sub: any) => {
            const isPending = sub.status === 'PENDING';
            const isApproving = processingId === `${sub.id}-APPROVED`;
            const isRejecting = processingId === `${sub.id}-REJECTED`;

            return (
              <Card key={sub.id} className="border-none shadow-md overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">Task: {sub.taskId.slice(-8)}</CardTitle>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Submitted by {sub.userName} • <SafeDate date={sub.submittedAt} />
                    </div>
                  </div>
                  <Badge variant={isPending ? "outline" : "secondary"}>{sub.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Proof Provided</h4>
                    <p className="text-sm text-foreground italic">"{sub.description}"</p>
                  </div>
                </CardContent>
                {isPending && (
                  <CardFooter className="flex justify-end gap-3 border-t p-4">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      disabled={!!processingId}
                      onClick={() => handleAction(sub.id, 'REJECTED')}
                      className="gap-1"
                    >
                      {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Reject
                    </Button>
                    <Button 
                      size="sm" 
                      disabled={!!processingId}
                      onClick={() => handleAction(sub.id, 'APPROVED')}
                      className="bg-green-600 hover:bg-green-700 text-white gap-1"
                    >
                      {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Approve
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}

          {(!submissions || submissions.length === 0) && (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
              <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">No submissions in queue.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
