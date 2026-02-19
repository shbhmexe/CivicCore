import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Shield, Video, Zap } from 'lucide-react';
import { ConcentricCircles } from '@/components/ui/concentric-circles';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Navbar Placeholder (assume generic layout handles it or add here) */}
      <ConcentricCircles />

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-transparent to-black/20 relative z-10">
        <div className="space-y-6 max-w-3xl relative">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400 animate-pulse-slow">
            CivicCore
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            A transparent, AI-powered ecosystem for citizens to report infrastructure failures and for authorities to resolve them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/report">
              <Button size="lg" className="text-lg px-8 h-14 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20">
                Report Issue
                <Zap className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="glass" className="text-lg px-8 h-14 hover:bg-white/10">
                View Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-4 bg-black/40 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Video className="w-8 h-8 text-blue-400" />}
            title="Smart Reporting"
            description="Upload a photo, and our AI instantly analyzes the issue, extracts location, and categorizes severity."
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-teal-400" />}
            title="Proof of Work"
            description="Admins must upload 'Before vs After' evidence to close tickets, ensuring total transparency."
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8 text-yellow-400" />}
            title="Gamified Impact"
            description="Earn Karma points for verified reports. Climb the leaderboard and be a civic hero."
          />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="p-6 rounded-xl glass-card hover:-translate-y-1 transition-transform cursor-default">
      <div className="mb-4 bg-white/5 w-14 h-14 rounded-lg flex items-center justify-center border border-white/10">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
