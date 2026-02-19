'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Hash,
    MapPin,
    BarChart3,
    Calendar,
    ArrowUpRight,
    Shield,
    Eye,
} from 'lucide-react';
import { StatusSelect } from '@/components/admin/status-select';
import { ResolutionDialog } from '@/components/admin/resolution-dialog';
import Link from 'next/link';

interface ComplaintUser {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
}

interface Complaint {
    id: string;
    title: string;
    description: string;
    category: string;
    severity: string | null;
    status: string;
    address: string | null;
    createdAt: string;
    user: ComplaintUser;
}

type FilterType = 'ALL' | 'PENDING' | 'ACTIVE' | 'RESOLVED' | 'REJECTED';

export function AdminDashboard({ complaints, resolveRate }: { complaints: Complaint[]; resolveRate: number }) {
    const [filter, setFilter] = useState<FilterType>('ALL');

    const stats = {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'PENDING').length,
        active: complaints.filter(c => c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS').length,
        resolved: complaints.filter(c => c.status === 'RESOLVED').length,
        rejected: complaints.filter(c => c.status === 'REJECTED').length,
    };

    const filteredComplaints = complaints.filter(c => {
        switch (filter) {
            case 'PENDING': return c.status === 'PENDING';
            case 'ACTIVE': return c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS';
            case 'RESOLVED': return c.status === 'RESOLVED';
            case 'REJECTED': return c.status === 'REJECTED';
            default: return c.status !== 'RESOLVED' && c.status !== 'REJECTED';
        }
    });

    const filterLabel = filter === 'ALL' ? 'Active Reports' : filter === 'ACTIVE' ? 'Active (Assigned + In Progress)' : filter;

    return (
        <>
            {/* Hero Header */}
            <div className="relative mb-8 p-8 rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d1117 0%, #1a2332 50%, #0f1923 100%)' }}>
                <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 20% 50%, #14b8a6 0%, transparent 50%), radial-gradient(circle at 80% 50%, #3b82f6 0%, transparent 50%)' }} />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-teal-500/20 rounded-xl border border-teal-500/30">
                                <Shield className="w-6 h-6 text-teal-400" />
                            </div>
                            <span className="text-teal-400 text-sm font-bold tracking-widest uppercase">Municipal Admin</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">
                            Admin Command Center
                        </h1>
                        <p className="text-gray-400 mt-2 text-base max-w-xl">
                            Real-time oversight of citizen-reported infrastructure issues. Manage, assign, and resolve municipal complaints.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="px-5 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm text-center">
                            <p className="text-3xl font-extrabold text-teal-400">{resolveRate}%</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">Resolution Rate</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
                <StatCard label="Total" value={stats.total} icon={Hash} gradient="from-slate-600 to-slate-700" active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
                <StatCard label="Pending" value={stats.pending} icon={Clock} gradient="from-yellow-600 to-amber-700" active={filter === 'PENDING'} onClick={() => setFilter('PENDING')} />
                <StatCard label="Active" value={stats.active} icon={AlertTriangle} gradient="from-orange-600 to-red-700" active={filter === 'ACTIVE'} onClick={() => setFilter('ACTIVE')} />
                <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} gradient="from-green-600 to-emerald-700" active={filter === 'RESOLVED'} onClick={() => setFilter('RESOLVED')} />
                <StatCard label="Rejected" value={stats.rejected} icon={ArrowUpRight} gradient="from-red-600 to-rose-700" active={filter === 'REJECTED'} onClick={() => setFilter('REJECTED')} />
            </div>

            {/* Reports Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-teal-400" />
                        Citizen Reports
                    </h2>
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                        {filteredComplaints.length} {filterLabel}
                    </span>
                </div>

                {filteredComplaints.length === 0 ? (
                    <div className="p-16 text-center rounded-2xl border border-white/5 bg-white/[0.02]">
                        <Eye className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">
                            {filter === 'ALL' ? 'No active reports to manage.' : `No ${filter.toLowerCase()} reports.`}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {filteredComplaints.map((complaint) => (
                            <div
                                key={complaint.id}
                                className="group relative p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.15] transition-all duration-300"
                            >
                                {/* Background Link (for card click) */}
                                <Link
                                    href={`/complaints/${complaint.id}`}
                                    className="absolute inset-0 z-0"
                                    aria-label={`View details for ${complaint.title}`}
                                />

                                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-4 pointer-events-none">

                                    {/* Report Info */}
                                    <div className="flex-1 min-w-0 pointer-events-none">
                                        <div className="flex items-start gap-3">
                                            <div className={cn(
                                                "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border",
                                                complaint.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    complaint.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                        complaint.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            )}>
                                                {complaint.severity?.charAt(0) || 'L'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-base font-bold text-white group-hover:text-teal-400 transition-colors truncate">
                                                    {complaint.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                                        {complaint.category}
                                                    </span>
                                                    <span className={cn(
                                                        "inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                                                        complaint.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                            complaint.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                                complaint.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    )}>
                                                        {complaint.severity || 'MEDIUM'}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[11px] text-gray-600">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="flex items-center gap-1.5 text-gray-400 lg:w-48 flex-shrink-0 pointer-events-none">
                                        <MapPin className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                                        <span className="text-xs truncate">
                                            {complaint.address || "Coordinates pending..."}
                                        </span>
                                    </div>

                                    {/* Status - Clickable */}
                                    <div className="flex-shrink-0 pointer-events-auto">
                                        <StatusSelect complaintId={complaint.id} currentStatus={complaint.status} />
                                    </div>

                                    {/* Reporter */}
                                    <div className="flex items-center gap-2 lg:w-36 flex-shrink-0 pointer-events-none">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500/30 to-blue-500/30 flex items-center justify-center border border-white/10">
                                            <span className="text-[10px] font-bold text-white uppercase">
                                                {(complaint.user.name || complaint.user.email || '?').charAt(0)}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-300 truncate">
                                            {complaint.user.name || complaint.user.email?.split('@')[0] || 'Anonymous'}
                                        </span>
                                    </div>

                                    {/* Actions - Clickable */}
                                    <div className="flex items-center gap-2 flex-shrink-0 pointer-events-auto">
                                        {complaint.status !== 'RESOLVED' && complaint.status !== 'REJECTED' && (
                                            <ResolutionDialog complaintId={complaint.id} />
                                        )}
                                        {complaint.status === 'RESOLVED' && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                                <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Done</span>
                                            </div>
                                        )}
                                        {complaint.status === 'REJECTED' && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
                                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Closed</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function StatCard({ label, value, icon: Icon, gradient, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative p-4 rounded-2xl overflow-hidden border transition-all duration-200 text-left w-full cursor-pointer",
                "bg-gradient-to-br", gradient,
                active ? "border-teal-400/50 ring-2 ring-teal-400/30 scale-[1.02]" : "border-white/5 hover:border-white/20 hover:scale-[1.01]"
            )}
        >
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{label}</p>
                    <p className="text-2xl font-extrabold text-white mt-0.5">{value}</p>
                </div>
                <Icon className={cn("w-5 h-5", active ? "text-teal-400" : "text-white/40")} />
            </div>
        </button>
    );
}
