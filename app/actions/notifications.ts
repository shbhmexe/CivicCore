'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
    const session = await auth();
    if (!session?.user?.id) return { notifications: [] };

    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        return { notifications };
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return { notifications: [] };
    }
}

export async function markAsRead(notificationId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    try {
        await prisma.notification.update({
            where: { id: notificationId, userId: session.user.id },
            data: { isRead: true }
        });

        revalidatePath('/'); // Revalidate to update badge count
        return { success: true };
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
        return { error: 'Failed' };
    }
}

export async function markAllAsRead() {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    try {
        await prisma.notification.updateMany({
            where: { userId: session.user.id, isRead: false },
            data: { isRead: true }
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to mark all notifications as read:", error);
        return { error: 'Failed' };
    }
}
