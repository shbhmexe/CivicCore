import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ComplaintList } from '@/components/dashboard/complaint-list';
import { ComplaintMap } from '@/components/dashboard/complaint-map';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const session = await auth();

    if (session?.user?.role === 'ADMIN') {
        redirect('/admin');
    }

    // Fetch complaints with relations
    const complaints = await prisma.complaint.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            votes: true,
            _count: {
                select: { comments: true }
            }
        }
    });

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Community Dashboard</h1>
                    <p className="text-muted-foreground">Real-time overview of infrastructure issues in your area.</p>
                </div>

                <Link href="/report">
                    <Button className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-lg shadow-teal-500/20">
                        <Plus className="mr-2 h-4 w-4" />
                        New Report
                    </Button>
                </Link>
            </div>

            {/* Map Section */}
            <section className="w-full">
                <ComplaintMap complaints={complaints as any} />
            </section>

            {/* List Section */}
            <section>
                <h2 className="text-2xl font-semibold mb-6 text-white">Recent Reports</h2>
                <ComplaintList complaints={complaints} userId={session?.user?.id} />
            </section>
        </div>
    );
}
