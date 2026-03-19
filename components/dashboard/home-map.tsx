'use client';

import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Dynamically import the actual map to avoid SSR issues with Leaflet
const LazyMap = dynamic<any>(() => import('./home-map-inner'), {
    ssr: false,
    loading: () => (
        <Card className="relative w-full h-[500px] overflow-hidden rounded-3xl border border-gray-100 bg-[#f8fafc] shadow-xl flex items-center justify-center">
            <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#002f5a] animate-spin mx-auto" />
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Initialising India Map...</p>
            </div>
        </Card>
    ),
});

export function HomeMap() {
    return <LazyMap />;
}
