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
import { Loader2, Mail, ShieldCheck, Save } from 'lucide-react';
import { getEscalationPreviewAction, sendManualEscalationAction, saveEscalationRoutingAction } from '@/app/actions/escalation';
import { toast } from '@/components/ui/toaster';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function EscalationDialog({ complaintId, title }: { complaintId: string, title: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<{ authorityDetails: string, html: string, deptEmail: string, isCustom?: boolean } | null>(null);
    const [sending, setSending] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editedAuthority, setEditedAuthority] = useState('');
    const [editedEmail, setEditedEmail] = useState('');

    const handleOpenPreview = async () => {
        setLoading(true);
        try {
            const result = await getEscalationPreviewAction(complaintId);
            if (result.success) {
                setPreview({
                    authorityDetails: result.authorityDetails!,
                    html: result.html!,
                    deptEmail: result.deptEmail!,
                    isCustom: result.isCustom
                });
                setEditedAuthority(result.authorityDetails!);
                setEditedEmail(result.deptEmail!);
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
            const result = await sendManualEscalationAction(complaintId, editedAuthority, editedEmail);
            if (result.success) {
                toast('Escalation email sent successfully!', 'success');
                setOpen(false);
                setPreview(null);
            } else {
                toast(result.error || 'Failed to send email', 'error');
            }
        } catch (error: any) {
            toast(error.message || 'An unexpected error occurred', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await saveEscalationRoutingAction(complaintId, editedAuthority, editedEmail);
            if (result.success) {
                toast('Routing details saved successfully!', 'success');
                if (preview) setPreview({ ...preview, isCustom: true });
            } else {
                toast(result.error || 'Failed to save routing', 'error');
            }
        } catch (error: any) {
            toast(error.message || 'An unexpected error occurred', 'error');
        } finally {
            setSaving(false);
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
                    <ShieldCheck className="w-3.5 h-3.5" />
                    AI Escalate
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-[#0f172a] border border-white/10 text-white shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-xl font-black">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-amber-400" />
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">
                                        Suggested Authority (AI)
                                        {preview.isCustom && <span className="ml-2 text-[9px] text-teal-400 border border-teal-500/30 px-1 rounded animate-pulse">VERIFIED</span>}
                                    </label>
                                    <Input 
                                        value={editedAuthority}
                                        onChange={(e) => setEditedAuthority(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white font-semibold text-sm h-10"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Authority Contact Email</label>
                                    <Input 
                                        value={editedEmail}
                                        onChange={(e) => setEditedEmail(e.target.value)}
                                        className="bg-white/5 border-white/10 text-teal-400 font-mono text-sm h-10"
                                        placeholder="email@authority.gov.in"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Original Dept Routing</label>
                                    <Badge variant="outline" className="text-gray-500 border-white/10 bg-white/5 font-mono text-[10px] py-0.5 px-2 mt-1">
                                        {preview.deptEmail}
                                    </Badge>
                                </div>
                                <div className="text-right">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Status</label>
                                    <span className="text-[10px] font-black text-amber-400 uppercase bg-amber-500/10 px-2 py-1 rounded inline-block mt-1">Draft Ready</span>
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

                <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6 bg-slate-900/50 p-4 -mx-6 -mb-6 rounded-b-2xl">
                    <Button 
                        variant="ghost" 
                        onClick={() => setOpen(false)}
                        className="text-gray-400 hover:text-white hover:bg-white/5 font-bold uppercase text-[11px] tracking-widest"
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={handleSave} 
                        disabled={!preview || sending || saving}
                        className="border-white/10 hover:bg-white/5 text-gray-400 gap-2"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Routing
                    </Button>
                    <Button 
                        onClick={handleSend} 
                        disabled={!preview || sending || saving}
                        className="bg-teal-600 hover:bg-teal-500 text-white gap-2 px-6 shadow-lg shadow-teal-500/20 border-0"
                    >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        Send Escalation Now
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
