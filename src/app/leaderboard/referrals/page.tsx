"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Crown, Star, Loader2, TrendingUp, Users } from "lucide-react";
import { collection, query, orderBy, limit, where } from "firebase/firestore";

export default function ReferralLeaderboardPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();

  const referralLeaderboardQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "users"),
      where("role", "==", "EARNER"),
      orderBy("verifiedReferralCount", "desc"),
      limit(10)
    );
  }, [db]);

  const { data: topReferrers, loading: leaderboardLoading } = useCollection<any>(referralLeaderboardQuery);

  if (authLoading || leaderboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="container px-4 py-8 mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/referrals">
              <ArrowLeft className="w-4 h-4" /> Back to Referrals
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/leaderboard">
                <Star className="w-4 h-4" /> Top Earners
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 text-blue-600 mb-4 shadow-inner">
            <Users className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Referral Champions</h1>
          <p className="text-slate-600 text-sm">Top 10 users with the most verified invites.</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
          <CardHeader className="bg-blue-600 text-white pb-12 pt-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold">Growth Ranking</CardTitle>
                <p className="text-blue-100 text-xs">Based on total verified invitations</p>
              </div>
              <Badge className="bg-white/20 text-white border-none backdrop-blur-md">
                Verified Network
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 -mt-6 bg-white rounded-t-[2rem] relative z-10">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="w-[80px] text-center font-bold text-slate-400 uppercase text-[10px] tracking-widest">Rank</TableHead>
                  <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Member</TableHead>
                  <TableHead className="text-right font-bold text-slate-400 uppercase text-[10px] tracking-widest">Verified Invites</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topReferrers?.map((referrer, index) => {
                  const rank = index + 1;
                  const isCurrentUser = referrer.id === user?.uid;
                  
                  const getRankIcon = () => {
                    if (rank === 1) return <Crown className="w-6 h-6 text-amber-500 fill-amber-500" />;
                    if (rank === 2) return <Crown className="w-5 h-5 text-slate-400 fill-slate-400" />;
                    if (rank === 3) return <Crown className="w-5 h-5 text-amber-700 fill-amber-700" />;
                    return <span className="text-slate-300 font-bold text-sm">#{rank}</span>;
                  };

                  const getBgColor = () => {
                    if (isCurrentUser) return "bg-blue-50/80 ring-1 ring-inset ring-blue-100";
                    if (rank === 1) return "bg-amber-50/30";
                    if (rank === 2) return "bg-slate-50/30";
                    if (rank === 3) return "bg-orange-50/20";
                    return "";
                  };

                  return (
                    <TableRow key={referrer.id} className={`${getBgColor()} transition-colors border-slate-50`}>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center justify-center min-h-[48px]">
                          {getRankIcon()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 py-1">
                          <div className={`w-10 h-10 rounded-full ${isCurrentUser ? 'bg-blue-600 text-white' : 'bg-slate-100 text-blue-600'} flex items-center justify-center font-bold border-2 border-white shadow-sm`}>
                            {referrer.displayName?.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className={`text-sm font-bold leading-none mb-1 ${isCurrentUser ? 'text-blue-700' : 'text-slate-800'}`}>
                              {isCurrentUser ? `You (${referrer.displayName})` : referrer.displayName}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Total Invites: {referrer.referralCount || 0}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className={`text-sm font-bold ${isCurrentUser ? 'text-blue-700' : 'text-blue-600'}`}>
                            {referrer.verifiedReferralCount || 0}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">
                            Verified
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {(!topReferrers || topReferrers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-24">
                      <div className="flex flex-col items-center opacity-30">
                        <Users className="w-12 h-12 mb-2" />
                        <p className="text-sm italic">Growth records pending...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="mt-8 bg-white p-6 rounded-[2rem] text-center border shadow-sm flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 mb-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-sm text-slate-600 font-medium mb-4 max-w-[280px]">
            Help our community grow and secure your spot on the leaderboard!
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 h-12 rounded-xl shadow-lg shadow-blue-600/20">
            <Link href="/referrals">Invite Friends</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}