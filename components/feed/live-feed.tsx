'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, CheckCircle2, Flame, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LiveFeed({ initialActivities }: { initialActivities: any[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const socket = io({ path: '/api/socketio' });

        socket.on('connect', () => console.log('[Feed] Connected to live updates'));

        socket.on('activity-broadcast', () => {
            console.log('[Feed] Real-time activity broadcast received! Refreshing feed...');
            // Signal received! Someone created an activity. Refresh the page data!
            startTransition(() => {
                router.refresh();
            });
        });

        return () => {
             socket.disconnect();
        };
    }, [router]);

    const getIcon = (type: string) => {
        switch(type) {
            case 'NEW_REPORT': return <AlertCircle className="w-5 h-5 text-orange-500" />;
            case 'RESOLVED': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'HIGH_VOTES': return <Flame className="w-5 h-5 text-rose-500" />;
            default: return <Zap className="w-5 h-5 text-blue-500" />;
        }
    }

    return (
        <div className="space-y-4 relative">
             {isPending && (
                  <div className="absolute -top-12 right-0 flex items-center gap-2 text-blue-500 text-xs font-bold bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full animate-pulse shadow-sm z-10">
                      <Loader2 className="w-4 h-4 animate-spin" /> Live Syncing...
                  </div>
             )}
             
             {initialActivities.length === 0 ? (
                 <div className="text-center p-12 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                     <p className="text-[#64748b] font-medium text-lg">No activity yet. Be the first to report!</p>
                 </div>
             ) : (
                 initialActivities.map((act) => (
                     <div key={act.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all flex items-start gap-5 group">
                          <div className={cn(
                              "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110 duration-300",
                              act.type === 'NEW_REPORT' && "bg-orange-50 border-orange-100",
                              act.type === 'RESOLVED' && "bg-green-50 border-green-100",
                              act.type === 'HIGH_VOTES' && "bg-rose-50 border-rose-100"
                          )}>
                              {getIcon(act.type)}
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                              <p className="text-base font-bold text-[#1e293b] leading-tight">
                                  {act.content} 
                              </p>
                              <p className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] mt-3 flex items-center gap-2">
                                  <span>{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}</span>
                                  {act.complaintId && (
                                     <>
                                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                                        <span>Issue #{act.complaintId.slice(-4)}</span>
                                     </>
                                  )}
                              </p>
                          </div>
                     </div>
                 ))
             )}
        </div>
    );
}
