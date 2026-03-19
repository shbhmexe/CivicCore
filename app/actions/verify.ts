'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function verifyIssueAction(complaintId: string, type: 'VERIFY' | 'IGNORE') {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    const userId = session.user.id;

    try {
        // Raw SQL check to bypass dev server Prisma generate locks
        const existing: any[] = await prisma.$queryRaw`
            SELECT id FROM "IssueVerification"
            WHERE "userId" = ${userId} AND "complaintId" = ${complaintId}
        `;

        if (existing.length > 0) {
            return { error: 'You have already responded to this verification request.' };
        }

        const newId = 'v' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

        await prisma.$transaction(async (tx) => {
            // Insert the verification record
            await tx.$executeRaw`
                INSERT INTO "IssueVerification" ("id", "userId", "complaintId", "type", "createdAt")
                VALUES (${newId}, ${userId}, ${complaintId}, ${type}, NOW())
            `;

            // Update the complaint counters
            if (type === 'VERIFY') {
                await tx.$executeRaw`
                    UPDATE "Complaint"
                    SET "totalVerifications" = "totalVerifications" + 1
                    WHERE id = ${complaintId}
                `;
            } else if (type === 'IGNORE') {
                await tx.$executeRaw`
                    UPDATE "Complaint"
                    SET "totalIgnores" = "totalIgnores" + 1
                    WHERE id = ${complaintId}
                `;
            }

            // Recalculate confidenceScore
            await tx.$executeRaw`
                UPDATE "Complaint"
                SET "confidenceScore" = CAST("totalVerifications" AS FLOAT) / ("totalVerifications" + "totalIgnores")
                WHERE id = ${complaintId} AND ("totalVerifications" + "totalIgnores") > 0
            `;
        });

        revalidatePath('/dashboard');
        revalidatePath(`/complaints/${complaintId}`);
        return { success: true };

    } catch (e: any) {
        console.error("Verification Error:", e);
        return { error: e.message || 'Verification failed.' };
    }
}
