'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Shield, Award, MapPin, Calendar, Camera, Edit2, Loader2, BarChart3, CheckCircle2, AlertTriangle, Settings, ThumbsUp, MessageSquare, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { updateProfileImage, getUserProfile } from '@/app/actions/user';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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
        <div className="min-h-screen bg-[#0a0a12] pt-8 pb-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Hero Profile Card */}
                <div className="relative overflow-hidden rounded-3xl bg-gray-900/50 border border-white/10 shadow-2xl backdrop-blur-xl">
                    {/* Background decoration - different gradient for admin */}
                    <div className={`absolute top-0 left-0 w-full h-32 blur-3xl opacity-50 ${isAdmin
                        ? 'bg-gradient-to-r from-amber-500/20 via-teal-500/20 to-blue-500/20'
                        : 'bg-gradient-to-r from-teal-500/20 via-blue-500/20 to-purple-500/20'
                        }`} />

                    <div className="relative p-8 md:p-10">
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

                            {/* Info Section */}
                            <div className="flex-1 text-center md:text-left space-y-3">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                                        {displayName}
                                    </h1>
                                    <p className="text-gray-400 flex items-center justify-center md:justify-start gap-2 mt-1">
                                        <Mail size={14} /> {session.user.email}
                                    </p>
                                </div>

                                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                    <Badge variant="outline" className={`px-3 py-1 uppercase tracking-wider text-xs font-semibold ${isAdmin
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                                        }`}>
                                        <Shield size={12} className="mr-1.5" />
                                        {session.user.role}
                                    </Badge>
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 uppercase tracking-wider text-xs font-semibold">
                                        <Calendar size={12} className="mr-1.5" />
                                        Member since 2024
                                    </Badge>
                                </div>
                            </div>

                            {/* Stats Section - Admin vs Citizen */}
                            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                                {isAdmin ? (
                                    <>
                                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-center backdrop-blur-sm hover:bg-amber-500/10 transition-colors cursor-default">
                                            <div className="text-2xl font-bold text-amber-400">
                                                <Shield size={24} className="mx-auto" />
                                            </div>
                                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Admin</div>
                                        </div>
                                        <div className="bg-teal-500/5 border border-teal-500/10 rounded-2xl p-4 text-center backdrop-blur-sm hover:bg-teal-500/10 transition-colors cursor-default">
                                            <div className="text-2xl font-bold text-teal-400">
                                                <BarChart3 size={24} className="mx-auto" />
                                            </div>
                                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Manager</div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default">
                                            <div className="text-2xl font-bold text-teal-400">{isLoading ? '—' : reportCount}</div>
                                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Reports</div>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default">
                                            <div className="text-2xl font-bold text-yellow-400">{isLoading ? '—' : karmaPoints}</div>
                                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Karma</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="activity" className="w-full">
                    <div className="flex justify-center md:justify-start mb-6">
                        <TabsList className="bg-gray-900/50 border border-white/10 p-1 rounded-xl">
                            <TabsTrigger value="activity" className="px-6 data-[state=active]:bg-teal-500 data-[state=active]:text-white rounded-lg">
                                {isAdmin ? 'Admin Overview' : 'Activity'}
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="px-6 data-[state=active]:bg-teal-500 data-[state=active]:text-white rounded-lg">Settings</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="activity">
                        {isAdmin ? (
                            /* ===== ADMIN ACTIVITY TAB ===== */
                            <Card className="bg-gray-900/40 border-white/10 text-white backdrop-blur-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="text-amber-400" /> Admin Command Overview
                                    </CardTitle>
                                    <CardDescription className="text-gray-400">
                                        Your administrative role and access summary.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Admin Role Card */}
                                    <div className="p-6 rounded-2xl border border-amber-500/10 bg-gradient-to-br from-amber-500/5 to-teal-500/5">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                                <Shield className="w-6 h-6 text-amber-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-white">Municipal Administrator</h3>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    You have full access to manage infrastructure reports, update statuses, resolve complaints, and oversee the municipal response workflow.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Link href="/admin" className="group p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-teal-500/5 hover:border-teal-500/20 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20 group-hover:bg-teal-500/20 transition-colors">
                                                    <BarChart3 className="w-4 h-4 text-teal-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">Admin Command Center</p>
                                                    <p className="text-[11px] text-gray-500">Manage all citizen reports</p>
                                                </div>
                                            </div>
                                        </Link>
                                        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">Resolve Issues</p>
                                                    <p className="text-[11px] text-gray-500">Update statuses & close tickets</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Access Level */}
                                    <div className="p-4 rounded-xl border border-white/5 bg-black/20">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            <span className="font-semibold uppercase tracking-wider">Access Level: Full Administrative</span>
                                        </div>
                                        <p className="text-[11px] text-gray-600 mt-1">
                                            You can view all reports, change statuses, resolve/reject complaints, and manage the municipal response pipeline.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            /* ===== CITIZEN ACTIVITY TAB ===== */
                            <Card className="bg-gray-900/40 border-white/10 text-white backdrop-blur-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="text-teal-400" /> Recent Reports
                                    </CardTitle>
                                    <CardDescription className="text-gray-400">
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
                                                        <div className="group p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-teal-500/20 transition-all cursor-pointer">
                                                            <div className="flex gap-4">
                                                                {/* Thumbnail */}
                                                                {report.image && (
                                                                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                                                                        <img src={report.image} alt={report.title} className="w-full h-full object-cover" />
                                                                    </div>
                                                                )}
                                                                {/* Details */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <h3 className="font-semibold text-white truncate group-hover:text-teal-400 transition-colors">
                                                                            {report.title}
                                                                        </h3>
                                                                        <Badge variant="outline" className={`shrink-0 text-[10px] px-2 py-0.5 uppercase font-bold ${statusColors[report.status] || 'bg-gray-500/10 text-gray-400'}`}>
                                                                            {report.status.replace('_', ' ')}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                                                        <span className="flex items-center gap-1">
                                                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 ${severityColors[report.severity] || 'text-gray-400'}`}>
                                                                                {report.severity}
                                                                            </Badge>
                                                                        </span>
                                                                        <span className="text-gray-600">•</span>
                                                                        <span>{report.category}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                                        {report.address && (
                                                                            <span className="flex items-center gap-1 truncate">
                                                                                <MapPin size={11} /> {report.address.split(',').slice(0, 2).join(',')}
                                                                            </span>
                                                                        )}
                                                                        <span className="flex items-center gap-1">
                                                                            <ThumbsUp size={11} /> {report.votes}
                                                                        </span>
                                                                        <span className="flex items-center gap-1">
                                                                            <MessageSquare size={11} /> {report.comments}
                                                                        </span>
                                                                        <span className="flex items-center gap-1 ml-auto">
                                                                            <Clock size={11} /> {new Date(report.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                                                    <Button variant="outline" className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10">
                                                        + Report Another Issue
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="settings">
                        <Card className="bg-gray-900/40 border-white/10 text-white backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-teal-400" />
                                    Profile Settings
                                </CardTitle>
                                <CardDescription className="text-gray-400">
                                    View and manage your account details.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Display Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        disabled
                                        className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-gray-300 cursor-not-allowed focus:outline-none"
                                    />
                                    <p className="text-xs text-gray-500">To change your name, please update your Google account profile.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Email Address</label>
                                    <input
                                        type="text"
                                        value={session.user.email || ''}
                                        disabled
                                        className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-gray-300 cursor-not-allowed focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Role</label>
                                    <div className={`w-full px-4 py-2.5 rounded-lg border font-semibold text-sm ${isAdmin
                                        ? 'bg-amber-500/5 border-amber-500/20 text-amber-400'
                                        : 'bg-teal-500/5 border-teal-500/20 text-teal-400'
                                        }`}>
                                        {isAdmin ? '🛡️ Municipal Administrator' : '👤 Citizen'}
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
