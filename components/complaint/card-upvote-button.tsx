'use client';

import { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { toggleVote } from '@/app/actions/vote';

interface CardUpvoteButtonProps {
    complaintId: string;
    initialVoteCount: number;
    initialVoted: boolean;
}

export function CardUpvoteButton({ complaintId, initialVoteCount, initialVoted }: CardUpvoteButtonProps) {
    const [voted, setVoted] = useState(initialVoted);
    const [voteCount, setVoteCount] = useState(initialVoteCount);
    const [isLoading, setIsLoading] = useState(false);

    const handleVote = async (e: React.MouseEvent) => {
        // Prevent the parent Link from navigating
        e.preventDefault();
        e.stopPropagation();

        if (isLoading) return;
        setIsLoading(true);

        // Optimistic update
        const prevVoted = voted;
        const prevCount = voteCount;
        setVoted(!voted);
        setVoteCount(voted ? voteCount - 1 : voteCount + 1);

        try {
            const result = await toggleVote(complaintId);
            if (result.error) {
                setVoted(prevVoted);
                setVoteCount(prevCount);
                return;
            }
            setVoted(result.voted!);
            setVoteCount(result.voteCount!);
        } catch {
            setVoted(prevVoted);
            setVoteCount(prevCount);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleVote}
            disabled={isLoading}
            className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-all duration-200
                ${voted
                    ? 'text-teal-400 bg-teal-500/10 hover:bg-teal-500/20'
                    : 'text-muted-foreground hover:text-teal-400 hover:bg-teal-500/10'
                }
                disabled:opacity-50
            `}
        >
            <ThumbsUp className={`w-4 h-4 ${voted ? 'fill-teal-400' : ''}`} />
            {voteCount}
        </button>
    );
}
