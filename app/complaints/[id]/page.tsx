import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import {
    ArrowLeft, MapPin, Calendar, Shield, User, AlertTriangle, Clock,
    CheckCircle2, XCircle, Hash, Eye, Tag, Building2
} from 'lucide-react';
import Link from 'next/link';
import { CommentSection } from '@/components/admin/comment-section';
import { ResolveSection } from '@/components/admin/resolve-section';
import { StatusSelect } from '@/components/admin/status-select';
import { UpvoteButton } from '@/components/complaint/upvote-button';
import { ProgressTracker } from '@/components/complaint/progress-tracker';
import { cn } from '@/lib/utils';

const severityConfig: Record<string, { color: string; bg: string; border: string }> = {
    LOW: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    MEDIUM: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
    PENDING: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Clock },
    ASSIGNED: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Eye },
    IN_PROGRESS: { color: 'text-purple-400', bg: 'bg-purple-500/10', icon: AlertTriangle },
    RESOLVED: { color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle2 },
    REJECTED: { color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
};

export default async function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
        redirect('/auth/signin');
    }

    const complaint = await prisma.complaint.findUnique({
        where: { id },
        include: {
            department: true,
            user: {
                select: { id: true, name: true, email: true, image: true, role: true }
            },
            votes: true,
            _count: { select: { comments: true } }
        }
    });

    if (!complaint) {
        notFound();
    }

    // Access control: admin can view all, citizen can only view their own
    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = complaint.userId === session.user.id;

    if (!isAdmin && !isOwner) {
        redirect('/dashboard');
    }

    const severity = severityConfig[complaint.severity] || severityConfig.LOW;
    const status = statusConfig[complaint.status] || statusConfig.PENDING;
    const StatusIcon = status.icon;

    const displayName = complaint.user.name && complaint.user.name !== 'Citizen'
        ? complaint.user.name
        : complaint.user.email.split('@')[0];

    // Compute initial vote state for current user
    const userHasVoted = complaint.votes.some(v => v.userId === session.user!.id);
    const initialVoteCount = complaint.votes.length;

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* ═══════ HERO HEADER ═══════ */}
            <div className="bg-[#002f5a] pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative shadow-sm">
                {/* Decorative background element - now in its own overflow-hidden container */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -mr-64 -mt-64" />
                </div>
                
                <div className="max-w-7xl mx-auto relative z-30">
                    <Link
                        href={isAdmin ? '/admin' : '/dashboard'}
                        className="inline-flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to {isAdmin ? 'Admin Center' : 'Dashboard'}
                    </Link>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <span className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border",
                                    severity.bg, severity.color, severity.border
                                )}>
                                    {complaint.severity} PRIORITY
                                </span>
                                <span className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest",
                                    status.bg, status.color
                                )}>
                                    {complaint.status.replace('_', ' ')}
                                </span>
                                <span className="px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest bg-white/10 text-white/80 border border-white/10">
                                    {complaint.category}
                                </span>
                                {(complaint as any).department?.name && (
                                    <span className="px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/20 text-blue-200 border border-blue-500/30 flex items-center gap-1">
                                        <Building2 className="w-3 h-3" />
                                        {(complaint as any).department.name}
                                    </span>
                                )}
                            </div>
                            
                            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-6 leading-tight">
                                {complaint.title}
                            </h1>
                            
                            <div className="flex flex-wrap items-center gap-6 text-sm text-blue-100/60 font-medium">
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-orange-400" />
                                    {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
                                        day: 'numeric', month: 'long', year: 'numeric'
                                    })}
                                </span>
                                {complaint.address && (
                                    <span className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-orange-400" />
                                        {complaint.address}
                                    </span>
                                )}
                                <span className="flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-orange-400" />
                                    Ref: {complaint.id.slice(0, 8).toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* Admin Status Select */}
                        {isAdmin && (
                            <div className="flex-shrink-0 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md relative z-50">
                                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-3 px-1">Update Status</p>
                                <StatusSelect
                                    complaintId={complaint.id}
                                    currentStatus={complaint.status}
                                />
                            </div>
                        )}
                </div>
            </div>
        </div>

        {/* ═══════ CONTENT SECTION ═══════ */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Progress & Details */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Progress Tracker Card */}
                        <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
                            <ProgressTracker 
                                complaintId={complaint.id}
                                status={complaint.status} 
                                createdAt={complaint.createdAt}
                                resolvedAt={complaint.resolvedAt}
                                isEscalated={(complaint as any).isEscalated}
                            />
                        </div>

                        {/* Description Card */}
                        <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 p-8">
                            <h2 className="text-xs font-black text-[#1e293b] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <span className="w-8 h-1 bg-orange-500 rounded-full" />
                                Detailed Description
                            </h2>
                            <p className="text-[#475569] text-base leading-relaxed whitespace-pre-wrap font-medium">
                                {complaint.description}
                            </p>
                        </div>

                        {/* Evidence Card */}
                        {(((complaint as any).images && (complaint as any).images.length > 0) || (complaint as any).videoUrl) && (
                            <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 p-8">
                                <h2 className="text-xs font-black text-[#1e293b] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <span className="w-8 h-1 bg-blue-500 rounded-full" />
                                    Report Evidence
                                </h2>
                                
                                { (complaint as any).videoUrl && (
                                    <div className="mb-6 rounded-2xl overflow-hidden border border-gray-100 bg-black/5">
                                        <video src={(complaint as any).videoUrl} controls className="w-full h-auto max-h-[400px] object-contain" />
                                    </div>
                                )}

                                {(complaint as any).images && (complaint as any).images.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {(complaint as any).images.map((img: string, i: number) => (
                                            <div key={i} className="group rounded-2xl overflow-hidden border border-gray-100 aspect-video relative">
                                                <img src={img} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Eye className="w-8 h-8 text-white" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Social/Comments Card */}
                        <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 p-8">
                             <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <UpvoteButton
                                        complaintId={complaint.id}
                                        initialVoteCount={initialVoteCount}
                                        initialVoted={userHasVoted}
                                    />
                                    <div className="h-8 w-px bg-gray-100" />
                                    <span className="text-sm font-bold text-[#475569]">
                                        {complaint._count.comments} Discussion Updates
                                    </span>
                                </div>
                             </div>

                             <CommentSection
                                complaintId={complaint.id}
                                currentUserId={session.user.id!}
                                currentUserRole={session.user.role!}
                            />
                        </div>
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="space-y-8">
                        
                        {/* Reporter Profile */}
                        <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 p-8">
                            <h2 className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-6">Submitted By</h2>
                            <div className="flex items-center gap-4">
                                {complaint.user.image ? (
                                    <div className="relative">
                                        <img src={complaint.user.image} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-100 shadow-md" />
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" title="Verified Citizen" />
                                    </div>
                                ) : (
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#002f5a] to-[#1e293b] flex items-center justify-center shadow-lg">
                                        <span className="text-xl font-black text-white">{displayName.charAt(0).toUpperCase()}</span>
                                    </div>
                                )}
                                <div>
                                    <p className="text-lg font-black text-[#1e293b] leading-tight">{displayName}</p>
                                    <p className="text-xs font-bold text-orange-500 mt-0.5">{complaint.user.role || 'CITIZEN'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Admin Action Box */}
                        {isAdmin && (
                            <div className="bg-gradient-to-br from-orange-500 to-rose-500 rounded-[2rem] shadow-xl shadow-orange-500/20 p-8 text-white">
                                <h2 className="text-xs font-black uppercase tracking-widest mb-4 opacity-80 text-white">Administration actions</h2>
                                <p className="text-sm font-medium mb-6 leading-relaxed">
                                    Review evidence and mark as resolved to award karma points to the reporter.
                                </p>
                                <ResolveSection
                                    complaintId={complaint.id}
                                    currentStatus={complaint.status}
                                    existingResolutionImage={complaint.resolutionImage}
                                />
                                {complaint.status === 'RESOLVED' && (complaint as any).resolutionScore !== null && (
                                    <div className="mt-6 pt-6 border-t border-white/20">
                                        <div className="flex items-center gap-2 mb-2 opacity-90">
                                            <span className="text-lg">🤖</span>
                                            <span className="font-bold text-sm tracking-wide">AI Verification</span>
                                        </div>
                                        <div className="flex items-end gap-3">
                                            <span className="text-4xl font-black leading-none text-white tracking-tighter">{(complaint as any).resolutionScore}%</span>
                                            <span className="text-sm font-medium opacity-80 mb-1">Match Confidence</span>
                                        </div>
                                        <p className="text-xs font-medium opacity-70 mt-2 leading-relaxed">
                                            AI compared this photo against the original report to verify authenticity.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Resolution Proof Card (For Citizens) */}
                        {!isAdmin && complaint.status === 'RESOLVED' && (complaint as any).resolutionImage && (
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-[2rem] shadow-xl shadow-green-500/20 p-8 text-white relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-4">
                                    <CheckCircle2 className="w-6 h-6" />
                                    <h3 className="text-lg font-black tracking-tight">Issue Resolved!</h3>
                                </div>
                                
                                {(complaint as any).resolutionScore !== null && (
                                    <div className="absolute top-0 right-0 p-4 bg-white/10 backdrop-blur-md rounded-bl-3xl border-l border-b border-white/10">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">AI Verified</span>
                                            <span className="text-2xl font-black text-white leading-none">{(complaint as any).resolutionScore}%</span>
                                        </div>
                                    </div>
                                )}

                                <p className="text-sm font-medium mb-6 opacity-90 pr-16">
                                    The authority has confirmed the fix. Thank you for making our city better!
                                </p>
                                <div className="rounded-2xl overflow-hidden border border-white/20 shadow-lg">
                                    <img src={(complaint as any).resolutionImage} alt="Resolution proof" className="w-full aspect-square object-cover" />
                                </div>
                            </div>
                        )}

                        {/* Metadata/Stats */}
                        <div className="bg-gray-50/50 rounded-[2rem] border border-gray-100 p-8">
                             <h2 className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-6">Report Metadata</h2>
                             <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#64748b] font-medium">Global ID</span>
                                    <span className="text-[#1e293b] font-black font-mono">#{complaint.id.slice(-6).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#64748b] font-medium">Visibility</span>
                                    <span className="text-blue-600 font-bold">Public Community</span>
                                </div>
                                {complaint.resolvedAt && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[#64748b] font-medium">Resolution Time</span>
                                        <span className="text-green-600 font-bold">
                                            {Math.round((new Date(complaint.resolvedAt).getTime() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60 * 24))} Days
                                        </span>
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
