'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { verifyIssueAction } from '@/app/actions/verify';
import { Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NearbyVerifier() {
    const [issue, setIssue] = useState<{ id: string, title: string, lat: number, lng: number } | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const socket = io({ path: '/api/socketio' });

        socket.on('broadcast-nearby-verification', (data: { complaintId: string, title: string, latitude: number, longitude: number }) => {
            console.log('[App] Received nearby verification request:', data);
            
            // In a real hackathon environment, prompting location might be blocked without SSL.
            // But we can try to get the current location.
            if (navigator.geolocation) {
                // To allow immediate demo without actual GPS movement, we can loosen the check
                // or just do the calculation normally.
                navigator.geolocation.getCurrentPosition((position) => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;
                    
                    const distance = getDistance(userLat, userLng, data.latitude, data.longitude);
                    console.log(`[Geo] Issue is ${distance.toFixed(2)} meters away.`);
                    
                    // Trigger popup if within 100 meters
                    if (distance <= 100) {
                        setIssue({ id: data.complaintId, title: data.title, lat: data.latitude, lng: data.longitude });
                        setIsVisible(true);
                    } else {
                        // For demo purposes during the hackathon, we might want to trigger it anyway if distance > 100m
                        // Uncomment below to force trigger everywhere for demo:
                        // setIssue({ id: data.complaintId, title: data.title, lat: data.latitude, lng: data.longitude });
                        // setIsVisible(true);
                    }
                }, (error) => {
                    console.warn('[Geo] Could not get location for verification', error);
                });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Simple Haversine implementation (client-side)
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // metres
        const p1 = lat1 * Math.PI / 180;
        const p2 = lat2 * Math.PI / 180;
        const dp = (lat2 - lat1) * Math.PI / 180;
        const dl = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; 
    };

    const handleResponse = async (type: 'VERIFY' | 'IGNORE') => {
        if (!issue) return;
        setIsSubmitting(true);
        try {
            await verifyIssueAction(issue.id, type);
        } catch (e) {
            console.error("Verification failed", e);
        }
        // Always close after responding to keep UX smooth
        setIsVisible(false);
        setIssue(null);
        setIsSubmitting(false);
    };

    if (!isVisible || !issue) return null;

    return (
        <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-[9999] max-w-sm w-full bg-white rounded-3xl shadow-2xl shadow-indigo-900/20 p-6 border border-indigo-100 animate-in slide-in-from-bottom-8 fade-in-0 duration-500">
             <div className="flex items-start gap-4 mb-5">
                 <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100 shadow-inner">
                     <AlertCircle className="w-6 h-6 text-indigo-500" />
                 </div>
                 <div className="pt-1">
                     <h4 className="font-extrabold text-[#1e293b] text-[15px] leading-tight mb-1">Nearby Issue Validation</h4>
                     <p className="text-xs font-semibold text-[#64748b] leading-relaxed">
                         A new civic issue was reported very close to you. Is it real?
                     </p>
                 </div>
             </div>

             <div className="bg-gray-50/80 rounded-2xl p-4 mb-5 border border-gray-100 shadow-sm">
                 <p className="text-sm font-bold text-[#334155] leading-snug">"{issue.title}"</p>
             </div>

             <div className="grid grid-cols-2 gap-3">
                 <Button 
                     variant="outline" 
                     className="w-full rounded-xl h-11 border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold transition-colors"
                     onClick={() => handleResponse('IGNORE')}
                     disabled={isSubmitting}
                 >
                     <X className="w-4 h-4 mr-2" strokeWidth={3} />
                     Ignore
                 </Button>
                 <Button 
                     className="w-full rounded-xl h-11 bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/25 font-bold transition-all"
                     onClick={() => handleResponse('VERIFY')}
                     disabled={isSubmitting}
                 >
                     {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" strokeWidth={3} />}
                     Verify
                 </Button>
             </div>
        </div>
    );
}
