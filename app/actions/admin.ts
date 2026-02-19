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
        await prisma.complaint.update({
            where: { id: complaintId },
            data: { status }
        });

        revalidatePath('/admin');
        return { success: true };
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
