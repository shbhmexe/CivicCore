'use client';

import { useState } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Shield, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { getEscalationPreviewAction, sendManualEscalationAction } from '@/app/actions/escalation';
import { toast } from '@/components/ui/toaster';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function EscalationDialog({ complaintId, title }: { complaintId: string, title: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<{ authorityDetails: string, html: string, deptEmail: string } | null>(null);
    const [sending, setSending] = useState(false);
    const [editedAuthority, setEditedAuthority] = useState('');

    const handleOpenPreview = async () => {
        setLoading(true);
        try {
            const result = await getEscalationPreviewAction(complaintId);
            if (result.success) {
                setPreview({
                    authorityDetails: result.authorityDetails!,
                    html: result.html!,
                    deptEmail: result.deptEmail!
                });
                setEditedAuthority(result.authorityDetails!);
            } else {
                toast(result.error || 'Failed to load preview', 'error');
                setOpen(false);
            }
        } catch (err) {
            toast('Something went wrong', 'error');
            setOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        setSending(true);
        try {
            const result = await sendManualEscalationAction(complaintId, editedAuthority);
            if (result.success) {
                toast('Escalation email sent successfully!', 'success');
                setOpen(false);
                setPreview(null);
            } else {
                toast(result.error || 'Failed to send escalation', 'error');
            }
        } catch (err) {
            toast('Failed to send escalation', 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (val) handleOpenPreview();
            else setPreview(null);
        }}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-300 h-8 text-[10px] font-bold uppercase tracking-wider gap-2 px-3 pointer-events-auto relative z-10"
                >
                    <Shield className="w-3.5 h-3.5" />
                    AI Escalate
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-[#0f172a] border border-white/10 text-white shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-xl font-black">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <Shield className="w-5 h-5 text-amber-400" />
                        </div>
                        AI Escalation Preview
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 font-medium">
                        Review the AI-generated authority and email before sending the official escalation.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
                        <p className="text-sm font-bold text-gray-400 animate-pulse uppercase tracking-widest">Generating AI Preview...</p>
                    </div>
                ) : preview ? (
                    <div className="space-y-6">
                        <div className="grid gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Suggested Authority (AI)</label>
                                <Input 
                                    value={editedAuthority}
                                    onChange={(e) => setEditedAuthority(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white font-semibold text-sm h-10"
                                />
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Sending To</label>
                                    <Badge variant="outline" className="text-teal-400 border-teal-500/20 bg-teal-500/5 font-mono text-[11px] py-1 px-3 mt-1">
                                        {preview.deptEmail}
                                    </Badge>
                                </div>
                                <div className="text-right">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Status</label>
                                    <span className="text-[10px] font-black text-amber-400 uppercase bg-amber-500/10 px-2 py-1 rounded inline-block mt-1">Draft Ready</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute -top-3 left-4 px-2 bg-[#0f172a] text-[10px] font-bold text-gray-500 uppercase tracking-widest z-10">Email HTML Preview</div>
                            <div className="max-h-[300px] overflow-y-auto rounded-xl border border-white/10 bg-white p-4">
                                <div 
                                    dangerouslySetInnerHTML={{ __html: preview.html }} 
                                    className="scale-[0.85] origin-top text-black"
                                />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent pointer-events-none rounded-b-xl" />
                        </div>
                    </div>
                ) : null}

                <DialogFooter className="gap-3 sm:gap-2 mt-2">
                    <Button 
                        variant="ghost" 
                        onClick={() => setOpen(false)}
                        className="text-gray-400 hover:text-white hover:bg-white/5 font-bold uppercase text-[11px] tracking-widest"
                    >
                        Cancel
                    </Button>
                    <Button 
                        disabled={!preview || sending}
                        onClick={handleSend}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-[11px] tracking-widest h-10 px-8 shadow-lg shadow-amber-500/20"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail className="w-3.5 h-3.5 mr-2" />
                                Send Escalation
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
