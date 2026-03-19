'use client';

import { useState, useRef, useEffect } from 'react';
import { resolveComplaintAction } from '@/app/actions/report';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle2, Loader2, ImageIcon, X } from 'lucide-react';
import { getSocket } from '@/lib/socket';

interface ResolveSectionProps {
    complaintId: string;
    currentStatus: string;
    existingResolutionImage: string | null;
}

export function ResolveSection({ complaintId, currentStatus, existingResolutionImage }: ResolveSectionProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isResolving, setIsResolving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resolved, setResolved] = useState(currentStatus === 'RESOLVED');
    const [resolutionImage, setResolutionImage] = useState<string | null>(existingResolutionImage);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync with props when page refreshes via router.refresh()
    useEffect(() => {
        setResolved(currentStatus === 'RESOLVED');
    }, [currentStatus]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);

        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
    };

    const clearFile = () => {
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleResolve = async () => {
        if (!file) {
            setError('Please upload a resolution proof image');
            return;
        }

        setIsResolving(true);
        setError(null);

        const formData = new FormData();
        formData.append('complaintId', complaintId);
        formData.append('resolutionImage', file);

        const result = await resolveComplaintAction(formData) as any;

        if (result?.error) {
            setError(result.error);
        } else if (result?.success) {
            setResolved(true);
            setResolutionImage(preview);
            
            // Broadcast status change
            const socket = getSocket();
            socket.emit('status-update', { 
                complaintId, 
                status: 'RESOLVED',
                resolvedAt: new Date()
            });
            socket.emit('new-activity');

            // Notify the reporter if a notification was created
            if (result.targetUserId && result.notification) {
                socket.emit('send-notification', {
                    targetUserId: result.targetUserId,
                    notification: result.notification
                });
            }
        }
        setIsResolving(false);
    };

    // Already resolved — show the proof
    if (resolved && resolutionImage) {
        return (
            <div className="bg-green-50/50 border border-green-100 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <h3 className="text-base font-black text-green-600">Complaint Resolved</h3>
                </div>
                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-3">Resolution proof image:</p>
                <div className="rounded-xl overflow-hidden border border-green-100 shadow-sm">
                    <img
                        src={resolutionImage}
                        alt="Resolution proof"
                        className="w-full max-h-80 object-cover"
                    />
                </div>
            </div>
        );
    }

    // Not resolved yet — show upload form
    return (
        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-xl shadow-blue-900/5">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="text-sm font-black text-[#1e293b] uppercase tracking-wider">Resolve Case</h3>
            </div>
            <p className="text-xs font-medium text-[#64748b] leading-relaxed mb-6">
                Upload official proof of resolution. This will notify the citizen and close the ticket permanently.
            </p>

            {error && (
                <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {preview ? (
                <div className="relative mb-6">
                    <img src={preview} alt="Preview" className="w-full max-h-60 object-cover rounded-2xl border border-gray-100 shadow-md" />
                    <button
                        onClick={clearFile}
                        className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-md rounded-full text-red-500 shadow-lg hover:bg-white transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-12 border-2 border-dashed border-gray-200 rounded-2xl hover:border-teal-500 hover:bg-teal-50/50 transition-all text-[#64748b] flex flex-col items-center justify-center gap-3 mb-6"
                >
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                        <Upload className="w-6 h-6 opacity-40 shadow-sm" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">Click to upload proof</span>
                </button>
            )}

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />

            <Button
                onClick={handleResolve}
                disabled={!file || isResolving}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl disabled:opacity-40"
            >
                {isResolving ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Resolving...
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Mark as Resolved
                    </span>
                )}
            </Button>
        </div>
    );
}
