'use server';

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function redeemReward(rewardName: string, pointsRequired: number) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const user = await (prisma.user as any).findUnique({
        where: { id: session.user.id },
        select: { karmaPoints: true }
    });

    if (!user || user.karmaPoints < pointsRequired) {
        return { success: false, error: "Insufficient Karma points" };
    }

    // Process redemption
    await (prisma as any).$transaction([
        // Deduct points
        (prisma.user as any).update({
            where: { id: session.user.id },
            data: { karmaPoints: { decrement: pointsRequired } }
        }),
        // Create redemption record
        (prisma.redemption as any).create({
            data: {
                userId: session.user.id,
                reward: rewardName,
                points: pointsRequired,
                // Generate a fake gift card code for demo
                code: Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + 
                      Math.random().toString(36).substring(2, 6).toUpperCase()
            }
        })
    ]);

    revalidatePath('/rewards');
    revalidatePath('/dashboard');
    
    return { success: true };
}
