import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import {
    ArrowLeft, MapPin, Calendar, Shield, User, AlertTriangle, Clock,
    CheckCircle2, XCircle, Hash, Eye, Tag
} from 'lucide-react';
import Link from 'next/link';
import { CommentSection } from '@/components/admin/comment-section';
import { ResolveSection } from '@/components/admin/resolve-section';
import { StatusSelect } from '@/components/admin/status-select';
import { UpvoteButton } from '@/components/complaint/upvote-button';

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
        <div className="min-h-screen bg-[#0a0a12] pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Back button */}
            <Link
                href={isAdmin ? '/admin' : '/dashboard'}
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to {isAdmin ? 'Admin Command Center' : 'Dashboard'}
            </Link>

            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gray-900/50 border border-white/10 shadow-2xl backdrop-blur-xl mb-6">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-purple-500/10 blur-3xl opacity-50" />
                <div className="relative p-6 sm:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${severity.bg} ${severity.color} ${severity.border} border`}>
                                    <AlertTriangle className="w-3 h-3" />
                                    {complaint.severity}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${status.bg} ${status.color}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {complaint.status.replace('_', ' ')}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/5 text-gray-400">
                                    <Tag className="w-3 h-3" />
                                    {complaint.category}
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
                                {complaint.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
                                        day: 'numeric', month: 'long', year: 'numeric'
                                    })}
                                </span>
                                {complaint.address && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {complaint.address}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Hash className="w-3.5 h-3.5" />
                                    {complaint.id.slice(0, 8)}
                                </span>
                            </div>
                        </div>

                        {/* Status control (admin only) */}
                        {isAdmin && (
                            <div className="flex-shrink-0">
                                <StatusSelect
                                    complaintId={complaint.id}
                                    currentStatus={complaint.status}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column — Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="bg-gray-900/40 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-3">Description</h2>
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {complaint.description}
                        </p>
                    </div>

                    {/* Report Image */}
                    {complaint.images && complaint.images.length > 0 && (
                        <div className="bg-gray-900/40 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-3">Report Evidence</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {complaint.images.map((img, i) => (
                                    <div key={i} className="rounded-xl overflow-hidden border border-white/10">
                                        <img src={img} alt={`Evidence ${i + 1}`} className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upvote + Comments Section */}
                    <div className="flex items-center gap-3 mb-4">
                        <UpvoteButton
                            complaintId={complaint.id}
                            initialVoteCount={initialVoteCount}
                            initialVoted={userHasVoted}
                        />
                        <span className="text-xs text-gray-500">
                            {complaint._count.comments} comment{complaint._count.comments !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Comments Section */}
                    <CommentSection
                        complaintId={complaint.id}
                        currentUserId={session.user.id!}
                        currentUserRole={session.user.role!}
                    />
                </div>

                {/* Right column — Sidebar */}
                <div className="space-y-6">
                    {/* Reporter info */}
                    <div className="bg-gray-900/40 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4">Reporter</h2>
                        <div className="flex items-center gap-3">
                            {complaint.user.image ? (
                                <img src={complaint.user.image} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-teal-500/30" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
                                    <span className="text-sm font-bold text-white">{displayName.charAt(0).toUpperCase()}</span>
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-semibold text-white">{displayName}</p>
                                <p className="text-[11px] text-gray-500">{complaint.user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-gray-900/40 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4">Stats</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Upvotes</span>
                                <UpvoteButton
                                    complaintId={complaint.id}
                                    initialVoteCount={initialVoteCount}
                                    initialVoted={userHasVoted}
                                />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Comments</span>
                                <span className="text-white font-bold">{complaint._count.comments}</span>
                            </div>
                            {complaint.resolvedAt && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Resolved</span>
                                    <span className="text-green-400 font-bold">
                                        {new Date(complaint.resolvedAt).toLocaleDateString('en-IN')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Resolve Section (admin only) */}
                    {isAdmin && (
                        <ResolveSection
                            complaintId={complaint.id}
                            currentStatus={complaint.status}
                            existingResolutionImage={complaint.resolutionImage}
                        />
                    )}

                    {/* Show resolution proof to citizen */}
                    {!isAdmin && complaint.status === 'RESOLVED' && complaint.resolutionImage && (
                        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                                <h3 className="text-sm font-bold text-green-400">Issue Resolved!</h3>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">The administration has resolved this issue:</p>
                            <div className="rounded-xl overflow-hidden border border-green-500/20">
                                <img src={complaint.resolutionImage} alt="Resolution proof" className="w-full max-h-60 object-cover" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
