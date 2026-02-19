'use client';

import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { AlertTriangle, MapPin } from 'lucide-react';
import { Loader2 } from 'lucide-react';

// Props for the map
interface ComplaintMapProps {
    complaints: any[];
    mapboxToken?: string; // kept for backwards compat, not used
}

// Dynamically import the actual map to avoid SSR issues with Leaflet
const LazyMap = dynamic<any>(() => import('./complaint-map-inner'), {
    ssr: false,
    loading: () => (
        <Card className="relative w-full h-[500px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0c14] shadow-2xl flex items-center justify-center">
            <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto" />
                <p className="text-sm text-gray-500 font-medium">Loading map...</p>
            </div>
        </Card>
    ),
});

export function ComplaintMap({ complaints }: ComplaintMapProps) {
    return <LazyMap complaints={complaints} />;
}
