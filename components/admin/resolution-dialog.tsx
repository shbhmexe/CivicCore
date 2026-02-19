'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { resolveComplaintAction } from '@/app/actions/report';
import { Upload, X, Loader2, CheckCircle2, ImageIcon } from 'lucide-react';
import Image from 'next/image';

export function ResolutionDialog({ complaintId }: { complaintId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target?.result as string);
            reader.readAsDataURL(selected);
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (!file) return;
        setLoading(true);

        const formData = new FormData();
        formData.append('complaintId', complaintId);
        formData.append('resolutionImage', file);

        const result = await resolveComplaintAction(formData);

        setLoading(false);

        if (result?.success) {
            setOpen(false);
            clearFile();
            router.refresh();
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) clearFile(); }}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                    Resolve
                </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel text-white border-white/20 max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        Mark Issue as Resolved
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Upload resolution proof photo. This awards +10 Karma to the reporter.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    {/* Upload Area */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {!preview ? (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-48 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-green-500/50 hover:bg-green-500/5 transition-all duration-200 cursor-pointer group"
                        >
                            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20 group-hover:bg-green-500/20 transition-colors">
                                <Upload className="w-6 h-6 text-green-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-white">Click to upload proof image</p>
                                <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP • Max 10MB</p>
                            </div>
                        </button>
                    ) : (
                        <div className="relative rounded-xl overflow-hidden border border-white/10">
                            <div className="relative w-full h-48">
                                <Image src={preview} alt="Resolution proof preview" fill className="object-cover" />
                            </div>
                            <button
                                onClick={clearFile}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg hover:bg-red-500/80 transition-colors"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-green-500/80 rounded-md">
                                <ImageIcon className="w-3 h-3 text-white" />
                                <span className="text-[10px] font-bold text-white">{file?.name}</span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-2">
                    <Button type="button" variant="ghost" onClick={() => { setOpen(false); clearFile(); }} className="text-gray-400">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!file || loading}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-40"
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading...</>
                        ) : (
                            <><CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Resolution</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
