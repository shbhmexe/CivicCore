'use server';

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";

export async function updateProfileImage(formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) {
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

        // Update User in Database
        await prisma.user.update({
            where: { email: session.user.email },
            data: { image: newImageUrl }
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
        return { error: "Unauthorized" };
    }

    try {
        const user = await prisma.user.findUnique({
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
            },
        });

        if (!user) return { error: "User not found" };

        return {
            karmaPoints: user.karmaPoints,
            reportCount: user.complaints.length,
            reports: user.complaints.map(c => ({
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
        };
    } catch (error) {
        console.error("Fetch profile error:", error);
        return { error: "Failed to load profile" };
    }
}
