'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateComplaintStatus(complaintId: string, status: any) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        throw new Error("Unauthorized");
    }

    try {
        const updateData: any = { status };
        if (status === 'RESOLVED') {
            updateData.resolvedAt = new Date();
        }

        const complaint = await prisma.complaint.update({
            where: { id: complaintId },
            data: updateData,
            include: { user: { select: { id: true, name: true } } }
        });

        // Create notification for the user
        const notification = await (prisma as any).notification.create({
            data: {
                userId: complaint.userId,
                type: 'STATUS_CHANGE',
                message: `📢 Your report "${complaint.title}" status has been updated to ${status.replace('_', ' ')}.`,
                link: `/complaints/${complaintId}`
            }
        });

        revalidatePath('/admin');
        revalidatePath(`/complaints/${complaintId}`);
        revalidatePath('/my-reports');
        
        return { 
            success: true, 
            complaint, 
            notification,
            targetUserId: complaint.userId 
        };
    } catch (error) {
        console.error("Failed to update status:", error);
        return { error: "Failed to update status" };
    }
}

export async function deleteComplaint(complaintId: string) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        throw new Error("Unauthorized");
    }

    try {
        await prisma.complaint.delete({
            where: { id: complaintId }
        });

        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete complaint:", error);
        return { error: "Failed to delete complaint" };
    }
}
