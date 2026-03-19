'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, CheckCircle2, MessageSquare, Info, X } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { getNotifications, markAsRead, markAllAsRead } from '@/app/actions/notifications';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface NotificationBellProps {
    userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const playSound = useCallback(() => {
        // High quality notification sound from public CDN
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log("Audio play blocked by browser"));
    }, []);

    useEffect(() => {
        // Initial fetch
        const fetchInitial = async () => {
            const { notifications: initial } = await getNotifications();
            setNotifications(initial);
            setUnreadCount(initial.filter(n => !n.isRead).length);
        };
        fetchInitial();

        // Socket listener
        const socket = getSocket();
        
        const joinRoom = () => {
            console.log(`[NotificationBell] Joining room for user: ${userId}`);
            socket.emit('join-user', userId);
        };

        if (socket.connected) {
            joinRoom();
        }

        socket.on('connect', joinRoom);

        const handleNewNotification = (notification: any) => {
            console.log("[NotificationBell] New notification received:", notification);
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            playSound();
        };

        socket.on('notification-received', handleNewNotification);

        return () => {
            socket.off('connect', joinRoom);
            socket.off('notification-received', handleNewNotification);
        };
    }, [userId, playSound]);

    const handleMarkAllRead = async () => {
        await markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    const handleReadOne = async (id: string) => {
        await markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'STATUS_CHANGE': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            case 'COMMENT': return <MessageSquare className="w-4 h-4 text-orange-400" />;
            case 'UPVOTE': return <Bell className="w-4 h-4 text-blue-400" />;
            default: return <Info className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative text-blue-200 hover:text-white transition-all transform hover:scale-110"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-80 bg-[#002f5a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <h3 className="font-bold text-sm text-white flex items-center gap-2">
                            Notifications
                        </h3>
                        {notifications.length > 0 && (
                            <button 
                                onClick={handleMarkAllRead}
                                className="text-[10px] text-orange-400 hover:text-orange-300 font-bold uppercase tracking-wider bg-orange-500/10 px-2 py-1 rounded-md transition-colors"
                            >
                                Ignore All
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-blue-300/50">
                                <Bell className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-xs">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <Link
                                    key={n.id}
                                    href={n.link || '#'}
                                    onClick={() => handleReadOne(n.id)}
                                    className={cn(
                                        "block p-4 border-b border-white/5 transition-colors hover:bg-white/5 relative group",
                                        !n.isRead && "bg-blue-500/5"
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-0.5">{getTypeIcon(n.type)}</div>
                                        <div className="flex-1">
                                            <p className={cn(
                                                "text-[13px] leading-snug",
                                                !n.isRead ? "text-white font-medium" : "text-blue-200"
                                            )}>
                                                {n.message}
                                            </p>
                                            <span className="text-[10px] text-blue-300/60 mt-1 block">
                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {!n.isRead && (
                                            <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                        )}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
