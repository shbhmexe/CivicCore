'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, AlertTriangle, Lightbulb, Droplet, Menu, ShieldCheck, PlusCircle, User } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { HomeMap } from '@/components/dashboard/home-map';

export default function Home() {
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        main { padding: 0 !important; }
      `}} />
      <div className="min-h-screen bg-[#f8fafc] font-sans">
      <div className="w-full bg-[#f8fafc] relative">
        
        {/* TOP NAV */}
        <div className="bg-[#002f5a] text-white px-6 py-4 flex items-center justify-between z-20 relative">
          <div className="flex items-center gap-8 max-w-7xl mx-auto w-full">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="text-blue-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                   <rect x="4" y="12" width="4" height="8" rx="1" fill="#fff" />
                   <rect x="10" y="8" width="4" height="12" rx="1" fill="#fb923c" />
                   <rect x="16" y="4" width="4" height="16" rx="1" fill="#fff" />
                </svg>
              </span>
              <span className="hidden sm:inline force-white" style={{ color: '#ffffff' }}>CivicCore</span>
            </h1>
            <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium tracking-wide">
              {session?.user?.role === 'ADMIN' ? (
                <>
                  <Link href="/" className="relative text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
                    Home
                  </Link>
                  <Link href="/admin" className="text-blue-200 hover:text-white transition-colors" style={{ color: '#bfdbfe' }}>Admin Hub</Link>
                  <Link href="/feed" className="text-blue-200 hover:text-white transition-colors" style={{ color: '#bfdbfe' }}>Global Feed</Link>
                </>
              ) : (
                <>
                  <Link href="/" className="relative text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
                    Home
                  </Link>
                  <Link href="/report" className="text-blue-200 hover:text-white transition-colors" style={{ color: '#bfdbfe' }}>Report issue</Link>
                  <Link href="/my-reports" className="text-blue-200 hover:text-white transition-colors" style={{ color: '#bfdbfe' }}>My Reports</Link>
                  <Link href="/dashboard" className="text-blue-200 hover:text-white transition-colors" style={{ color: '#bfdbfe' }}>Dashboard</Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 pr-6">
            {status === 'authenticated' ? (
              <>
                <button className="relative text-orange-400 hover:text-orange-300 transition-colors hidden sm:block">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-[#002f5a]"></span>
                </button>

                <div className="flex-col items-end hidden lg:flex">
                  <span className="text-xs font-semibold text-white">
                    {session?.user?.name && session.user.name !== 'Citizen'
                      ? session.user.name
                      : session?.user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-[10px] text-blue-200 capitalize">
                    {session?.user?.role?.toLowerCase() || 'citizen'}
                  </span>
                </div>

                <div className="group relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 hover:border-white transition-all bg-white/10 flex items-center justify-center"
                  >
                    {session?.user?.image ? (
                      <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {(session?.user?.name && session.user.name !== 'Citizen'
                          ? session.user.name
                          : session?.user?.email?.split('@')[0] || 'U'
                        ).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </button>

                  <div className={`absolute right-0 top-full mt-2 w-48 py-2 bg-white rounded-xl shadow-2xl border border-gray-100 transition-all duration-200 ${
                    dropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                  }`}>
                    <div className="px-4 py-2 border-b border-gray-100 mb-2">
                      <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                    </div>
                    <Link href="/profile" className="block w-full text-left px-4 py-2 text-sm text-[#1e293b] hover:bg-gray-50 transition-colors">
                      My Profile
                    </Link>
                    {session?.user?.role === 'ADMIN' && (
                        <Link href="/admin" className="block w-full text-left px-4 py-2 text-sm text-teal-600 hover:bg-teal-50 transition-colors font-bold">
                            Admin Portal
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
                <Link
                  href="/auth/signin"
                  className="text-blue-200 hover:text-white transition-colors text-xs font-semibold px-4 h-8 flex items-center rounded-lg border border-white/20 hover:bg-white/10"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-semibold px-4 h-8 flex items-center rounded-lg shadow-md transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            )}
          </div>
        </div>

        {/* HERO SECTION */}
        <div className="relative h-[480px] bg-[#002f5a]">
            {/* Background Image Overlay */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
              style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2000&auto=format&fit=crop")' }}
            >
                {/* Gradient overlay to ensure text is readable like in mock */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#002f5a] via-[#002f5a]/80 to-transparent"></div>
            </div>

            <div className="relative z-10 px-8 pt-24 max-w-7xl mx-auto w-full">
                <div className="max-w-2xl">
                    <h2 className="text-white force-white text-6xl font-extrabold leading-tight mb-4 font-sans" style={{ color: '#ffffff' }}>
                       Report Civic Issues,<br/>Get Them Fixed!
                    </h2>
                    <p className="text-blue-100 text-xl mb-10 tracking-wide font-medium" style={{ color: '#dbeafe' }}>
                       Make Your City Better with AI-Powered Reporting
                    </p>
                    <Link href="/report">
                        <button 
                          className="bg-[#f97316] hover:bg-[#ea580c] text-white force-white px-10 py-4 rounded-xl text-lg font-bold shadow-2xl shadow-orange-500/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                          style={{ color: '#ffffff' }}
                        >
                           Report an issue
                           <PlusCircle className="w-5 h-5" />
                        </button>
                    </Link>
                </div>
            </div>

            {/* Wavy Divider */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10">
                <svg className="relative block w-full h-[80px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C52.16,108.7,106.97,110.15,162.2,102.54,213.7,95.4,267.4,77.3,321.39,56.44Z" fill="#f8fafc"></path>
                </svg>
            </div>
        </div>

        {/* CONTENT SECTIONS */}
        <div className="px-8 pb-16 relative z-20 -mt-2 max-w-7xl mx-auto w-full">
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center justify-between mb-12 gap-8 px-4">
                <div className="text-center md:border-r border-gray-200 px-4">
                    <div className="text-5xl font-extrabold text-[#1e293b] mb-2 tracking-tight">5,280</div>
                    <div className="text-sm text-gray-400 font-bold tracking-widest uppercase">Issues Reported</div>
                </div>
                <div className="text-center md:border-r border-gray-200 px-4">
                    <div className="text-5xl font-extrabold text-[#1e293b] mb-2 tracking-tight">832</div>
                    <div className="text-sm text-gray-400 font-bold tracking-widest uppercase">In Progress</div>
                </div>
                <div className="text-center md:border-r border-gray-200 px-4">
                    <div className="text-5xl font-extrabold text-[#1e293b] mb-2 tracking-tight">4,150</div>
                    <div className="text-sm text-gray-400 font-bold tracking-widest uppercase">Resolved</div>
                </div>
                <div className="flex justify-center md:justify-end pr-4">
                    <div className="w-20 h-20 bg-white shadow-xl rounded-2xl flex items-center justify-center relative overflow-hidden border border-gray-50 transition-transform hover:scale-105">
                        <div className="absolute inset-0 bg-blue-50/50"></div>
                        <ShieldCheck className="w-10 h-10 text-blue-600 relative z-10" />
                        <div className="absolute bottom-2 w-10 h-1.5 bg-yellow-400 rounded-full z-10"></div>
                    </div>
                </div>
            </div>

            {/* Interactive India Map Section */}
            <div className="mb-16">
                <HomeMap />
            </div>

            {/* Bottom 2 Cards Grid */}
            <div className="grid grid-cols-2 gap-6">
                
                {/* Verify & Track Issues Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                           <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-[#1e293b] text-sm">Verify & Track Issues</h3>
                    </div>
                    
                    <div className="bg-[#002f5a] rounded-lg p-4 mb-3 relative overflow-hidden">
                        <div className="absolute right-0 top-0 opacity-10">
                           <ShieldCheck className="w-16 h-16" />
                        </div>
                        <h4 className="text-white font-bold text-lg mb-4">AI Verified:<br/>92%</h4>
                        <div className="bg-[#16a34a] text-white text-[11px] font-bold px-3 py-1.5 rounded-md inline-block w-full text-center shadow-sm">
                            Community Confirmed: 8 Responses
                        </div>
                    </div>

                    <div className="mt-auto h-24 rounded-lg bg-gray-200 overflow-hidden relative">
                         <div 
                           className="absolute inset-0 bg-cover bg-center"
                           style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800&auto=format&fit=crop")' }}
                         ></div>
                    </div>
                </div>

                {/* Priority Cases Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center">
                           <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                        </div>
                        <h3 className="font-bold text-[#1e293b] text-sm">Priority Cases</h3>
                    </div>

                    <div className="bg-gradient-to-br from-red-600 to-rose-500 rounded-2xl p-6 mb-4 relative overflow-hidden text-white shadow-xl shadow-red-500/20">
                        <div className="text-sm font-bold text-red-100 mb-2 uppercase tracking-widest opacity-90">High Priority</div>
                        <h4 className="font-extrabold text-2xl mb-4 leading-tight">Collapsed Road<br/>Near City Center</h4>
                        <div className="flex justify-between items-center">
                            <span className="font-bold bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs">Action Needed</span>
                            <span className="text-xs font-bold text-red-100">Pending: 7 Days</span>
                        </div>
                    </div>

                    <div className="space-y-2 mt-auto">
                        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                                    <Droplet className="w-4 h-4 text-orange-500" />
                                </div>
                                <span className="text-xs font-semibold text-[#1e293b]">Water Leak Hoday</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">9/208.19532 &gt;</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center">
                                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                                </div>
                                <span className="text-xs font-semibold text-[#1e293b]">Streetlight Repaired</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium tracking-tight">by City Lights &gt;</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
    </>
  );
}
