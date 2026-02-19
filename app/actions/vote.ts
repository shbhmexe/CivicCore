'use server';

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleVote(complaintId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "You must be signed in to upvote" };
    }

    try {
        // Check if user already voted
        const existingVote = await prisma.vote.findUnique({
            where: {
                userId_complaintId: {
                    userId: session.user.id,
                    complaintId,
                },
            },
        });

        if (existingVote) {
            // Remove the vote (toggle off)
            await prisma.vote.delete({
                where: { id: existingVote.id },
            });
        } else {
            // Add new vote
            await prisma.vote.create({
                data: {
                    userId: session.user.id,
                    complaintId,
                    type: 'UPVOTE',
                },
            });
        }

        // Get updated vote count
        const voteCount = await prisma.vote.count({
            where: { complaintId },
        });

        revalidatePath(`/complaints/${complaintId}`);

        return {
            success: true,
            voted: !existingVote,
            voteCount,
        };
    } catch (error) {
        console.error("Vote error:", error);
        return { error: "Failed to process vote" };
    }
}

export async function getVoteStatus(complaintId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { voted: false, voteCount: 0 };
    }

    try {
        const [existingVote, voteCount] = await Promise.all([
            prisma.vote.findUnique({
                where: {
                    userId_complaintId: {
                        userId: session.user.id,
                        complaintId,
                    },
                },
            }),
            prisma.vote.count({
                where: { complaintId },
            }),
        ]);

        return {
            voted: !!existingVote,
            voteCount,
        };
    } catch (error) {
        console.error("Vote status error:", error);
        return { voted: false, voteCount: 0 };
    }
}
