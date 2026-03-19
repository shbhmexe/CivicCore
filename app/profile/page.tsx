'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Shield, Award, MapPin, Calendar, Camera, Edit2, Loader2, BarChart3, CheckCircle2, AlertTriangle, Settings, ThumbsUp, MessageSquare, Clock, ExternalLink, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { updateProfileImage, getUserProfile } from '@/app/actions/user';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserReport {
    id: string;
    title: string;
    category: string;
    severity: string;
    status: string;
    address: string | null;
    image: string | null;
    createdAt: string;
    votes: number;
    comments: number;
}

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const [isUploading, setIsUploading] = useState(false);
    const [reports, setReports] = useState<UserReport[]>([]);
    const [reportCount, setReportCount] = useState(0);
    const [karmaPoints, setKarmaPoints] = useState(0);
    const [redemptions, setRedemptions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        async function loadProfile() {
            try {
                const data = await getUserProfile();
                if (data && !data.error) {
                    setReports((data as any).reports || []);
                    setReportCount((data as any).reportCount || 0);
                    setKarmaPoints((data as any).karmaPoints || 0);
                    setRedemptions((data as any).redemptions || []);
                }
            } catch (e) {
                console.error('Failed to load profile:', e);
            } finally {
                setIsLoading(false);
            }
        }
        if (session?.user) loadProfile();
    }, [session]);

    const isAdmin = session?.user?.role === 'ADMIN';

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const result = await updateProfileImage(formData);
            if (result.success && result.imageUrl) {
                await update({ user: { image: result.imageUrl } });
                router.refresh();
            } else {
                console.error("Upload failed:", result.error);
            }
        } catch (error) {
            console.error("Upload exception:", error);
        } finally {
            setIsUploading(false);
        }
    };

    if (!session?.user) {
        return (
            <div className="min-h-screen pt-24 flex justify-center items-center bg-[#0a0a12]">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-white">Access Denied</h2>
                    <p className="text-gray-400">Please sign in to view your profile.</p>
                </div>
            </div>
        );
    }

    const displayName = session.user.name && session.user.name !== 'Citizen'
        ? session.user.name
        : session.user.email?.split('@')[0] || 'User';

    return (
        <div className="min-h-screen bg-[#f8fafc] pt-12 pb-12 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Hero Profile Card */}
                <div className="relative overflow-hidden rounded-3xl bg-[#002f5a] shadow-2xl">
                    {/* Background decoration - subtle patterns */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[60%] bg-orange-500 rounded-full blur-[100px]" />
                        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[50%] bg-blue-400 rounded-full blur-[100px]" />
                    </div>

                    <div className="relative p-8 md:p-12">
                        <div className="flex flex-col md:flex-row items-center gap-8">

                            {/* Avatar Section */}
                            <div className="relative group shrink-0">
                                <div className={`absolute -inset-1 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500 ${isAdmin ? 'bg-gradient-to-br from-amber-500 to-teal-600' : 'bg-gradient-to-br from-teal-500 to-blue-600'
                                    }`} />
                                <div className="relative w-32 h-32 rounded-full ring-4 ring-[#0a0a12] overflow-hidden bg-gray-800 flex items-center justify-center">
                                    {isUploading ? (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                            <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                                        </div>
                                    ) : null}

                                    {session.user.image ? (
                                        <img
                                            src={session.user.image}
                                            alt={displayName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className={`text-4xl font-bold text-white w-full h-full flex items-center justify-center ${isAdmin ? 'bg-gradient-to-br from-amber-400 to-teal-500' : 'bg-gradient-to-br from-teal-400 to-blue-500'
                                            }`}>
                                            {displayName.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                {/* Edit Badge */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="absolute bottom-0 right-0 p-2 bg-teal-500 rounded-full text-white shadow-lg hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Camera size={16} />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </div>

                             {/* Info Section - Already refined in previous step partially, but double checking */}
                            <div className="flex-1 text-center md:text-left space-y-3">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                                        {displayName}
                                    </h1>
                                    <p className="text-blue-200/70 flex items-center justify-center md:justify-start gap-2 mt-1 font-medium">
                                        <Mail size={14} className="text-orange-400" /> {session.user.email}
                                    </p>
                                </div>

                                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                    <Badge variant="outline" className={`px-3 py-1 uppercase tracking-wider text-xs font-semibold ${isAdmin
                                        ? 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                                        : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                        }`}>
                                        <Shield size={12} className="mr-1.5" />
                                        {session.user.role}
                                    </Badge>
                                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 px-3 py-1 uppercase tracking-wider text-xs font-semibold">
                                        <Calendar size={12} className="mr-1.5" />
                                        Member since 2024
                                    </Badge>
                                </div>
                            </div>

                            {/* Stats Section - Admin vs Citizen */}
                            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                                {isAdmin ? (
                                    <>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition-all cursor-default shadow-lg">
                                            <div className="text-2xl font-bold text-orange-400">
                                                <Shield size={24} className="mx-auto" />
                                            </div>
                                            <div className="text-[10px] text-blue-100/60 uppercase font-black tracking-widest mt-2">Admin</div>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition-all cursor-default shadow-lg">
                                            <div className="text-2xl font-bold text-white">
                                                <BarChart3 size={24} className="mx-auto" />
                                            </div>
                                            <div className="text-[10px] text-blue-100/60 uppercase font-black tracking-widest mt-2">Manager</div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition-all cursor-default shadow-lg">
                                            <div className="text-2xl font-black text-white">{isLoading ? '—' : reportCount}</div>
                                            <div className="text-[10px] text-blue-100/60 uppercase font-extrabold tracking-widest mt-1">Reports</div>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition-all cursor-default shadow-lg group relative overflow-hidden">
                                            <div className="text-2xl font-black text-orange-400">{isLoading ? '—' : karmaPoints}</div>
                                            <div className="text-[10px] text-blue-100/60 uppercase font-extrabold tracking-widest mt-1">Karma</div>
                                            
                                            {!isAdmin && (
                                                <Link href="/rewards">
                                                    <Button variant="ghost" size="sm" className="mt-3 h-7 text-[10px] font-bold bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-lg w-full">
                                                        Redeem
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="activity" className="w-full">
                    <div className="flex justify-center md:justify-start mb-10">
                        <TabsList className="bg-white border border-gray-200 p-1 rounded-2xl shadow-sm h-14">
                            <TabsTrigger value="activity" className="px-8 h-full data-[state=active]:bg-[#002f5a] data-[state=active]:text-white rounded-xl transition-all font-bold text-gray-500">
                                {isAdmin ? 'Admin Portal' : 'My Activity'}
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="px-8 h-full data-[state=active]:bg-[#002f5a] data-[state=active]:text-white rounded-xl transition-all font-bold text-gray-500">Settings</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="activity">
                        {isAdmin ? (
                            /* ===== ADMIN ACTIVITY TAB ===== */
                            <Card className="bg-white border-gray-100 text-[#002f5a] shadow-xl rounded-2xl overflow-hidden">
                                <CardHeader className="border-b border-gray-50 pb-6">
                                    <CardTitle className="flex items-center gap-3 text-xl font-extrabold">
                                        <div className="p-2 bg-orange-500/10 rounded-lg">
                                            <Shield className="text-orange-500 w-5 h-5" />
                                        </div>
                                        Admin Command Overview
                                    </CardTitle>
                                    <CardDescription className="text-gray-500 font-medium">
                                        Your administrative role and access summary.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Admin Role Card */}
                                    <div className="p-6 rounded-2xl border border-orange-500/10 bg-gradient-to-br from-orange-500/5 to-blue-500/5">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                                                <Shield className="w-6 h-6 text-orange-500" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-[#002f5a]">Municipal Administrator</h3>
                                                <p className="text-sm text-gray-500 mt-1 font-medium">
                                                    You have full access to manage infrastructure reports, update statuses, resolve complaints, and oversee the municipal response workflow.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Link href="/admin" className="group p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-orange-50/50 hover:border-orange-200 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-200 group-hover:bg-orange-500/20 transition-colors">
                                                    <BarChart3 className="w-4 h-4 text-orange-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#002f5a]">Command Center</p>
                                                    <p className="text-[11px] text-gray-400">Manage citizen reports</p>
                                                </div>
                                            </div>
                                        </Link>
                                        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-green-50/50 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-500/10 rounded-lg border border-green-200">
                                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#002f5a]">Issue Resolver</p>
                                                    <p className="text-[11px] text-gray-400">Manage ticket lifecycles</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Access Level */}
                                    <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/30">
                                        <div className="flex items-center gap-2 text-xs text-orange-700">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            <span className="font-bold uppercase tracking-widest text-[10px]">Access Level: Full Administrative Control</span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-1 font-medium italic">
                                            Authorized for organization-wide report management and status overrides.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            /* ===== CITIZEN ACTIVITY TAB ===== */
                            <Card className="bg-white border-gray-100 text-[#002f5a] shadow-xl rounded-2xl overflow-hidden">
                                <CardHeader className="border-b border-gray-50 pb-6">
                                    <CardTitle className="flex items-center gap-3 text-xl font-extrabold">
                                        <div className="p-2 bg-orange-500/10 rounded-lg">
                                            <MapPin className="text-orange-500 w-5 h-5" />
                                        </div>
                                        Recent Reports
                                    </CardTitle>
                                    <CardDescription className="text-gray-500 font-medium">
                                        Track the status of the infrastructure issues you&apos;ve reported.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? (
                                        <div className="flex justify-center py-16">
                                            <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                                        </div>
                                    ) : reports.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 space-y-4 border-2 border-dashed border-white/10 rounded-xl bg-black/20">
                                            <div className="p-4 bg-white/5 rounded-full">
                                                <Edit2 size={32} className="opacity-50" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-lg">No reports filed yet</p>
                                                <p className="text-sm opacity-70">Be a civic hero! Report your first issue today.</p>
                                            </div>
                                            <Link href="/report">
                                                <Button className="mt-4 bg-teal-600 hover:bg-teal-700 text-white">
                                                    Report an Issue
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {reports.map((report) => {
                                                const statusColors: Record<string, string> = {
                                                    PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
                                                    IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                                                    RESOLVED: 'bg-green-500/10 text-green-400 border-green-500/30',
                                                    REJECTED: 'bg-red-500/10 text-red-400 border-red-500/30',
                                                };
                                                const severityColors: Record<string, string> = {
                                                    LOW: 'text-green-400',
                                                    MEDIUM: 'text-yellow-400',
                                                    HIGH: 'text-orange-400',
                                                    CRITICAL: 'text-red-400',
                                                };
                                                return (
                                                    <Link key={report.id} href={`/complaints/${report.id}`}>
                                                        <div className="group p-5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-orange-200 transition-all cursor-pointer shadow-sm hover:shadow-md">
                                                            <div className="flex gap-4">
                                                                {/* Thumbnail */}
                                                                {report.image && (
                                                                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100 shadow-inner">
                                                                        <img src={report.image} alt={report.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                    </div>
                                                                )}
                                                                {/* Details */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <h3 className="font-bold text-[#002f5a] truncate group-hover:text-orange-600 transition-colors">
                                                                            {report.title}
                                                                        </h3>
                                                                        <Badge variant="outline" className={`shrink-0 text-[10px] px-2 py-0.5 uppercase font-extrabold tracking-tighter ${statusColors[report.status] || 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                                                            {report.status.replace('_', ' ')}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 font-medium">
                                                                        <span className="flex items-center gap-1">
                                                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 font-bold ${severityColors[report.severity] || 'text-gray-400'}`}>
                                                                                {report.severity}
                                                                            </Badge>
                                                                        </span>
                                                                        <span className="text-gray-300">•</span>
                                                                        <span className="text-gray-600">{report.category}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                                                                        {report.address && (
                                                                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                                                                                <MapPin size={12} className="text-orange-400" /> {report.address.split(',').slice(0, 2).join(',')}
                                                                            </span>
                                                                        )}
                                                                        <span className="flex items-center gap-1">
                                                                            <ThumbsUp size={11} className="text-gray-400" /> {report.votes}
                                                                        </span>
                                                                        <span className="flex items-center gap-1">
                                                                            <MessageSquare size={11} className="text-gray-400" /> {report.comments}
                                                                        </span>
                                                                        <span className="flex items-center gap-1 ml-auto">
                                                                            <Clock size={11} className="text-gray-400" /> {new Date(report.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                            {/* Report More Button */}
                                            <div className="text-center pt-2">
                                                <Link href="/report">
                                                    <Button variant="outline" className="border-orange-500/30 text-orange-600 hover:bg-orange-500/5 hover:text-orange-700 rounded-xl">
                                                        + Report Another Issue
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    {/* Redemption History Section */}
                                    {!isAdmin && redemptions.length > 0 && (
                                        <div className="mt-12 space-y-6 pt-12 border-t border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                                    <Award className="text-blue-500 w-5 h-5" />
                                                </div>
                                                <h3 className="text-xl font-extrabold text-[#002f5a]">Redemption History</h3>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {redemptions.map((r: any) => (
                                                    <div key={r.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center justify-between group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center p-2 border border-gray-100">
                                                                <ShoppingBag className="w-6 h-6 text-gray-800" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-[#002f5a]">{r.reward}</p>
                                                                <p className="text-[10px] font-mono text-blue-500 select-all cursor-pointer bg-blue-50 px-1.5 py-0.5 rounded mt-1">{r.code}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs font-black text-red-500">-{r.points}</p>
                                                            <p className="text-[10px] text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="settings">
                        <Card className="bg-white border-gray-100 text-[#002f5a] shadow-xl rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-gray-50 pb-6">
                                <CardTitle className="flex items-center gap-3 text-xl font-extrabold">
                                    <div className="p-2 bg-orange-500/10 rounded-lg">
                                        <Settings className="w-5 h-5 text-orange-500" />
                                    </div>
                                    Account Settings
                                </CardTitle>
                                <CardDescription className="text-gray-500 font-medium">
                                    View and manage your account details.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-[#002f5a]/60">Display Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        disabled
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#002f5a] font-semibold cursor-not-allowed focus:outline-none"
                                    />
                                    <p className="text-[10px] text-gray-400 font-medium italic">Name updates are managed via your Google account.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-[#002f5a]/60">Email Address</label>
                                    <input
                                        type="text"
                                        value={session.user.email || ''}
                                        disabled
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#002f5a] font-semibold cursor-not-allowed focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-[#002f5a]/60">Account Role</label>
                                    <div className={`w-full px-4 py-3 rounded-xl border font-bold text-sm flex items-center gap-2 ${isAdmin
                                        ? 'bg-orange-50 border-orange-200 text-orange-700'
                                        : 'bg-blue-50 border-blue-200 text-blue-700'
                                        }`}>
                                        <Shield size={16} className={isAdmin ? 'text-orange-500' : 'text-blue-500'} />
                                        {isAdmin ? 'Municipal Administrator' : 'Verified Citizen Participant'}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
