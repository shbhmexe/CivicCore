import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowRight, Shield, Video, Zap,
  MapPin, CheckCircle2, Award,
  Users, BarChart3, Globe, Mail,
  Github, Twitter, MessageSquare
} from 'lucide-react';
import { ConcentricCircles } from '@/components/ui/concentric-circles';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden bg-[#05050a] text-white">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full" />
      </div>

      <ConcentricCircles />

      {/* Hero Section */}
      <section className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center text-center px-4 pt-20 pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-teal-400 text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          Live Dash Active
        </div>

        <div className="space-y-6 max-w-4xl">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-tight">
            <span className="text-white">Empowering</span><br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400">
              Smart Cities
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            The next-generation framework for transparent civic bridge-building. AI-powered reporting, real-time tracking, and verified results.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center pt-10">
            <Link href="/report">
              <Button size="lg" className="text-lg px-10 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-2xl shadow-blue-500/40 border-0 group">
                Report Issue
                <Zap className="ml-2 h-5 w-5 group-hover:scale-125 transition-transform" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="text-lg px-10 h-16 bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-md">
                Live Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Mini Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 max-w-5xl w-full border-t border-white/5 pt-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">12.4k</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Reports Filed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-teal-400">98%</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Resolution Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">2.5m</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Karma Points</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-400">45+</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Active Cities</div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 px-4 relative bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-blue-500 uppercase tracking-[0.3em] mb-3">Capabilities</h2>
            <h3 className="text-4xl md:text-5xl font-bold">Cutting-edge Governance</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Video className="w-8 h-8 text-blue-400" />}
              title="AI Triage Engine"
              description="Our proprietary pipeline uses computer vision to instantly categorize reports and assess severity without human bias."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-teal-400" />}
              title="Proof of Work"
              description="Unfalsifiable resolution tracking. Admins must provide photographic evidence of completed work to earn points."
            />
            <FeatureCard
              icon={<Award className="w-8 h-8 text-indigo-400" />}
              title="Civic Karma"
              description="A gamified contribution system that rewards active citizens with points, rankings, and local recognition."
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 px-4 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-sm font-bold text-teal-500 uppercase tracking-[0.3em] mb-4 text-center lg:text-left">The Process</h2>
            <h3 className="text-4xl md:text-6xl font-black mb-8 leading-tight text-center lg:text-left">From Report to <span className="text-teal-400">Resolution.</span></h3>

            <div className="space-y-8">
              <ProcessStep
                number="01"
                title="Snapshot & Tag"
                description="Identify a public issue, snap a photo, and let our AI handle the data entry and geolocation."
              />
              <ProcessStep
                number="02"
                title="Transparent Triage"
                description="Your report enters the public blockchain-style ledger. Everyone can see its status in real-time."
              />
              <ProcessStep
                number="03"
                title="Accountable Action"
                description="Authorities respond, resolve, and upload proof. You get notified and earn Karma points."
              />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/20 to-teal-500/20 blur-3xl rounded-full" />
            <div className="relative aspect-square rounded-3xl border border-white/10 bg-gray-900/50 backdrop-blur-xl p-8 flex flex-col justify-center items-center group overflow-hidden">
              <div className="w-24 h-24 bg-teal-500/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <CheckCircle2 className="w-12 h-12 text-teal-400" />
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">98.2%</div>
                <div className="text-gray-400 text-lg">Avg. Satisfaction Rate</div>
              </div>
              {/* Floating Cards Mock */}
              <div className="absolute top-10 right-10 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md animate-bounce-slow">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-[10px] font-bold text-gray-300">New Pothole Detected</span>
                </div>
              </div>
              <div className="absolute bottom-10 left-10 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md animate-bounce-slow delay-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-[10px] font-bold text-gray-300">Resolved in 4h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-blue-900/40 via-teal-900/40 to-emerald-900/40 border-y border-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center">
          <Users className="w-16 h-16 text-teal-400 mx-auto mb-6 opacity-80" />
          <h2 className="text-4xl md:text-6xl font-black mb-6">Build the Future of Your <span className="text-teal-400">Neighborhood.</span></h2>
          <p className="text-xl text-gray-400 mb-10 leading-relaxed">
            Join thousands of citizens already making a difference. CivicCore is free, open, and built for you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="px-12 h-16 text-lg bg-teal-600 hover:bg-teal-700">Join Now</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="px-12 h-16 text-lg border-white/20 hover:bg-white/10">View Statistics</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-4 bg-black border-t border-white/5 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
          <div className="md:col-span-1">
            <div className="text-2xl font-black mb-4 flex items-center justify-center md:justify-start gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              CivicCore
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Empowering communities with AI transparency. Built for citizens, powered by trust.
            </p>
            <div className="flex justify-center md:justify-start gap-4">
              <Link href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </Link>
              <Link href="#" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li><Link href="/report" className="hover:text-teal-400 transition-colors">Report Center</Link></li>
              <li><Link href="/dashboard" className="hover:text-teal-400 transition-colors">Community Dash</Link></li>
              <li><Link href="/map" className="hover:text-teal-400 transition-colors">Interactive Map</Link></li>
              <li><Link href="/leaderboard" className="hover:text-teal-400 transition-colors">Karma Rankings</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Resources</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              <li><Link href="#" className="hover:text-teal-400 transition-colors">Documentation</Link></li>
              <li><Link href="#" className="hover:text-teal-400 transition-colors">API Reference</Link></li>
              <li><Link href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-teal-400 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Newsletter</h4>
            <p className="text-xs text-gray-500 mb-4">Stay updated with regional civic reports.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Your email" className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-xs flex-1 focus:outline-none focus:border-teal-500/50" />
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700">OK</Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-16 mt-16 border-t border-white/5 text-center text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">
          &copy; 2026 CivicCore Infrastructure Labs. All Rights Reserved.
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.05] transition-all duration-300 group">
      <div className="mb-6 bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 group-hover:scale-110 transition-all">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm font-medium">{description}</p>
    </div>
  );
}

function ProcessStep({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="flex gap-6 items-start group">
      <div className="text-2xl font-black text-white/10 transition-colors group-hover:text-teal-500/50">
        {number}
      </div>
      <div>
        <h4 className="text-xl font-bold text-white mb-2">{title}</h4>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
