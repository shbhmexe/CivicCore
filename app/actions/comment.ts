'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function addComment(complaintId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    if (!content.trim()) {
        return { error: 'Comment cannot be empty' };
    }

    try {
        const comment = await prisma.comment.create({
            data: {
                complaintId,
                userId: session.user.id,
                content: content.trim(),
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, image: true, role: true }
                }
            }
        });

        revalidatePath(`/admin/complaints/${complaintId}`);
        return { success: true, comment };
    } catch (error) {
        console.error("Failed to add comment:", error);
        return { error: "Failed to add comment" };
    }
}

export async function getComments(complaintId: string) {
    try {
        const comments = await prisma.comment.findMany({
            where: { complaintId },
            orderBy: { createdAt: 'asc' },
            include: {
                user: {
                    select: { id: true, name: true, email: true, image: true, role: true }
                }
            }
        });

        return { comments };
    } catch (error) {
        console.error("Failed to fetch comments:", error);
        return { error: "Failed to fetch comments", comments: [] };
    }
}
export async function clearComments(complaintId: string) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return { error: 'Unauthorized: Admin access required' };
    }

    try {
        await prisma.comment.deleteMany({
            where: { complaintId }
        });

        revalidatePath(`/admin/complaints/${complaintId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to clear comments:", error);
        return { error: "Failed to clear comments" };
    }
}
