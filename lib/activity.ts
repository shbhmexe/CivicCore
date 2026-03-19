import prisma from '@/lib/prisma';

export async function logActivity(type: string, content: string, complaintId?: string, userId?: string) {
    try {
        const newId = 'c' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        
        await prisma.$executeRaw`
            INSERT INTO "Activity" ("id", "type", "content", "complaintId", "userId", "createdAt")
            VALUES (${newId}, ${type}, ${content}, ${complaintId || null}, ${userId || null}, NOW())
        `;
        console.log(`[Activity Logged] ${type}: ${content}`);
    } catch (e) {
        console.error("[Activity Log Error]", e);
    }
}
