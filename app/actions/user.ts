'use server';

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";

export async function updateProfileImage(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
        return { error: "Unauthorized" };
    }

    const file = formData.get('image') as File;
    if (!file) {
        return { error: "No file provided" };
    }

    try {
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Cloudinary
        const uploadResult = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: "civic-core/profiles",
                    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });

        const newImageUrl = uploadResult.secure_url;
        console.log(`[DEBUG] Attempting update for user ID: ${session.user.id}, Email: ${session.user.email}`);

        // Upsert User in Database (Prevents "Record not found" error)
        await prisma.user.upsert({
            where: { id: session.user.id },
            update: { image: newImageUrl },
            create: {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name || session.user.email.split('@')[0],
                image: newImageUrl,
                role: session.user.role || 'CITIZEN',
            }
        });

        revalidatePath('/profile');
        revalidatePath('/'); // For navbar

        return { success: true, imageUrl: newImageUrl };

    } catch (error) {
        console.error("Image upload failed:", error);
        return { error: "Image upload failed" };
    }
}

export async function getUserProfile() {
    const session = await auth();
    if (!session?.user?.id) {
        console.log("[DEBUG] No session user found");
        return { error: "Unauthorized" };
    }

    try {
        let user = await (prisma.user as any).findUnique({
            where: { id: session.user.id },
            select: {
                karmaPoints: true,
                complaints: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        severity: true,
                        status: true,
                        address: true,
                        images: true,
                        createdAt: true,
                        _count: { select: { votes: true, comments: true } },
                    },
                },
                redemptions: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!user && session.user.email) {
            user = await (prisma.user as any).findUnique({
                where: { email: session.user.email },
                select: {
                    karmaPoints: true,
                    complaints: {
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            title: true,
                            category: true,
                            severity: true,
                            status: true,
                            address: true,
                            images: true,
                            createdAt: true,
                            _count: { select: { votes: true, comments: true } },
                        },
                    },
                    redemptions: {
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });
        }

        if (!user) return { error: "User not found" };

        return {
            karmaPoints: user.karmaPoints,
            reportCount: user.complaints.length,
            reports: user.complaints.map((c: any) => ({
                id: c.id,
                title: c.title,
                category: c.category,
                severity: c.severity,
                status: c.status,
                address: c.address,
                image: c.images?.[0] || null,
                createdAt: c.createdAt.toISOString(),
                votes: c._count.votes,
                comments: c._count.comments,
            })),
            redemptions: user.redemptions.map((r: any) => ({
                id: r.id,
                reward: r.reward,
                points: r.points,
                code: r.code,
                createdAt: r.createdAt.toISOString()
            }))
        };
    } catch (error) {
        console.error("Fetch profile error:", error);
        return { error: "Failed to load profile" };
    }
}
