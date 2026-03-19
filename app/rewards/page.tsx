import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import RewardsPage from '@/components/rewards/rewards-store';
import { redirect } from 'next/navigation';

export default async function RewardsRoute() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { karmaPoints: true }
    });

    return <RewardsPage userKarma={user?.karmaPoints || 0} />;
}
