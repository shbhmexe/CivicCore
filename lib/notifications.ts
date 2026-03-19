import prisma from './prisma';

export type NotificationType = 'STATUS_CHANGE' | 'UPVOTE' | 'COMMENT';

interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    message: string;
    link?: string;
}

/**
 * Persists a notification to the database.
 * The client is responsible for emitting the socket event after the server action success.
 */
export async function createNotification({ userId, type, message, link }: CreateNotificationParams) {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                message,
                link,
            },
        });
        return notification;
    } catch (error) {
        console.error('[Notifications] Create Error:', error);
        return null;
    }
}
