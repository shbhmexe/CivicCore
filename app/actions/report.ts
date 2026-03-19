'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import cloudinary from "@/lib/cloudinary";
import { triggerResolutionCall, triggerConfirmationCall } from '@/lib/retell';
import { getDistanceInMeters, getTextEmbedding, cosineSimilarity, compareImages } from '@/lib/ai';
import { logActivity } from '@/lib/activity';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Cloudinary is used for image storage

const ReportSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    category: z.string().optional().default("General"),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    latitude: z.coerce.number().optional().default(0),
    longitude: z.coerce.number().optional().default(0),
    address: z.string().optional(),
    phoneNumber: z.string().optional(),
    image: z.any(),
    verificationMethod: z.enum(['CALL', 'VIDEO']).default('CALL'),
    video: z.any().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createReport(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    // Ensure user exists in DB (handles session from different DB state)
    try {
        await prisma.user.upsert({
            where: { id: session.user.id },
            update: {},
            create: {
                id: session.user.id,
                name: session.user.name || 'Citizen',
                email: session.user.email || `${session.user.id}@civiccore.app`,
                image: session.user.image || null,
            },
        });
    } catch (e) {
        console.error('[Action] User upsert error:', e);
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
        address: formData.get('address') || undefined,
        phoneNumber: formData.get('phoneNumber') || undefined,
        image: file,
        verificationMethod: formData.get('verificationMethod') || 'CALL',
        video: formData.get('video')
    });

    if (!validatedFields.success) {
        console.error('[Validation Error]', validatedFields.error.flatten().fieldErrors);
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    const { title, description, category, severity, latitude, longitude, address, phoneNumber, verificationMethod, video } = validatedFields.data;

    let videoUrl = null;
    if (verificationMethod === 'VIDEO' && video && video.size > 0) {
        try {
            const arrayBuffer = await video.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Upload video to Cloudinary
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { folder: 'complaints', resource_type: 'video' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(buffer);
            }) as any;

            videoUrl = result.secure_url;
            console.log(`[Cloudinary] Video upload success: ${videoUrl}`);
        } catch (e: any) {
            console.error("Cloudinary Video Upload Error Details:", e);
            return { error: `Video upload failed: ${e.message}` };
        }
    } else if (verificationMethod === 'VIDEO') {
        return { error: 'Video file is required for video verification' };
    }

    try {
        // Save phone number if provided
        if (phoneNumber && phoneNumber.length >= 10) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { phoneNumber }
            });
        }

        // --- AI DUPLICATE DETECTION LOGIC ---
        if (latitude && longitude) {
            // Find existing unresolved complaints
            const existingComplaints = await (prisma.complaint as any).findMany({
                where: {
                    status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
                },
                select: { id: true, title: true, description: true, latitude: true, longitude: true, votes: { select: { id: true, userId: true } } }
            });

            const nearbyComplaints = existingComplaints.filter((c: any) => {
                if (!c.latitude || !c.longitude) return false;
                const dist = getDistanceInMeters(latitude, longitude, c.latitude, c.longitude);
                return dist <= 500; // 500 meters radius
            });

            if (nearbyComplaints.length > 0) {
                console.log(`[AI Deduplication] Found ${nearbyComplaints.length} nearby complaints. Checking textual similarity...`);
                
                const incomingText = `${title}. ${description}`;
                const incomingEmbedding = await getTextEmbedding(incomingText);

                if (incomingEmbedding) {
                    let bestMatchId = null;
                    let highestSim = 0;

                    for (const c of nearbyComplaints) {
                        const existingText = `${c.title}. ${c.description}`;
                        const existingEmbedding = await getTextEmbedding(existingText);
                        
                        if (existingEmbedding) {
                            const sim = cosineSimilarity(incomingEmbedding, existingEmbedding);
                            console.log(`[AI Deduplication] Similarity with ${c.id}: ${(sim * 100).toFixed(1)}%`);
                            if (sim > 0.80 && sim > highestSim) { // >80% threshold
                                highestSim = sim;
                                bestMatchId = c.id;
                            }
                        }
                    }

                    if (bestMatchId) {
                        console.log(`[AI Deduplication] 🚨 DUPLICATE DETECTED! Merging into ${bestMatchId} (Sim: ${(highestSim * 100).toFixed(1)}%)`);
                        
                        // Add upvote to the original issue if user hasn't voted
                        const matchComplaint = nearbyComplaints.find((c: any) => c.id === bestMatchId);
                        const hasVoted = matchComplaint?.votes.some((v: any) => v.userId === session.user.id);

                        if (!hasVoted) {
                             await prisma.vote.create({
                                 data: { userId: session.user.id, complaintId: bestMatchId, type: 'UP' }
                             });
                             // Increment Karma for the reporter of the original issue
                             try {
                                  const originalReporter = await (prisma.complaint as any).findUnique({ where: { id: bestMatchId }, select: { userId: true }});
                                  if (originalReporter) {
                                       await prisma.user.update({ where: { id: originalReporter.userId }, data: { karmaPoints: { increment: 1 } }});
                                  }
                             } catch (e) {}
                        }

                        revalidatePath('/dashboard');
                        return { 
                            success: true, 
                            merged: true, 
                            originalComplaintId: bestMatchId,
                            complaintId: bestMatchId, // Return as complaintId so UI can redirect
                            userName: session.user.name || 'Citizen',
                            verificationMethod: verificationMethod
                        };
                    }
                }
            }
        }
        // --- DEPARTMENT AUTO-ASSIGNMENT LOGIC ---
        // Map category to standard department slug
        const categoryMap: Record<string, string> = {
            'pothole': 'roads',
            'garbage': 'sanitation',
            'water logging': 'water',
            'broken streetlight': 'electrical',
            'fallen tree': 'parks',
            'clean road': 'general'
        };
        const defaultDepartmentSlug = 'general';
        const targetSlug = categoryMap[category?.toLowerCase()] || defaultDepartmentSlug;

        // Ensure department exists (seed if missing)
        let department = await (prisma as any).department.findUnique({ where: { slug: targetSlug } });
        if (!department) {
            const departmentNames: Record<string, string> = {
                'roads': 'Roads & Infrastructure Authority',
                'sanitation': 'Sanitation & Waste Management',
                'water': 'Water & Drainage Board',
                'electrical': 'Electrical & Lighting Department',
                'parks': 'Parks & Urban Forestry',
                'general': 'General Municipal Services'
            };
            department = await (prisma as any).department.create({
                data: {
                    slug: targetSlug,
                    name: departmentNames[targetSlug] || 'Municipal Services',
                    email: `authority.${targetSlug}@civiccore.app` // Placeholder authority email
                }
            });
        }

        const newComplaint = await (prisma.complaint as any).create({
            data: {
                title,
                description,
                category,
                departmentId: department.id, // Assign to the mapped department
                severity: severity as any,
                latitude,
                longitude,
                address,
                images: [imageUrl],
                videoUrl,
                verificationMethod,
                userId: session.user.id,
                status: 'PENDING',
                isConfirmed: verificationMethod === 'VIDEO' ? true : false, // Auto confirm if video is provided
            },
            include: { user: true }
        });

        // Log for debugging
        console.log(`[Action] Report created: ${newComplaint.id} by ${newComplaint.user.name}`);

        // Log Activity
        await logActivity(
            'NEW_REPORT',
            `🆕 New ${category} issue reported: "${newComplaint.title}"`,
            newComplaint.id,
            session.user.id
        );

        // Return complaintId so client can show voice confirmation if method is CALL
        revalidatePath('/dashboard');
        return { 
            success: true, 
            complaintId: newComplaint.id,
            userName: newComplaint.user.name || 'Citizen',
            issueTitle: newComplaint.title,
            verificationMethod: newComplaint.verificationMethod,
            latitude: newComplaint.latitude,
            longitude: newComplaint.longitude
        };

    } catch (e) {
        console.error("DB Error", e);
        return { error: 'Database error' };
    }
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
        return await prisma.$transaction(async (tx) => {
            // Check if already voted
            const existingVote = await tx.vote.findUnique({
                where: { userId_complaintId: { userId, complaintId } }
            });

            if (existingVote) return { error: 'Already upvoted' };

            // Create Vote
            await tx.vote.create({
                data: { userId, complaintId, type: 'UP' }
            });

            // Increment User Karma (The Reporter, not the Voter)
            const complaint = await tx.complaint.findUnique({
                where: { id: complaintId },
                select: { userId: true, title: true, votes: { select: { id: true } } }
            });

            if (complaint && complaint.votes.length < 50) {
                await tx.user.update({
                    where: { id: complaint.userId },
                    data: { karmaPoints: { increment: 1 } }
                });
            }

            // High Votes Activity Broadcast
            if (complaint && (complaint.votes.length === 10 || complaint.votes.length === 50)) {
                await logActivity(
                    'HIGH_VOTES',
                    `🔥 "${complaint.title}" just reached ${complaint.votes.length} upvotes!`,
                    complaintId
                );
            }

            // Notification for the reporter
            let notification = null;
            if (complaint && complaint.userId !== userId) {
                notification = await tx.notification.create({
                    data: {
                        userId: complaint.userId,
                        type: 'UPVOTE',
                        message: `👍 Someone upvoted your report: "${complaint.title}"`,
                        link: `/complaints/${complaintId}`
                    }
                });
            }

            revalidatePath('/dashboard');
            
            return { 
                success: true, 
                targetUserId: complaint?.userId,
                notification 
            };
        });
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
        // Fetch the original complaint to get its images for AI comparison
        const originalComplaint = await (prisma.complaint as any).findUnique({
             where: { id: complaintId },
             select: { images: true }
        });

        let resolutionScore: number | null = null;
        if (originalComplaint?.images?.length > 0 && imageUrl) {
             const originalUrl = originalComplaint.images[0];
             resolutionScore = await compareImages(originalUrl, imageUrl);
        }

        await prisma.$transaction(async (tx) => {
            // Update Complaint
            const complaint = await (tx.complaint as any).update({
                where: { id: complaintId },
                data: {
                    status: 'RESOLVED',
                    resolutionImage: imageUrl,
                    resolutionScore, // Save AI Confidence Score
                    resolvedAt: new Date(),
                }
            });

            // Karma: +10 for verified report
            const updatedUser = await tx.user.update({
                where: { id: complaint.userId },
                data: { karmaPoints: { increment: 10 } }
            });

            // Retell AI: Trigger resolution call if phone number exists
            if (updatedUser.phoneNumber) {
                console.log(`[Action] Triggering Retell call for user: ${updatedUser.name}`);
                await triggerResolutionCall(
                    updatedUser.phoneNumber,
                    updatedUser.name || 'Citizen',
                    complaint.title
                );
            }

            // Log Activity
            await logActivity(
                'RESOLVED',
                `✅ Issue "${complaint.title}" has been resolved by authorities!`,
                complaintId,
                complaint.userId
            );

            // Notification for the reporter
            const notification = await (tx as any).notification.create({
                data: {
                    userId: complaint.userId,
                    type: 'STATUS_CHANGE',
                    message: `✅ Your report "${complaint.title}" has been RESOLVED! Thank you for your contribution.`,
                    link: `/complaints/${complaintId}`
                }
            });

            return { 
                success: true, 
                targetUserId: complaint.userId,
                notification 
            };
        });
    } catch (e) {
        console.error("Resolution Error", e);
        return { error: 'Resolution failed' };
    }
}

/**
 * Deletes a complaint. Only the owner or an ADMIN can perform this.
 */
export async function deleteReport(complaintId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    try {
        const complaint = await prisma.complaint.findUnique({
            where: { id: complaintId },
            select: { userId: true }
        });

        if (!complaint) {
            return { error: 'Complaint not found' };
        }

        // Check ownership or admin role
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (complaint.userId !== session.user.id && user?.role !== 'ADMIN') {
            return { error: 'You are not authorized to delete this report' };
        }

        // Deleting the complaint. Dependent records (votes, comments, verifications) 
        // will be deleted via Cascade as defined in schema.prisma
        await prisma.complaint.delete({
            where: { id: complaintId }
        });

        revalidatePath('/dashboard');
        revalidatePath('/my-reports');
        revalidatePath(`/complaints/${complaintId}`);

        return { success: true };
    } catch (error) {
        console.error('[Action] Delete error:', error);
        return { error: 'Failed to delete the report' };
    }
}
