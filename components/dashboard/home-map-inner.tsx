'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

const SAMPLE_POINTS = [
    { id: '1', lat: 28.6139, lng: 77.2090, label: 'Delhi: 1.2k Reports', type: 'high' },
    { id: '2', lat: 19.0760, lng: 72.8777, label: 'Mumbai: 900+ Reports', type: 'med' },
    { id: '3', lat: 12.9716, lng: 77.5946, label: 'Bangalore: 1.5k Reports', type: 'high' },
    { id: '4', lat: 13.0827, lng: 80.2707, label: 'Chennai: 400+ Reports', type: 'low' },
    { id: '5', lat: 21.1702, lng: 72.8311, label: 'Surat: 600+ Reports', type: 'med' },
    { id: '6', lat: 22.5726, lng: 88.3639, label: 'Kolkata: 1.1k Reports', type: 'high' },
];

function createHomeMarker(color: string) {
    return L.divIcon({
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        html: `
            <div class="animate-pulse" style="
                width: 40px; height: 40px;
                background: ${color}22;
                border: 2px solid ${color}aa;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 0 20px ${color}44;
            ">
                <div style="
                    width: 14px; height: 14px;
                    background: ${color};
                    border-radius: 50%;
                    box-shadow: 0 0 10px ${color};
                "></div>
            </div>
        `,
    });
}

export default function HomeMapInner() {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current || leafletMap.current) return;

        // Create map centered on India
        const map = L.map(mapRef.current, {
            center: [22.8, 79.5], // Center shift to show more of India
            zoom: 5,
            zoomControl: false,
            attributionControl: false,
            scrollWheelZoom: false, // Better for homepage scrolling
        });

        // Use a very clean, minimal tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 19,
        }).addTo(map);

        // Add stylized markers
        SAMPLE_POINTS.forEach((point) => {
            const color = point.type === 'high' ? '#f97316' : point.type === 'med' ? '#3b82f6' : '#14b8a6';
            const icon = createHomeMarker(color);
            
            const marker = L.marker([point.lat, point.lng], { icon }).addTo(map);
            
            marker.bindPopup(`
                <div style="
                    background: #ffffff;
                    border: 1px solid rgba(0,0,0,0.1);
                    border-radius: 12px;
                    padding: 8px 12px;
                    font-family: inherit;
                    color: #1e293b;
                    font-weight: 700;
                    font-size: 13px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                ">
                    ${point.label}
                </div>
            `, {
                closeButton: false,
                offset: [0, -10],
                className: 'home-map-popup'
            });

            marker.on('mouseover', () => marker.openPopup());
            marker.on('mouseout', () => marker.closePopup());
        });

        // Custom Zoom Control
        L.control.zoom({ position: 'topright' }).addTo(map);

        leafletMap.current = map;

        return () => {
            map.remove();
            leafletMap.current = null;
        };
    }, []);

    return (
        <Card className="relative w-full h-[500px] overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-2xl group hover:shadow-orange-500/5 transition-all duration-700">
            {/* Map Container */}
            <div ref={mapRef} className="w-full h-full grayscale-[20%] group-hover:grayscale-0 transition-all duration-700" />

            {/* Call to Action Overlay */}
            <div className="absolute bottom-8 right-8 z-[1000] pointer-events-none">
                <div className="bg-[#f97316] text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce-slow">
                    <MapPin className="w-5 h-5" />
                    <span className="font-black text-sm uppercase tracking-wider">Reports across India</span>
                </div>
            </div>

            <style jsx global>{`
                .home-map-popup .leaflet-popup-content-wrapper {
                    background: transparent !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                }
                .home-map-popup .leaflet-popup-tip {
                    display: none;
                }
                .leaflet-container {
                    background: #f8fafc !important;
                }
            `}</style>
        </Card>
    );
}
