import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

export default async function AdminPage() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        redirect('/dashboard');
    }

    const complaints = await prisma.complaint.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: true }
    });

    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'RESOLVED').length;
    const resolveRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <AdminDashboard complaints={complaints as any} resolveRate={resolveRate} />
        </div>
    );
}
