'use client';

import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import { useOptimistic, startTransition } from 'react'; // React 19 / Next.js
import { upvoteComplaint } from '@/app/actions/report';
import { cn } from '@/lib/utils';
import { useFormStatus } from 'react-dom';

type VoteButtonProps = {
    complaintId: string;
    initialVotes: number;
    hasVoted: boolean;
};

export function VoteButton({ complaintId, initialVotes, hasVoted }: VoteButtonProps) {
    const [optimisticVotes, addOptimisticVote] = useOptimistic(
        { count: initialVotes, userHasVoted: hasVoted },
        (state, newVote: boolean) => ({
            count: state.userHasVoted ? state.count : state.count + 1,
            userHasVoted: true,
        })
    );

    const handleVote = async () => {
        if (optimisticVotes.userHasVoted) return; // Prevent double vote for now

        startTransition(() => {
            addOptimisticVote(true);
        });

        await upvoteComplaint(complaintId);
    };

    return (
        <form action={handleVote}>
            <VoteSubmitButton state={optimisticVotes} />
        </form>
    );
}

function VoteSubmitButton({ state }: { state: { count: number, userHasVoted: boolean } }) {
    const { pending } = useFormStatus();

    return (
        <Button
            disabled={pending || state.userHasVoted}
            variant="ghost"
            size="sm"
            className={cn(
                "hover:text-primary transition-colors",
                state.userHasVoted && "text-primary font-bold"
            )}
        >
            <ThumbsUp className={cn("w-4 h-4 mr-1", state.userHasVoted && "fill-current")} />
            {state.count}
        </Button>
    )
}
