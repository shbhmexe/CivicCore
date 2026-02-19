'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface Props {
    complaints: any[];
}

const STATUS_COLORS: Record<string, string> = {
    PENDING: '#eab308',
    ASSIGNED: '#3b82f6',
    IN_PROGRESS: '#f97316',
    RESOLVED: '#22c55e',
    REJECTED: '#ef4444',
};

function createMarkerIcon(color: string) {
    return L.divIcon({
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
        html: `
            <div style="
                width: 36px; height: 36px;
                background: ${color}22;
                border: 2px solid ${color}88;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                cursor: pointer;
                box-shadow: 0 0 14px ${color}44;
            ">
                <div style="
                    width: 12px; height: 12px;
                    background: ${color};
                    border-radius: 50%;
                    box-shadow: 0 0 8px ${color};
                "></div>
            </div>
        `,
    });
}

export default function ComplaintMapInner({ complaints }: Props) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<L.Map | null>(null);

    // Calculate center from complaints
    const centerLat = complaints.length > 0
        ? complaints.reduce((sum: number, c: any) => sum + c.latitude, 0) / complaints.length
        : 28.6139;
    const centerLng = complaints.length > 0
        ? complaints.reduce((sum: number, c: any) => sum + c.longitude, 0) / complaints.length
        : 77.2090;

    useEffect(() => {
        if (!mapRef.current || leafletMap.current) return;

        // Create map
        const map = L.map(mapRef.current, {
            center: [centerLat, centerLng],
            zoom: 13,
            zoomControl: false,
            attributionControl: false,
        });

        // Free dark tile layer (CartoDB Dark Matter - no API key needed)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19,
        }).addTo(map);

        // Add zoom control on right
        L.control.zoom({ position: 'topright' }).addTo(map);

        // Add attribution (compact)
        L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

        // Add markers
        complaints.forEach((complaint: any) => {
            const color = STATUS_COLORS[complaint.status] || '#14b8a6';
            const icon = createMarkerIcon(color);

            const marker = L.marker([complaint.latitude, complaint.longitude], { icon }).addTo(map);

            const popupContent = `
                <div style="
                    background: #0f111a;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 14px;
                    color: white;
                    font-family: system-ui, -apple-system, sans-serif;
                    min-width: 220px;
                ">
                    <div style="display: flex; align-items: start; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
                        <h4 style="font-size: 13px; font-weight: 700; color: #2dd4bf; margin: 0; line-height: 1.3;">
                            ${complaint.title}
                        </h4>
                        <span style="
                            font-size: 9px; padding: 2px 8px; border-radius: 4px; font-weight: 700;
                            text-transform: uppercase; white-space: nowrap;
                            background: ${color}22; color: ${color}; border: 1px solid ${color}33;
                        ">${complaint.severity || 'LOW'}</span>
                    </div>
                    <p style="font-size: 11px; color: #94a3b8; margin: 0 0 10px 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${complaint.description}
                    </p>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <div style="width: 6px; height: 6px; border-radius: 50%; background: ${color};"></div>
                            <span style="font-size: 10px; color: #64748b;">${complaint.status}</span>
                        </div>
                        <a href="/complaints/${complaint.id}" style="
                            font-size: 10px; font-weight: 700; color: white;
                            background: rgba(20,184,166,0.2); padding: 4px 12px;
                            border-radius: 8px; border: 1px solid rgba(20,184,166,0.2);
                            text-decoration: none;
                        ">View Details</a>
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent, {
                maxWidth: 280,
                closeButton: true,
                className: 'dark-leaflet-popup',
            });
        });

        // Fit bounds if multiple complaints
        if (complaints.length > 1) {
            const bounds = L.latLngBounds(complaints.map((c: any) => [c.latitude, c.longitude]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }

        leafletMap.current = map;

        return () => {
            map.remove();
            leafletMap.current = null;
        };
    }, []);

    return (
        <Card className="relative w-full h-[500px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0c14] shadow-2xl">
            {/* Map */}
            <div ref={mapRef} className="w-full h-full" style={{ background: '#0a0c14' }} />

            {/* Live Feed Overlay */}
            <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
                <div className="bg-[#0f111a]/80 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                        <AlertTriangle className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Live Feed</p>
                        <p className="text-sm font-bold text-white">{complaints.length} Reports Detected</p>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none">
                <div className="bg-[#0f111a]/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-xl shadow-xl flex items-center gap-4">
                    {Object.entries(STATUS_COLORS).slice(0, 4).map(([status, color]) => (
                        <div key={status} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                            <span className="text-[9px] text-gray-400 font-semibold uppercase">{status.replace('_', ' ')}</span>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                .dark-leaflet-popup .leaflet-popup-content-wrapper {
                    background: transparent !important;
                    box-shadow: none !important;
                    border-radius: 12px !important;
                    padding: 0 !important;
                }
                .dark-leaflet-popup .leaflet-popup-content {
                    margin: 0 !important;
                }
                .dark-leaflet-popup .leaflet-popup-tip {
                    background: #0f111a !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    box-shadow: none !important;
                }
                .dark-leaflet-popup .leaflet-popup-close-button {
                    color: #64748b !important;
                    font-size: 18px !important;
                    right: 8px !important;
                    top: 8px !important;
                    z-index: 10 !important;
                }
                .dark-leaflet-popup .leaflet-popup-close-button:hover {
                    color: white !important;
                }
                .leaflet-control-zoom a {
                    background: #0f111a !important;
                    color: white !important;
                    border-color: rgba(255,255,255,0.1) !important;
                }
                .leaflet-control-zoom a:hover {
                    background: #1a1d2e !important;
                }
            `}</style>
        </Card>
    );
}
