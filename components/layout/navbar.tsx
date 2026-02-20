'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, PlusCircle, ShieldCheck, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';

const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Report', href: '/report', icon: PlusCircle },
];

export function Navbar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4">
            <div className="glass-panel flex items-center justify-between w-full max-w-7xl px-6 py-3 rounded-2xl shadow-2xl border border-white/10">
                <Link href="/" className="flex items-center space-x-2">
                    <div className="bg-gradient-to-br from-teal-400 to-blue-500 p-2 rounded-lg">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        CivicCore
                    </span>
                </Link>

                <div className="hidden md:flex items-center space-x-8">
                    {navItems
                        .filter(item => {
                            // Hide "Report" and "Dashboard" for Admins if they are purely in admin mode
                            if (session?.user?.role === 'ADMIN') {
                                if (item.name === 'Report' || item.name === 'Dashboard') return false;
                            }
                            return true;
                        })
                        .map((item) => {
                            // If it's the Home link and user is Admin, we can optionally point them to /admin
                            const href = item.href;
                            const isActive = pathname === href;

                            return (
                                <Link
                                    key={item.name}
                                    href={href}
                                    className={cn(
                                        "flex items-center space-x-2 text-sm font-medium transition-all hover:text-white",
                                        isActive ? "text-white" : "text-gray-400"
                                    )}
                                >
                                    <item.icon className={cn("w-4 h-4", isActive ? "text-teal-400" : "")} />
                                    <span>{item.name}</span>
                                    {isActive && (
                                        <span className="w-1 h-1 bg-teal-400 rounded-full ml-1" />
                                    )}
                                </Link>
                            );
                        })}
                    {/* Unified Admin Center link */}
                    {session?.user?.role === 'ADMIN' && (
                        <Link
                            href="/admin"
                            className={cn(
                                "flex items-center space-x-2 text-sm font-medium transition-all hover:text-white",
                                pathname === '/admin' ? "text-white" : "text-teal-400"
                            )}
                        >
                            <ShieldCheck className={cn("w-4 h-4", pathname === '/admin' ? "text-teal-400" : "")} />
                            <span>Admin Command Center</span>
                        </Link>
                    )}
                </div>

                <div className="flex items-center space-x-4">
                    {status === 'loading' ? (
                        <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse border-2 border-white/5" />
                    ) : status === 'authenticated' ? (
                        <div className="flex items-center space-x-4">
                            <div className="flex flex-col items-end hidden lg:flex">
                                <span className="text-xs font-semibold text-white">
                                    {session.user?.name && session.user.name !== 'Citizen'
                                        ? session.user.name
                                        : session.user?.email?.split('@')[0] || 'User'}
                                </span>
                                <span className="text-[10px] text-gray-400 capitalize">
                                    {session.user?.role?.toLowerCase() || 'citizen'}
                                </span>
                            </div>
                            <div className="group relative">
                                <button className="flex items-center space-x-1 outline-none">
                                    {session.user?.image ? (
                                        <img
                                            src={session.user.image}
                                            alt="Profile"
                                            className="w-9 h-9 rounded-full border-2 border-teal-500/50 object-cover"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center border-2 border-teal-500/50">
                                            <span className="text-sm font-bold text-white">
                                                {(session.user?.name && session.user.name !== 'Citizen' ? session.user.name : session.user?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </button>

                                <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-[#0a0a12]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                    <div className="px-4 py-2 border-b border-white/5 mb-2">
                                        <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
                                    </div>
                                    <Link href="/profile" className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                                        My Profile
                                    </Link>
                                    {session.user?.role === 'ADMIN' && (
                                        <>
                                            <div className="mx-2 my-1 border-t border-white/5" />
                                            <Link href="/admin" className="block w-full text-left px-4 py-2 text-sm text-teal-400 hover:bg-white/5 transition-colors flex items-center gap-2">
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                Admin Command Center
                                            </Link>
                                        </>
                                    )}
                                    <div className="mx-2 my-1 border-t border-white/5" />
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link href="/auth/signin">
                            <Button variant="glass" size="sm">
                                Log In
                            </Button>
                        </Link>
                    )}
                    {status === 'authenticated' && session?.user?.role !== 'ADMIN' && (
                        <Link href="/report">
                            <Button size="sm" className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-lg shadow-teal-500/20">
                                New Report
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
