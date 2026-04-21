
"use client";

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, UserCheck, UserPlus, Loader2, Search, CheckCircle2, XCircle, Copy, Trophy, Percent, Coins } from "lucide-react";
import { collection, query, where, doc, orderBy, limit } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ReferralListPage() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  const userProfileRef = useMemoFirebase(() => {
    return user && db ? doc(db, "users", user.uid) : null;
  }, [user, db]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  const settingsRef = useMemoFirebase(() => db ? doc(db, "settings", "global") : null, [db]);
  const { data: settings } = useDoc<any>(settingsRef);

  const referralsQuery = useMemoFirebase(() => {
    if (!db || !profile?.referralCode) return null;
    return query(collection(db, "users"), where("referredBy", "==", profile.referralCode));
  }, [db, profile?.referralCode]);

  const { data: referrals, loading: referralsLoading } = useCollection<any>(referralsQuery);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  if (authLoading || profileLoading || referralsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const userReferralCode = profile?.referralCode || user?.uid?.slice(0, 8);
  const referralLink = `${origin || 'https://taskhome.vercel.app'}/signup?ref=${userReferralCode}`;
  const isAdvertiser = profile?.role === 'ADVERTISER';

  const referralReward = settings?.referralReward || 100;
  const referralCommission = settings?.referralCommission || 0.5;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Referral link has been copied to your clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredReferrals = referrals?.filter(ref => 
    ref.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const verifiedCount = referrals?.filter(r => r.status === 'VERIFIED').length || 0;
  const pendingCount = referrals?.filter(r => r.status === 'UNVERIFIED').length || 0;
  const totalDeposits = referrals?.reduce((acc, curr) => acc + (curr.depositCount || 0), 0) || 0;
  
  const estimatedEarnings = isAdvertiser 
    ? (referrals?.reduce((acc, curr) => acc + (curr.balance * (referralCommission / 100)), 0) || 0) 
    : (verifiedCount * referralReward);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="container px-4 py-8 mx-auto max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href={isAdvertiser ? "/dashboard/advertiser" : "/dashboard"}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </Button>
          
          {!isAdvertiser && (
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="gap-2 border-primary text-primary hover:bg-primary/5">
                <Link href="/leaderboard">
                  <Trophy className="w-4 h-4" /> Earners
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                <Link href="/leaderboard/referrals">
                  <Users className="w-4 h-4" /> Referrers
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
            <Users className="w-6 h-6" /> Referral Network
          </h1>
          <p className="text-slate-600 text-sm">Grow your team and earn commissions.</p>
        </div>

        <Card className="mb-6 border-none shadow-sm bg-white rounded-2xl overflow-hidden border-l-4 border-l-secondary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Coins className="w-4 h-4 text-secondary" /> Earning Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              </div>
              <p className="text-xs text-slate-600">
                <span className="font-bold text-slate-900">₦{referralReward}</span> for every earner who verifies their account.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <Percent className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="text-xs text-slate-600">
                <span className="font-bold text-slate-900">{referralCommission}% Commission</span> on all deposits made by advertisers you refer.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 border-none shadow-sm bg-primary text-white overflow-hidden">
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Your Invite Link</p>
            <div className="flex gap-2">
              <div className="flex-grow bg-white/10 rounded-lg p-3 truncate text-sm font-mono">
                {referralLink}
              </div>
              <Button 
                onClick={copyToClipboard}
                size="icon" 
                variant="secondary" 
                className="bg-white text-primary hover:bg-white/90 shrink-0"
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="border-none shadow-sm bg-green-50">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <CheckCircle2 className="w-5 h-5 text-green-600 mb-1" />
              <span className="text-xl font-bold text-green-700">{isAdvertiser ? totalDeposits : verifiedCount}</span>
              <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider">
                {isAdvertiser ? 'Total Deposits' : 'Verified'}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">₦{estimatedEarnings.toFixed(2)} earned</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-amber-50">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Loader2 className="w-5 h-5 text-amber-600 mb-1" />
              <span className="text-xl font-bold text-amber-700">{pendingCount}</span>
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">In Network</span>
              <p className="text-[10px] text-slate-400 mt-1">Direct Invites</p>
            </CardContent>
          </Card>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search your network..." 
            className="pl-10 bg-white border-none shadow-sm h-12 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Recent Referrals</h3>
          {filteredReferrals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-sm border border-slate-100">
              <UserPlus className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 text-sm font-medium">No one here yet. Share your link!</p>
            </div>
          ) : (
            filteredReferrals.map((referral) => (
              <Card key={referral.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-primary">
                      {referral.displayName?.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{referral.displayName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{referral.email}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={isAdvertiser ? "outline" : (referral.status === 'VERIFIED' ? 'default' : 'secondary')}
                    className={isAdvertiser ? "border-primary text-primary" : (referral.status === 'VERIFIED' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-slate-100 text-slate-600')}
                  >
                    {isAdvertiser ? `${referral.depositCount || 0} Deposits` : (referral.status || 'UNVERIFIED')}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
