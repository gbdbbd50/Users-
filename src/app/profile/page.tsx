"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { User, Mail, Calendar, ShieldCheck, ArrowLeft, LogOut, Loader2, Edit2, BellRing, Smartphone, Lock, Zap, Percent, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useUser, useAuth, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { doc, updateDoc, collection, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, loading: authLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLegalName, setNewLegalName] = useState("");
  const [newSkills, setNewSkills] = useState("");

  const profileRef = useMemoFirebase(() => {
    return user && db ? doc(db, "users", user.uid) : null;
  }, [user, db]);

  const { data: profile, loading: profileLoading } = useDoc<any>(profileRef);

  // Fetch advertiser tasks if applicable to count "tasks posted"
  const advertiserTasksQuery = useMemoFirebase(() => {
    if (!db || !user || profile?.role !== 'ADVERTISER') return null;
    return query(collection(db, "tasks"), where("advertiserId", "==", user.uid));
  }, [db, user, profile?.role]);

  const { data: advertiserTasks } = useCollection<any>(advertiserTasksQuery);

  useEffect(() => {
    if (user?.displayName) {
      setNewName(user.displayName);
    }
    if (profile) {
      setNewLegalName(profile.legalFullName || "");
      setNewSkills(profile.skills || "");
    }
  }, [user, profile]);

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push("/");
    }
  };

  const getDashboardHref = () => {
    if (profile?.role === "ADVERTISER") return "/dashboard/advertiser";
    if (profile?.role === "DEVELOPER") return "/dashboard/developer";
    if (profile?.role === "ADMIN") return "/admin";
    return "/dashboard";
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !user || !db || !newName.trim()) return;

    setIsSaving(true);
    try {
      await updateProfile(user, { displayName: newName });
      await updateDoc(doc(db, "users", user.uid), {
        displayName: newName,
        legalFullName: newLegalName,
        skills: newSkills
      });
      toast({
        title: "Profile Updated",
        description: "Your information has been successfully saved.",
      });
      setIsEditModalOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href={getDashboardHref()}>
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-md overflow-hidden bg-white">
            <div className="h-24 bg-primary"></div>
            <CardContent className="pt-0 relative">
              <div className="flex flex-col items-center -mt-12">
                <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                  <AvatarImage src={`https://picsum.photos/seed/${user?.uid || 'user'}/200/200`} />
                  <AvatarFallback>{user?.displayName?.slice(0, 2) || 'JD'}</AvatarFallback>
                </Avatar>
                <div className="mt-4 text-center">
                  <h2 className="text-xl font-bold">{user?.displayName || "Member"}</h2>
                  {profile?.legalFullName && (
                    <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1 mt-1">
                      <BadgeCheck className="w-3 h-3 text-primary" /> {profile.legalFullName}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground uppercase text-[10px] font-bold tracking-widest mt-2">{profile?.role || "Earner"}</p>
                  
                  {/* Dynamic Stats based on role */}
                  {(profile?.role === 'EARNER' || profile?.role === 'ADVERTISER' || profile?.role === 'DEVELOPER') && (
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground font-medium">
                        {profile?.role === 'ADVERTISER' 
                          ? `${advertiserTasks?.length || 0} tasks posted`
                          : `${profile?.completedTasks || 0} tasks completed`
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                  <span>{profile?.status || 'UNVERIFIED'} Account</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Member Since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '2023'}</span>
                </div>
              </div>

              <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full mt-6 bg-primary text-white gap-2">
                    <Edit2 className="w-4 h-4" /> Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl border-none sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Update Information</DialogTitle>
                    <DialogDescription>
                      Adjust your account details and professional bio.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateProfile} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Username</Label>
                      <Input 
                        id="displayName" 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)} 
                        placeholder="Public handle"
                        className="rounded-xl h-12"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legalFullName">Legal Full Name</Label>
                      <Input 
                        id="legalFullName" 
                        value={newLegalName} 
                        onChange={(e) => setNewLegalName(e.target.value)} 
                        placeholder="Your real name for payments"
                        className="rounded-xl h-12"
                      />
                      <p className="text-[10px] text-slate-400">Provide your correct full name as seen on your bank records.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="skills">Skills (comma separated)</Label>
                      <Input 
                        id="skills" 
                        value={newSkills} 
                        onChange={(e) => setNewSkills(e.target.value)} 
                        placeholder="e.g. Design, Coding, Writing"
                        className="rounded-xl h-12"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSaving} className="w-full h-12 rounded-xl bg-primary font-bold">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Changes"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-secondary text-white">
            <CardHeader>
              <CardTitle className="text-lg">{profile?.planName || "Starter"} Member</CardTitle>
              <CardDescription className="text-white/80">Active membership level and platform benefits.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2"><Zap className="w-4 h-4" /> {profile?.maxDailyTasks || 0} Daily Task Limit</li>
                <li className="flex items-center gap-2"><Percent className="w-4 h-4" /> {profile?.planPercentage || 100}% Payout Share</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Verified Payout Access</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle>Skills & Badges</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {profile?.skills ? (
                profile.skills.split(',').map((skill: string, i: number) => {
                  const s = skill.trim();
                  if (!s) return null;
                  return <Badge key={i} variant="secondary">{s}</Badge>;
                })
              ) : (
                <p className="text-xs text-muted-foreground italic py-2">No skills added yet. Edit profile to add your expertise!</p>
              )}
              <Badge className="bg-primary">Active Member</Badge>
              <Badge className="bg-secondary">{profile?.status === 'VERIFIED' ? 'Trusted Contributor' : 'Community Member'}</Badge>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Two-Factor Auth</h4>
                    <p className="text-[10px] text-muted-foreground">Secure your account with 2FA.</p>
                  </div>
                </div>
                <Badge className="bg-green-500 text-[10px]">Enabled</Badge>
              </div>
              
              <Link href="/notifications" className="block">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100">
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Notifications</h4>
                      <p className="text-[10px] text-muted-foreground">Configure email and push alerts.</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold">Configure</Button>
                </div>
              </Link>

              {(profile?.role === 'EARNER' || profile?.role === 'DEVELOPER') && (
                <Link href="/bank-accounts" className="block">
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Payment Methods</h4>
                        <p className="text-[10px] text-muted-foreground">Manage your bank details for payouts.</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold">Manage</Button>
                  </div>
                </Link>
              )}

              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-slate-100">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Privacy</h4>
                    <p className="text-[10px] text-muted-foreground">Manage visibility and data usage.</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold">Accepted</Button>
              </div>
            </CardContent>
          </Card>

          <div className="pt-4">
            <Button variant="outline" onClick={handleSignOut} className="w-full text-red-500 border-red-200 hover:bg-red-50 gap-2 h-12 rounded-xl">
              <LogOut className="w-4 h-4" /> Log Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
