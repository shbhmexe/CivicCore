'use client';

import { useState, useEffect, useRef } from 'react';
import { addComment, getComments, clearComments } from '@/app/actions/comment';
import { getSocket } from '@/lib/socket';
import { Send, Shield, User, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toaster';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface CommentUser {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: CommentUser;
}

interface CommentSectionProps {
    complaintId: string;
    currentUserId: string;
    currentUserRole: string;
}

export function CommentSection({ complaintId, currentUserId, currentUserRole }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isClearing, setIsClearing] = useState(false);
    const [showConfirmClear, setShowConfirmClear] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        // Scroll only within the chat container, not the whole page
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    // Load initial comments
    useEffect(() => {
        async function loadComments() {
            const result = await getComments(complaintId);
            if (result.comments) {
                setComments(result.comments as any);
            }
            setIsLoading(false);
        }
        loadComments();
    }, [complaintId]);

    // Setup WebSocket — pure real-time, no polling
    useEffect(() => {
        const socket = getSocket();

        socket.on('connect', () => {
            console.log('[WebSocket] Connected:', socket.id);
            socket.emit('join-complaint', complaintId);
        });

        // If already connected, join immediately
        if (socket.connected) {
            socket.emit('join-complaint', complaintId);
        }

        socket.on('comment-received', (comment: Comment) => {
            setComments(prev => {
                if (prev.some(c => c.id === comment.id)) return prev;
                return [...prev, comment];
            });
        });

        socket.on('chat-cleared', () => {
            setComments([]);
        });

        return () => {
            socket.emit('leave-complaint', complaintId);
            socket.off('comment-received');
            socket.off('chat-cleared');
            socket.off('connect');
        };
    }, [complaintId]);

    // Auto-scroll on new comments
    useEffect(() => {
        scrollToBottom();
    }, [comments]);

    const handleSend = async () => {
        if (!newComment.trim() || isSending) return;

        setIsSending(true);
        const result = await addComment(complaintId, newComment);

        if (result.success && result.comment) {
            setComments(prev => [...prev, result.comment as any]);
            setNewComment('');

            // Broadcast via WebSocket
            const socket = getSocket();
            socket.emit('new-comment', {
                complaintId,
                comment: result.comment,
            });
        }
        setIsSending(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const getDisplayName = (user: CommentUser) => {
        if (user.name && user.name !== 'Citizen') return user.name;
        return user.email?.split('@')[0] || 'User';
    };

    const formatTime = (date: string) => {
        return new Date(date).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="flex flex-col h-[500px] bg-gray-900/40 border border-white/10 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 bg-black/20 flex items-center justify-between">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        💬 Discussion Thread
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Real-time chat between admin and citizen
                    </p>
                </div>

                {currentUserRole === 'ADMIN' && comments.length > 0 && (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowConfirmClear(true)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2 flex items-center gap-1.5 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Clear Chat</span>
                        </Button>

                        <Dialog open={showConfirmClear} onOpenChange={setShowConfirmClear}>
                            <DialogContent className="glass-card border-white/10 sm:max-w-[400px]">
                                <DialogHeader>
                                    <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
                                        <AlertTriangle className="w-6 h-6 text-red-500" />
                                    </div>
                                    <DialogTitle className="text-xl text-center text-white">Clear entire chat?</DialogTitle>
                                    <DialogDescription className="text-center text-gray-400">
                                        This action will permanently delete all messages in this discussion. This cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="flex flex-row gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                                        onClick={() => setShowConfirmClear(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
                                        onClick={async () => {
                                            setIsClearing(true);
                                            const result = await clearComments(complaintId);
                                            if (result.success) {
                                                setComments([]);
                                                const socket = getSocket();
                                                socket.emit('clear-chat', { complaintId });
                                                setShowConfirmClear(false);
                                                toast("Chat history cleared successfully", "success");
                                            } else {
                                                toast("Failed to clear chat", "error");
                                            }
                                            setIsClearing(false);
                                        }}
                                        disabled={isClearing}
                                    >
                                        {isClearing ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                                        ) : (
                                            'Confirm Deletion'
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </>
                )}
            </div>

            {/* Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    comments.map((comment) => {
                        const isOwnMessage = comment.user.id === currentUserId;
                        const isAdminMessage = comment.user.role === 'ADMIN';

                        return (
                            <div
                                key={comment.id}
                                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[75%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                                    {/* Sender info */}
                                    <div className={`flex items-center gap-1.5 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                        {isAdminMessage ? (
                                            <Shield className="w-3 h-3 text-amber-400" />
                                        ) : (
                                            <User className="w-3 h-3 text-teal-400" />
                                        )}
                                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${isAdminMessage ? 'text-amber-400' : 'text-teal-400'
                                            }`}>
                                            {getDisplayName(comment.user)}
                                            {isAdminMessage && ' • Admin'}
                                        </span>
                                    </div>

                                    {/* Message bubble */}
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isOwnMessage
                                        ? isAdminMessage
                                            ? 'bg-amber-500/20 text-amber-100 border border-amber-500/20 rounded-br-md'
                                            : 'bg-teal-500/20 text-teal-100 border border-teal-500/20 rounded-br-md'
                                        : 'bg-white/5 text-gray-300 border border-white/10 rounded-bl-md'
                                        }`}>
                                        {comment.content}
                                    </div>

                                    {/* Time */}
                                    <p className={`text-[10px] text-gray-600 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                                        {formatTime(comment.createdAt)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/10 bg-black/20">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50 transition-colors"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!newComment.trim() || isSending}
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl disabled:opacity-40"
                    >
                        {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
