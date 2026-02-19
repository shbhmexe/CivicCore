'use client';

import { useState, useRef } from 'react';
import { resolveComplaintAction } from '@/app/actions/report';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle2, Loader2, ImageIcon, X } from 'lucide-react';

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

        const result = await resolveComplaintAction(formData);

        if (result.error) {
            setError(result.error);
        } else {
            setResolved(true);
            setResolutionImage(preview);
        }
        setIsResolving(false);
    };

    // Already resolved — show the proof
    if (resolved && resolutionImage) {
        return (
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <h3 className="text-base font-bold text-green-400">Complaint Resolved</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3">Resolution proof image:</p>
                <div className="rounded-xl overflow-hidden border border-green-500/20">
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
        <div className="bg-gray-900/40 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Resolve with Proof</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">
                Upload a photo showing the issue has been fixed. This will be visible to the citizen.
            </p>

            {error && (
                <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {preview ? (
                <div className="relative mb-4">
                    <img src={preview} alt="Preview" className="w-full max-h-60 object-cover rounded-xl border border-white/10" />
                    <button
                        onClick={clearFile}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-10 border-2 border-dashed border-white/10 rounded-xl hover:border-teal-500/30 hover:bg-teal-500/5 transition-all text-gray-500 flex flex-col items-center justify-center gap-2 mb-4"
                >
                    <Upload className="w-8 h-8 opacity-50" />
                    <span className="text-sm">Click to upload resolution image</span>
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
