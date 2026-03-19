import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ComplaintList } from '@/components/dashboard/complaint-list';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function MyReportsPage() {
    const session = await auth();

    // Ensure the user is logged in
    if (!session || !session.user) {
        redirect('/auth/signin');
    }

    // Fetch complaints specifically for the logged-in user
    const complaints = await prisma.complaint.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
            department: true,
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
                    <h1 className="text-3xl font-bold tracking-tight mb-2 text-[#1e293b]">My Reports</h1>
                    <p className="text-gray-500">View and track the progress of all the issues you have reported.</p>
                </div>

                <Link href="/report">
                    <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white font-bold h-11 px-6 rounded-xl transition-all shadow-lg shadow-orange-500/20">
                        <Plus className="mr-2 h-5 w-5" />
                        Report New Issue
                    </Button>
                </Link>
            </div>

            <section className="mt-8">
                {complaints.length > 0 ? (
                    <ComplaintList complaints={complaints as any} userId={session.user.id} />
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm mt-8">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                            <Plus className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-[#1e293b] mb-2">No reports yet</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">You haven't submitted any civic issues yet. Report a pothole, street light outage, or garbage dump to get started.</p>
                        <Link href="/report">
                            <Button className="bg-[#002f5a] hover:bg-[#003f7a] text-white">
                                Make Your First Report
                            </Button>
                        </Link>
                    </div>
                )}
            </section>
        </div>
    );
}
