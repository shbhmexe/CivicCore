'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteReport } from '@/app/actions/report';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";

interface DeleteComplaintButtonProps {
    complaintId: string;
    isOwner: boolean;
}

export function DeleteComplaintButton({ complaintId, isOwner }: DeleteComplaintButtonProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    if (!isOwner) return null;

    const handleDelete = async () => {
        startTransition(async () => {
            const result = await deleteReport(complaintId);
            if (result.success) {
                setOpen(false);
                router.push('/my-reports');
            } else {
                alert(result.error || "Failed to delete report");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete Report"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-white/10 bg-slate-900/95 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        Delete Report?
                    </DialogTitle>
                    <DialogDescription className="text-slate-300 pt-2">
                        This action cannot be undone. This will permanently delete your report and all associated data (votes, comments) from our servers.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <DialogClose asChild>
                        <Button variant="ghost" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button 
                        onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white border-none"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Delete Permanently"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
