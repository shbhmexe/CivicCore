import prisma from "@/lib/prisma";
import { LiveFeed } from "@/components/feed/live-feed";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function FeedPage() {
    const session = await auth();
    if (!session?.user) redirect('/auth/signin');

    const initialActivities = await prisma.$queryRaw<any[]>`
        SELECT * FROM "Activity"
        ORDER BY "createdAt" DESC
        LIMIT 50
    `;

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Simple Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center shadow-sm">
                <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors mr-4 group">
                    <ArrowLeft className="w-5 h-5 text-[#64748b] group-hover:text-[#1e293b]" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-black text-sm uppercase tracking-widest text-[#1e293b]">Live Civic Activity</span>
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-12">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-black text-[#1e293b] tracking-tight mb-3">Public Live Feed</h1>
                    <p className="text-[#64748b] font-medium text-base px-8">
                        Experience the heartbeat of our city. Real-time updates on reported issues, resolutions, and community upvotes.
                    </p>
                </div>
                
                <LiveFeed initialActivities={initialActivities} />
            </main>
        </div>
    );
}
