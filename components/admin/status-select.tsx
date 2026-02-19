'use client';

import { useState, useRef, useEffect } from 'react';
import { updateComplaintStatus } from '@/app/actions/admin';
import { cn } from '@/lib/utils';
import { ChevronDown, Loader2, Check } from 'lucide-react';

const STATUS_OPTIONS = [
    { label: 'Pending', value: 'PENDING', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { label: 'Assigned', value: 'ASSIGNED', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { label: 'In Progress', value: 'IN_PROGRESS', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { label: 'Resolved', value: 'RESOLVED', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { label: 'Rejected', value: 'REJECTED', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

export function StatusSelect({ complaintId, currentStatus }: { complaintId: string, currentStatus: string }) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(currentStatus);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleChange = async (newStatus: string) => {
        if (newStatus === status) { setOpen(false); return; }
        setLoading(true);
        setOpen(false);
        const result = await updateComplaintStatus(complaintId, newStatus);
        if (result.success) {
            setStatus(newStatus);
        }
        setLoading(false);
    };

    const currentOption = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                    currentOption.color,
                    open && "ring-2 ring-white/10"
                )}
            >
                {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <span className="tracking-wide">{currentOption.label}</span>
                )}
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
            </button>

            {open && (
                <div className="absolute left-0 mt-2 w-44 bg-[#0f111a] border border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {STATUS_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleChange(option.value)}
                            className={cn(
                                "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-white/5 transition-colors flex items-center justify-between gap-2",
                                status === option.value ? "text-white bg-white/5" : "text-gray-400"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    option.value === 'PENDING' ? 'bg-yellow-400' :
                                        option.value === 'ASSIGNED' ? 'bg-blue-400' :
                                            option.value === 'IN_PROGRESS' ? 'bg-orange-400' :
                                                option.value === 'RESOLVED' ? 'bg-green-400' :
                                                    'bg-red-400'
                                )} />
                                {option.label}
                            </div>
                            {status === option.value && <Check className="w-3.5 h-3.5 text-teal-400" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
