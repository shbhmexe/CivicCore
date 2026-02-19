import Link from 'next/link';
import { ShieldCheck, Github, Twitter, Mail } from 'lucide-react';

export function Footer() {
    return (
        <footer className="w-full py-12 px-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-8 h-8 text-teal-400" />
                        <span className="text-2xl font-bold text-white">CivicCore</span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Empowering citizens to take charge of their urban infrastructure through modern technology and community collaboration.
                    </p>
                    <div className="flex space-x-4 pt-2">
                        <Link href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                            <Twitter className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                            <Github className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                            <Mail className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                <div>
                    <h4 className="text-white font-semibold mb-6">Platform</h4>
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li><Link href="/dashboard" className="hover:text-teal-400 transition-colors">Incident Feed</Link></li>
                        <li><Link href="/report" className="hover:text-teal-400 transition-colors">Report Issue</Link></li>
                        <li><Link href="#" className="hover:text-teal-400 transition-colors">Karma Leaderboard</Link></li>
                        <li><Link href="#" className="hover:text-teal-400 transition-colors">Authorities Portal</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-semibold mb-6">Resources</h4>
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li><Link href="#" className="hover:text-teal-400 transition-colors">Documentation</Link></li>
                        <li><Link href="#" className="hover:text-teal-400 transition-colors">API Access</Link></li>
                        <li><Link href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</Link></li>
                        <li><Link href="#" className="hover:text-teal-400 transition-colors">Terms of Service</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-semibold mb-6">Transparency</h4>
                    <div className="p-4 bg-teal-500/5 border border-teal-500/20 rounded-xl">
                        <p className="text-xs text-teal-400 font-medium mb-2 uppercase tracking-wider">Project Status</p>
                        <p className="text-sm text-gray-300">Phase 1: Deployment & Community Testing</p>
                        <div className="w-full bg-gray-800 h-1.5 rounded-full mt-4">
                            <div className="bg-teal-500 h-full rounded-full w-[75%]" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center text-xs text-gray-500">
                <p>&copy; {new Date().getFullYear()} CivicCore. Built for a better future.</p>
            </div>
        </footer>
    );
}
