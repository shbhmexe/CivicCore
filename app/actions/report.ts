'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import cloudinary from "@/lib/cloudinary";

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Cloudinary is used for image storage

const ReportSchema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    category: z.string(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    address: z.string().optional(),
    image: z.any(), // File object validation is tricky in Zod/Server Actions
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createReport(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    const file = formData.get('image') as File;
    let imageUrl = '';

    if (file && file.size > 0) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Upload to Cloudinary
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { folder: 'complaints' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(buffer);
            }) as any;

            imageUrl = result.secure_url;
            console.log(`[Cloudinary] Upload success: ${imageUrl}`);
        } catch (e: any) {
            console.error("Cloudinary Upload Error Details:", e);
            return { error: `Image upload failed: ${e.message}` };
        }
    } else {
        return { error: 'Image is required' };
    }

    const validatedFields = ReportSchema.safeParse({
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        severity: formData.get('severity'),
        latitude: formData.get('latitude'),
        longitude: formData.get('longitude'),
        address: formData.get('address'),
        image: file
    });

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    const { title, description, category, severity, latitude, longitude, address } = validatedFields.data;

    try {
        await prisma.complaint.create({
            data: {
                title,
                description,
                category,
                severity: severity as any,
                latitude,
                longitude,
                address,
                images: [imageUrl],
                userId: session.user.id,
                status: 'PENDING',
            },
        });

        // Gamification: Initial points for reporting? 
        // Plan says: Verified Report: +10. So PENDING gets 0.

    } catch (e) {
        console.error("DB Error", e);
        return { error: 'Database error' };
    }

    revalidatePath('/dashboard');
    redirect('/dashboard');
}

export async function analyzeImageAction(formData: FormData) {
    // This action is called by the client to get AI suggestions before submitting
    // We strictly do not save anything here, just analyze
    const file = formData.get('image') as File;
    if (!file) return { error: 'No file' };

    // We can't easily pass File to HF Inference API directly from Server Action without uploading or buffering
    // But we can return mock data or try real analysis if we have the buffer

    // For Hackathon Demo:
    // If we have a file, return some mocked/realistic AI data based on file name or random
    // OR try to categorize the text description if provided
    return {
        category: 'Pothole',
        severity: 'HIGH'
    };
}

export async function upvoteComplaint(complaintId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    const userId = session.user.id;

    try {
        await prisma.$transaction(async (tx) => {
            // Check if already voted
            const existingVote = await tx.vote.findUnique({
                where: { userId_complaintId: { userId, complaintId } }
            });

            if (existingVote) return; // Already voted

            // Create Vote
            await tx.vote.create({
                data: { userId, complaintId, type: 'UP' }
            });

            // Increment User Karma (The Reporter, not the Voter)
            // Cap at 50 points per issue? Logic:
            const complaint = await tx.complaint.findUnique({
                where: { id: complaintId },
                select: { userId: true, votes: { select: { id: true } } }
            });

            if (complaint && complaint.votes.length < 50) {
                await tx.user.update({
                    where: { id: complaint.userId },
                    data: { karmaPoints: { increment: 1 } }
                });
            }
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (e) {
        console.error("Vote Error", e);
        return { error: "Failed to vote" };
    }
}

export async function resolveComplaintAction(formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { error: 'Unauthorized' };

    const complaintId = formData.get('complaintId') as string;
    const file = formData.get('resolutionImage') as File;
    let imageUrl = '';

    if (file && file.size > 0) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Upload resolution image to Cloudinary
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { folder: 'resolutions' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(buffer);
            }) as any;

            imageUrl = result.secure_url;
            console.log(`[Cloudinary] Resolution Upload success: ${imageUrl}`);
        } catch (e: any) {
            console.error("Cloudinary Resolution Upload Error Details:", e);
            return { error: `Upload failed: ${e.message}` };
        }
    } else {
        return { error: 'Resolution image required' };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Update Complaint
            const complaint = await tx.complaint.update({
                where: { id: complaintId },
                data: {
                    status: 'RESOLVED',
                    resolutionImage: imageUrl,
                    resolvedAt: new Date(),
                }
            });

            // Karma: +10 for verified report
            await tx.user.update({
                where: { id: complaint.userId },
                data: { karmaPoints: { increment: 10 } }
            });

            // Send Email (Resend) - Mocked for hackathon if no key
            // console.log("Sending email to user...");
        });
    } catch (e) {
        return { error: 'Resolution failed' };
    }

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true };
}
