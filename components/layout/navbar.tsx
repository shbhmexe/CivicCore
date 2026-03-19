'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, PlusCircle, Home, ClipboardList, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';
import { NotificationBell } from './notification-bell';

const citizenNavItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Live Feed', href: '/feed', icon: Activity },
    { name: 'Report Issue', href: '/report', icon: PlusCircle },
    { name: 'My Reports', href: '/my-reports', icon: ClipboardList },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
];

const adminNavItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Admin Hub', href: '/admin', icon: LayoutDashboard },
    { name: 'Global Feed', href: '/feed', icon: Activity },
];

export function Navbar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside as any);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside as any);
        };
    }, []);

    // Close dropdown on route change
    useEffect(() => {
        setDropdownOpen(false);
    }, [pathname]);

    // If on homepage, hide this generic navbar since homepage has a custom one
    if (pathname === '/') return null;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#002f5a] text-white px-6 py-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-8 w-full max-w-[1200px] mx-auto">
                <Link href="/" className="text-xl font-bold flex items-center gap-2">
                    <span className="text-blue-400">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <rect x="4" y="12" width="4" height="8" rx="1" fill="#fff" />
                            <rect x="10" y="8" width="4" height="12" rx="1" fill="#fb923c" />
                            <rect x="16" y="4" width="4" height="16" rx="1" fill="#fff" />
                        </svg>
                    </span>
                    <span className="hidden sm:inline" style={{ color: "#ffffff" }}>CivicCore</span>
                </Link>

                <div className="hidden md:flex items-center gap-6 text-[13px] font-medium tracking-wide">
                    {(session?.user?.role === 'ADMIN' ? adminNavItems : citizenNavItems).map(item => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "relative transition-colors flex items-center gap-2",
                                    isActive ? "text-white font-bold" : "text-blue-200 hover:text-white"
                                )}
                            >
                                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>}
                                {item.name}
                            </Link>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3 ml-auto">
                    {status === 'authenticated' ? (
                        <>
                            <NotificationBell userId={session.user.id} />

                            <div className="flex-col items-end hidden lg:flex">
                                <span className="text-xs font-semibold text-white">
                                    {session.user?.name && session.user.name !== 'Citizen'
                                        ? session.user.name
                                        : session.user?.email?.split('@')[0] || 'User'}
                                </span>
                                <span className="text-[10px] text-blue-200 capitalize">
                                    {session.user?.role?.toLowerCase() || 'citizen'}
                                </span>
                            </div>

                            <div className="group relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 hover:border-white transition-all bg-white/10 flex items-center justify-center"
                                >
                                    {session.user?.image ? (
                                        <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-bold text-white">
                                            {(session.user?.name && session.user.name !== 'Citizen'
                                                ? session.user.name
                                                : session.user?.email?.split('@')[0] || 'U'
                                            ).charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </button>

                                <div className={cn(
                                    "absolute right-0 top-full mt-2 w-48 py-2 bg-white rounded-xl shadow-2xl transition-all duration-200 border border-gray-100",
                                    dropdownOpen ? "opacity-100 visible" : "opacity-0 invisible md:group-hover:opacity-100 md:group-hover:visible"
                                )}>
                                    <div className="px-4 py-2 border-b border-gray-100 mb-2">
                                        <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                                    </div>
                                    <Link href="/profile" className="block w-full text-left px-4 py-2 text-sm text-[#1e293b] hover:bg-gray-50 transition-colors">
                                        My Profile
                                    </Link>
                                    {session.user?.role === 'ADMIN' && (
                                        <Link href="/admin" className="block w-full text-left px-4 py-2 text-sm text-teal-600 hover:bg-teal-50 transition-colors font-semibold">
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : status === 'unauthenticated' ? (
                        <div className="flex items-center gap-2">
                            <Link href="/auth/signin">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-blue-200 hover:text-white hover:bg-white/10 rounded-lg h-8 text-xs font-semibold px-4 border border-white/20"
                                >
                                    Log In
                                </Button>
                            </Link>
                            <Link href="/auth/signup">
                                <Button
                                    size="sm"
                                    className="bg-[#f97316] hover:bg-[#ea580c] text-white rounded-lg shadow-md border-0 h-8 text-xs font-semibold px-4"
                                >
                                    Sign Up
                                </Button>
                            </Link>
                        </div>
                    ) : null}
                </div>
            </div>
        </nav>
    );
}
