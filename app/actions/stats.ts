'use server';

import prisma from '@/lib/prisma';

export async function getHomepageStats() {
    try {
        const total = await prisma.complaint.count();
        const inProgress = await prisma.complaint.count({
            where: { status: { in: ['IN_PROGRESS', 'ASSIGNED'] } }
        });
        const resolved = await prisma.complaint.count({
            where: { status: 'RESOLVED' }
        });

        // Get recent complaints with coordinates
        const recentPoints = await prisma.complaint.findMany({
            where: {
                latitude: { not: 0 },
                longitude: { not: 0 }
            },
            take: 50,
            orderBy: { createdAt: 'desc' },
            select: { id: true, latitude: true, longitude: true, title: true, severity: true, category: true }
        });

        const mapPoints = recentPoints.map(p => ({
            id: p.id,
            lat: p.latitude,
            lng: p.longitude,
            label: p.title,
            type: p.severity === 'CRITICAL' || p.severity === 'HIGH' ? 'high' : p.severity === 'MEDIUM' ? 'med' : 'low'
        }));

        return { success: true, total, inProgress, resolved, mapPoints };
    } catch (error) {
        console.error("Stats Error:", error);
        return { success: false, total: 0, inProgress: 0, resolved: 0, mapPoints: [] };
    }
}
