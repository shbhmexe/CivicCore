'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp } from 'lucide-react';
import { toggleVote, getVoteStatus } from '@/app/actions/vote';
import { io, Socket } from 'socket.io-client';

interface UpvoteButtonProps {
    complaintId: string;
    initialVoteCount: number;
    initialVoted: boolean;
}

export function UpvoteButton({ complaintId, initialVoteCount, initialVoted }: UpvoteButtonProps) {
    const [voted, setVoted] = useState(initialVoted);
    const [voteCount, setVoteCount] = useState(initialVoteCount);
    const [isLoading, setIsLoading] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);

    // Connect to Socket.IO and listen for real-time vote updates
    useEffect(() => {
        const newSocket = io('http://localhost:3001', { transports: ['websocket', 'polling'] });

        newSocket.on('connect', () => {
            console.log('[Vote] Socket connected');
            newSocket.emit('join-complaint', complaintId);
        });

        // Listen for vote updates from other users
        newSocket.on('vote-updated', (data: { complaintId: string; voteCount: number }) => {
            if (data.complaintId === complaintId) {
                setVoteCount(data.voteCount);
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.emit('leave-complaint', complaintId);
            newSocket.disconnect();
        };
    }, [complaintId]);

    // Load initial vote status
    useEffect(() => {
        async function loadStatus() {
            const status = await getVoteStatus(complaintId);
            setVoted(status.voted);
            setVoteCount(status.voteCount);
        }
        loadStatus();
    }, [complaintId]);

    const handleVote = async () => {
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
                // Revert optimistic update
                setVoted(prevVoted);
                setVoteCount(prevCount);
                console.error(result.error);
                return;
            }

            // Update with server values
            setVoted(result.voted!);
            setVoteCount(result.voteCount!);

            // Broadcast to other clients via WebSocket
            if (socket) {
                socket.emit('vote-change', {
                    complaintId,
                    voteCount: result.voteCount,
                });
            }
        } catch (error) {
            // Revert optimistic update
            setVoted(prevVoted);
            setVoteCount(prevCount);
            console.error('Vote failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleVote}
            disabled={isLoading}
            className={`
                group flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-300 
                ${voted
                    ? 'bg-teal-500/15 border-teal-500/30 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.15)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-teal-500/10 hover:border-teal-500/20 hover:text-teal-400'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
            `}
        >
            <ThumbsUp
                className={`w-4 h-4 transition-all duration-300 ${voted
                    ? 'fill-teal-400 text-teal-400 scale-110'
                    : 'group-hover:scale-110'
                    }`}
            />
            <span className="font-bold text-sm">{voteCount}</span>
            <span className="text-xs opacity-70">
                {voted ? 'Upvoted' : 'Upvote'}
            </span>
        </button>
    );
}
