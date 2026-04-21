
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TaskCardProps {
  task: any;
  profile: any;
}

const UNLIMITED_VAL = 999999;

export function TaskCard({ task, profile }: TaskCardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handlePerform = () => {
    if (!profile) return;

    // Check Daily Limit
    const maxDaily = profile.maxDailyTasks || 0;
    if (maxDaily < UNLIMITED_VAL && profile.dailyTaskCount >= maxDaily) {
      toast({ 
        variant: "destructive", 
        title: "Daily Limit Reached", 
        description: `Your current plan allows only ${maxDaily} tasks per day. Please upgrade.` 
      });
      return;
    }

    // Check Monthly Limit
    const maxMonthly = profile.maxMonthlyTasks || 0;
    if (maxMonthly < UNLIMITED_VAL && profile.monthlyTaskCount >= maxMonthly) {
      toast({ 
        variant: "destructive", 
        title: "Monthly Limit Reached", 
        description: `Your current plan allows only ${maxMonthly} tasks per month. Please upgrade.` 
      });
      return;
    }

    // Check Total Capacity
    const maxTotal = profile.maxTotalTasks || 0;
    if (maxTotal < UNLIMITED_VAL && profile.totalTaskCount >= maxTotal) {
      toast({ 
        variant: "destructive", 
        title: "Plan Capacity Exhausted", 
        description: `You have reached the total capacity (${maxTotal}) for this plan. Please upgrade.` 
      });
      return;
    }

    // Proceed to task detail page
    router.push(`/tasks/${task.id}`);
  };

  return (
    <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-500 border-none bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-md flex flex-col h-full">
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={task.imageUrl || "https://picsum.photos/seed/task/600/400"}
          alt={task.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700"
          data-ai-hint="task image"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge variant="secondary" className="bg-white/95 dark:bg-slate-800/95 text-primary font-bold shadow-sm backdrop-blur-sm border-none">
            {task.platform}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-2 pt-6 px-6">
        <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-primary transition-colors">
          {task.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6 px-6 flex-grow">
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2rem] leading-relaxed mb-4">
          {task.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reward</span>
            <span className="text-xl font-black text-primary">₦{task.reward?.toLocaleString()}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Available</span>
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">{(task.quantity || 0) - (task.completedSlots || 0)} Slots</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-6 pb-6 pt-0">
        <Button 
          onClick={handlePerform}
          className="w-full h-12 bg-slate-900 dark:bg-slate-800 hover:bg-primary text-white font-bold rounded-2xl shadow-lg transition-all gap-2"
        >
          Perform Task <ArrowRight className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
