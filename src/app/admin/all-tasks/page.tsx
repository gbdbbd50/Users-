"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  LayoutGrid, 
  Loader2, 
  Search, 
  User, 
  ExternalLink, 
  TrendingUp
} from "lucide-react";
import { collection, query, orderBy } from "firebase/firestore";
import { SafeDate } from "@/components/SafeDate";
import { Progress } from "@/components/ui/progress";

export default function AdminAllTasksPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const tasksQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "tasks"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: tasks, loading: tasksLoading } = useCollection<any>(tasksQuery);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(task => {
      const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           task.advertiserName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

  if (authLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statuses = ["ALL", "PENDING", "ACTIVE", "PAUSED", "COMPLETED", "REJECTED", "CANCELLED"];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors">
      <div className="container px-4 py-8 mx-auto max-w-4xl">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4" /> Admin Hub
            </Link>
          </Button>
        </div>

        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary dark:text-primary-foreground flex items-center gap-3">
              <LayoutGrid className="w-8 h-8" /> Task Inventory
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Master oversight of all platform campaigns.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search campaigns..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-900 border-none shadow-sm w-full md:w-72"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
          {statuses.map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="rounded-full h-8 px-4 text-[10px] font-bold uppercase tracking-wider"
            >
              {status}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredTasks.map((task: any) => {
            const progress = ((task.completedSlots || 0) / (task.quantity || 1)) * 100;
            const statusColors: any = {
              ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
              PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
              PAUSED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
              COMPLETED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
              REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
              CANCELLED: "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-500",
            };

            return (
              <Card key={task.id} className="border-none shadow-md bg-white dark:bg-slate-900 rounded-2xl overflow-hidden group">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1 flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-[9px] font-bold uppercase ${statusColors[task.status] || ""}`}>
                            {task.status}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-medium">
                            <SafeDate date={task.createdAt} format="date" />
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary transition-colors">
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <User className="w-3 h-3" />
                          <span className="font-medium">{task.advertiserName || "Unknown"}</span>
                          <span className="text-[10px] opacity-50">• {task.platform}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Reward</p>
                        <p className="text-xl font-black text-primary dark:text-primary-foreground">₦{task.reward}</p>
                      </div>
                    </div>

                    <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border dark:border-slate-700">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Slots: {task.completedSlots || 0} / {task.quantity}</span>
                        <span>{Math.round(progress)}% Complete</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                      <div className="flex justify-between items-center pt-1">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3 text-blue-500" />
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            Budget: ₦{task.totalCost?.toLocaleString() || "0"}
                          </span>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="h-7 text-[10px] font-bold gap-1 text-primary">
                          <Link href={`/admin/tasks/${task.id}/submissions`}>
                            View Proofs <ExternalLink className="w-3 h-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed dark:border-slate-800">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <LayoutGrid className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold">No tasks found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
