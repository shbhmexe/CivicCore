'use client';

import { useState, useRef, useActionState, useEffect } from 'react';
import { createReport } from '@/app/actions/report';
import { analyzeImage } from '@/app/actions/analyze';
import type { AnalyzeResult } from '@/app/actions/analyze';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import exifr from 'exif-js';
import { Loader2, Brain, Sparkles, AlertCircle, RefreshCcw, Handshake, CheckCircle2, ShieldAlert, Fingerprint, Eye, BarChart3, Upload, ShieldCheck, Video, MapPin, Search, Mic, Square, Navigation, Navigation2, Crosshair, Layers, Building2, Wand2 } from 'lucide-react';
import Image from 'next/image';
import { VoiceConfirmation } from '@/components/report/voice-confirmation';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { io } from 'socket.io-client';

// Mock or Real Reverse Geocoding
async function getAddressFromCoords(lat: number, lng: number) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        return data.display_name;
    } catch (e) {
        return "Unknown Location";
    }
}

const initialState = {
    error: '',
}

export function SmartReportForm() {
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        const start = Date.now();
        const result = await createReport(prevState, formData);
        const elapsed = Date.now() - start;
        // Guarantee at least 3 seconds of loading animation UX
        if (elapsed < 3000) {
            await new Promise(r => setTimeout(r, 3000 - elapsed));
        }
        return result;
    }, initialState);
    const router = useRouter();
    const [submittedData, setSubmittedData] = useState<{ complaintId: string; userName: string; issueTitle: string; merged?: boolean } | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [address, setAddress] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    // Controlled Form State for AI Fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [severity, setSeverity] = useState('MEDIUM');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationMethod, setVerificationMethod] = useState<'CALL' | 'VIDEO'>('CALL');
    
    // Video Handling
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Fake progress simulation
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPending) {
            setUploadProgress(5); // Start at 5% instantly
            interval = setInterval(() => {
                setUploadProgress((prev) => {
                    const increment = Math.random() * 15;
                    const next = prev + increment;
                    return next > 92 ? 92 : next; // Hold at 92% until done
                });
            }, 400);
        } else {
            setUploadProgress(100);
            const timeout = setTimeout(() => setUploadProgress(0), 500);
            return () => clearTimeout(timeout);
        }
        return () => clearInterval(interval);
    }, [isPending]);

    // Handle auto-redirect for video verification method
    useEffect(() => {
        if (submittedData && state?.verificationMethod === 'VIDEO') {
            const t = setTimeout(() => {
                router.push(`/complaints/${submittedData.complaintId}`);
            }, 3000);
            return () => clearTimeout(t);
        }
    }, [submittedData, state?.verificationMethod, router]);

    // Emit socket event on successful submission (if not merged)
    useEffect(() => {
        if (state?.success && !state?.merged) {
            const socket = io({ path: '/api/socketio' });
            socket.emit('new-activity');

            // Trigger nearby verification broadcast
            if (state.latitude && state.longitude) {
                socket.emit('trigger-nearby-verification', {
                    complaintId: state.complaintId,
                    title: state.issueTitle,
                    latitude: state.latitude,
                    longitude: state.longitude
                });
            }
        }
    }, [state?.success, state?.merged, state?.latitude, state?.longitude, state?.complaintId, state?.issueTitle]);

    // AI Analysis Data
    const [aiData, setAiData] = useState<AnalyzeResult | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [locationError, setLocationError] = useState<string | null>(null);

    const detectLocation = async () => {
        // 1. Check if geolocation API exists
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by this browser.');
            return;
        }

        // 2. Check HTTPS — mobile browsers block geolocation on HTTP
        const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!isSecure) {
            setLocationError('Location requires HTTPS. Please access the site via HTTPS.');
            return;
        }

        // 3. Check permission state (if API available)
        if (navigator.permissions) {
            try {
                const permState = await navigator.permissions.query({ name: 'geolocation' });
                if (permState.state === 'denied') {
                    setLocationError('Location permission is blocked. Please enable it in your browser Site Settings → Location → Allow.');
                    return;
                }
            } catch {
                // Permissions API not fully supported, continue anyway
            }
        }

        setIsLocating(true);
        setLocationError(null);

        try {
            // On mobile, low accuracy (network/Wi-Fi) is faster and more reliable
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: false,
                    timeout: 20000,
                    maximumAge: 60000, // Accept cached location up to 1 minute old
                });
            });

            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setLocation({ lat, lng });
            const addr = await getAddressFromCoords(lat, lng);
            setAddress(addr);
        } catch (error: any) {
            console.error('Geolocation error:', error);
            if (error?.code === 1) {
                setLocationError('Location permission denied. Go to browser Settings → Site Settings → Location and allow this site.');
            } else if (error?.code === 2) {
                setLocationError('Location unavailable. Turn on GPS/Location Services in your phone settings, then try again.');
            } else if (error?.code === 3) {
                setLocationError('Location timed out. Make sure GPS is enabled, or try in an open area.');
            } else {
                setLocationError('Could not detect location. Please try again.');
            }
        } finally {
            setIsLocating(false);
        }
    };

    // Compress image using Canvas for reliable uploads (especially mobile camera photos)
    const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
        return new Promise((resolve) => {
            // If already small enough, skip compression
            if (file.size < 1024 * 1024) {
                resolve(file);
                return;
            }

            const img = document.createElement('img');
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);

                let { width, height } = img;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            console.log(`[Compress] ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB`);
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(file); // Fallback to original
            };

            img.src = url;
        });
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setVideoPreview(null);
            return;
        }

        // Limit to 100MB
        if (file.size > 100 * 1024 * 1024) {
            alert('Video must be 100MB or smaller.');
            e.target.value = '';
            setVideoPreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setVideoPreview(objectUrl);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        setIsAnalyzing(true);
        setAiData(null);

        // 1. EXIF Extraction (Promisified)
        let locationFound = false;
        try {
            await new Promise((resolve) => {
                // @ts-ignore
                exifr.getData(file, function () {
                    // @ts-ignore
                    const lat = exifr.getTag(this, "GPSLatitude");
                    // @ts-ignore
                    const lng = exifr.getTag(this, "GPSLongitude");

                    if (lat && lng) {
                        // @ts-ignore
                        const latRef = exifr.getTag(this, "GPSLatitudeRef") || "N";
                        // @ts-ignore
                        const lngRef = exifr.getTag(this, "GPSLongitudeRef") || "E";

                        const convertDMSToDD = (dms: number[], ref: string) => {
                            let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;
                            if (ref === "S" || ref === "W") {
                                dd = dd * -1;
                            }
                            return dd;
                        };

                        const latitude = convertDMSToDD(lat, latRef);
                        const longitude = convertDMSToDD(lng, lngRef);

                        setLocation({ lat: latitude, lng: longitude });
                        locationFound = true;
                        getAddressFromCoords(latitude, longitude).then(setAddress);
                    }
                    resolve(null);
                });
            });

            // 2. Fallback: Browser Geolocation (Automatic)
            if (!locationFound) {
                detectLocation();
            }
        } catch (e) {
            console.error("EXIF Error", e);
            if (!locationFound) detectLocation();
        }

        // 3. AI Analysis (compress first for reliability)
        try {
            const compressedFile = await compressImage(file);
            const formData = new FormData();
            formData.append('image', compressedFile);

            const result = await analyzeImage(formData);
            console.log("AI Analysis Result:", result);

            if (result && !result.error) {
                if (result.title) setTitle(result.title);
                if (result.description) setDescription(result.description);
                if (result.category) setCategory(result.category);
                if (result.severity) setSeverity(result.severity);
                setAiData(result);
            }
        } catch (error) {
            console.error("AI Analysis Failed", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getSeverityColor = (sev: string) => {
        switch (sev) {
            case 'LOW': return 'text-green-400 bg-green-400/10 border-green-400/30';
            case 'MEDIUM': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
            case 'HIGH': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
            case 'CRITICAL': return 'text-red-400 bg-red-400/10 border-red-400/30';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
        }
    };

    // Check if report was submitted successfully — show voice confirmation
    if (state?.success && state?.complaintId && !submittedData) {
        setSubmittedData({
            complaintId: state.complaintId,
            userName: state.userName || 'Citizen',
            issueTitle: state.issueTitle || 'Civic Issue',
            merged: state.merged
        });
    }

    // ── Show Voice Confirmation Screen ──
    if (submittedData) {
        if (submittedData.merged) {
             return (
                 <Card className="w-full max-w-2xl mx-auto glass-card animate-in fade-in zoom-in duration-500">
                     <CardHeader className="text-center pb-2">
                         <div className="mx-auto w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 border border-blue-500/30">
                             <Layers className="w-10 h-10 text-blue-400" />
                         </div>
                         <CardTitle className="text-2xl font-bold flex flex-col items-center gap-2 text-blue-400">
                             Duplicate Detected & Auto-Merged!
                         </CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-6 text-center">
                         <p className="text-sm text-foreground/80 max-w-md mx-auto">
                             Our AI found an existing report for this exact issue nearby! Instead of creating a duplicate ticket, we automatically added your report as an <strong>upvote</strong> to escalate the original issue faster.
                         </p>
                         <p className="text-xs text-muted-foreground mt-2">
                             You have been awarded Karma points for your contribution!
                         </p>
                         <div className="flex flex-col items-center justify-center pt-8 gap-3">
                             <Button onClick={() => router.push(`/complaints/${submittedData.complaintId}`)} className="bg-blue-600 hover:bg-blue-500 px-8 py-6 text-md font-bold text-white rounded-xl shadow-lg shadow-blue-500/20">
                                 View Original Issue
                             </Button>
                         </div>
                     </CardContent>
                 </Card>
             );
        }

        if (state?.verificationMethod === 'VIDEO') {
            return (
                <Card className="w-full max-w-2xl mx-auto glass-card animate-in fade-in zoom-in duration-500">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
                            <ShieldCheck className="w-10 h-10 text-emerald-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold flex flex-col items-center gap-2 text-emerald-400">
                            Evidence Uploaded Successfully!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 text-center">
                        <p className="text-sm text-foreground/80 max-w-md mx-auto">
                            Your report <strong>&quot;{submittedData.issueTitle}&quot;</strong> has been submitted and verified with your video proof. Authorities have been immediately notified.
                        </p>
                        <div className="flex flex-col items-center justify-center pt-8 gap-3">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                            <span className="text-xs font-medium text-blue-400 animate-pulse">Redirecting to report tracking...</span>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card className="w-full max-w-2xl mx-auto glass-card">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2 text-emerald-400">
                        ✅ Report Submitted Successfully!
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                        Your report <strong>&quot;{submittedData.issueTitle}&quot;</strong> has been submitted.
                        Please confirm it via a quick AI voice call below.
                    </p>
                    
                    <VoiceConfirmation
                        complaintId={submittedData.complaintId}
                        userName={submittedData.userName}
                        issueTitle={submittedData.issueTitle}
                    />

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push('/dashboard')}
                    >
                        Skip & Go to Dashboard
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Determine if we show voice confirmation (now only if method is CALL)
    if (state?.success && state?.complaintId && !submittedData && state?.verificationMethod === 'CALL') {
        setSubmittedData({
            complaintId: state.complaintId,
            userName: state.userName || 'Citizen',
            issueTitle: state.issueTitle || 'Civic Issue'
        });
    } else if (state?.success && state?.complaintId && state?.verificationMethod === 'VIDEO') {
        // Automatically rediect or show success without call confirmation since they uploaded a video
        router.push(`/complaints/${state.complaintId}`);
        return null;
    }

    return (
        <Card className="w-full max-w-2xl mx-auto glass-card">
            <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Wand2 className="w-6 h-6 text-primary" />
                    Smart Report
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-6">
                    {/* Image Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="image">Evidence Photo</Label>
                        <div
                            className="border-2 border-dashed border-white/20 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors relative h-64"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {preview ? (
                                <Image src={preview} alt="Preview" fill className="object-contain rounded-lg p-2" />
                            ) : (
                                <>
                                    <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                                    <span className="text-sm text-muted-foreground">Drag image file here or click to browse from your device</span>
                                </>
                            )}
                            {isAnalyzing && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-lg">
                                    <div className="flex flex-col items-center text-white">
                                        <div className="relative">
                                            <Brain className="w-10 h-10 text-primary animate-pulse" />
                                            <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-ping" />
                                        </div>
                                        <span className="mt-3 font-medium">AI Analyzing Image...</span>
                                        <span className="text-xs text-white/60 mt-1">Running ResNet-50 classification</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            name="image"
                            id="image"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* ═══════ AI Analysis Panel ═══════ */}
                    {aiData && (
                        <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 overflow-hidden">
                            {/* Header */}
                            <div className="px-4 py-3 bg-primary/10 border-b border-primary/20 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-primary" />
                                <span className="font-semibold text-sm">CivicLens AI Analysis</span>
                                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                    ✓ Complete
                                </span>
                            </div>

                            <div className="p-4 space-y-4">
                                {/* AI Caption */}
                                {aiData.caption && (
                                    <div className="space-y-1.5">
                                        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                            <Eye className="w-3.5 h-3.5" />
                                            AI Vision Description
                                        </div>
                                        <p className="text-sm bg-white/5 rounded-lg px-3 py-2.5 italic text-foreground/90 border border-white/10">
                                            &ldquo;{aiData.caption}&rdquo;
                                        </p>
                                    </div>
                                )}

                                {(() => {
                                    // --- Category to Department Visual Map ---
                                    const departmentNames: Record<string, string> = {
                                        'pothole': 'Roads & Infrastructure',
                                        'garbage': 'Sanitation & Waste',
                                        'water logging': 'Water & Drainage',
                                        'broken streetlight': 'Electrical & Lighting',
                                        'fallen tree': 'Parks & Forestry',
                                        'clean road': 'General Municipal'
                                    };
                                    const mappedDept = departmentNames[aiData.category?.toLowerCase() || ''] || 'General Municipal';

                                    return (
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                                                <div className="text-xs text-muted-foreground mb-1">Category</div>
                                                <div className="font-bold text-primary text-sm line-clamp-1" title={aiData.category}>{aiData.category}</div>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3 text-center border border-blue-500/20">
                                                <div className="text-xs text-blue-300/70 mb-1">Routed Dept</div>
                                                <div className="font-bold text-blue-400 text-sm line-clamp-1 flex items-center justify-center gap-1" title={mappedDept}>
                                                    <Building2 className="w-3.5 h-3.5" />
                                                    {mappedDept}
                                                </div>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                                                <div className="text-xs text-muted-foreground mb-1">Severity</div>
                                                <div className={`font-bold text-sm inline-block px-2 py-0.5 rounded ${getSeverityColor(aiData.severity || '')}`}>
                                                    {aiData.severity}
                                                </div>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                                                <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                                                <div className="font-bold text-emerald-400 text-sm">
                                                    {((aiData.confidence || 0) * 100).toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Confidence Bars */}
                                {aiData.rawScores && aiData.rawScores.length > 0 && (
                                    <div className="space-y-1.5">
                                        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                            <BarChart3 className="w-3.5 h-3.5" />
                                            AI Classification Scores
                                        </div>
                                        <div className="space-y-1.5">
                                            {aiData.rawScores.map((score, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground w-36 truncate" title={score.label}>
                                                        {score.label}
                                                    </span>
                                                    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${i === 0 ? 'bg-gradient-to-r from-primary to-blue-500' : 'bg-white/20'
                                                                }`}
                                                            style={{ width: `${Math.max(score.score * 100, 1)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground w-12 text-right">
                                                        {(score.score * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ══════ Authenticity Verification ══════ */}
                                <div className="pt-2 border-t border-white/10 mt-4">
                                    {aiData.aiVerdict ? (
                                        <>
                                            <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${aiData.aiVerdict === 'AI_FLAGGED' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                        {aiData.aiVerdict === 'AI_FLAGGED' ? <AlertCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                            <Fingerprint className="w-3 h-3" />
                                                            Image Authenticity
                                                        </div>
                                                        <div className={`text-sm font-bold ${aiData.aiVerdict === 'AI_FLAGGED' ? 'text-red-400' : 'text-emerald-400'}`}>
                                                            {aiData.aiVerdict === 'AI_FLAGGED' ? 'Flagged: AI Generated' : 'Likely Authentic Image'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] text-muted-foreground uppercase">Confidence</div>
                                                    <div className={`text-xs font-mono font-bold ${aiData.aiVerdict === 'AI_FLAGGED' ? 'text-red-400' : 'text-emerald-400'}`}>
                                                        {(aiData.aiConfidence! * 100).toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>
                                            {aiData.aiVerdict === 'AI_FLAGGED' && (
                                                <p className="mt-2 text-[10px] leading-tight px-1 text-red-300/80">
                                                    Warning: Multiple AI models agree this image shows strong patterns of AI generation.
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
                                                    <Fingerprint className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                        <Fingerprint className="w-3 h-3" />
                                                        Image Authenticity
                                                    </div>
                                                    <div className="text-sm font-bold text-yellow-400">
                                                        Scan Pending — Model Loading...
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Method Badge */}
                                <div className="text-xs text-muted-foreground/60 text-right">
                                    Powered by {aiData.method === 'resnet-bart' ? 'CivicLens AI Engine' : aiData.method === 'keyword' ? 'Keyword Analysis' : 'AI Analysis'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Auto-Filled Location */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Latitude</Label>
                            <Input name="latitude" value={location?.lat || ''} readOnly className="bg-white/5" />
                        </div>
                        <div className="space-y-2">
                            <Label>Longitude</Label>
                            <Input name="longitude" value={location?.lng || ''} readOnly className="bg-white/5" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Detailed Address</Label>
                            <Button
                                type="button"
                                variant="link"
                                size="sm"
                                onClick={detectLocation}
                                disabled={isLocating}
                                className="text-primary hover:text-primary/80 h-auto p-0 text-xs flex items-center gap-1"
                            >
                                {isLocating ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <MapPin className="w-3 h-3" />
                                )}
                                {location ? 'Re-detect Location' : 'Detect Location'}
                            </Button>
                        </div>
                        {locationError && (
                            <p className="text-xs text-red-400 mt-1">{locationError}</p>
                        )}
                        <div className="flex gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-3" />
                            <div className="flex-1 relative">
                                <Input
                                    name="address"
                                    value={address}
                                    readOnly
                                    className="bg-white/5 pr-8"
                                    placeholder={isLocating ? "Getting current location..." : "Location will appear here"}
                                />
                                {isLocating && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* AI Suggested Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category (AI Suggested)</Label>
                            <Input
                                name="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="e.g. Pothole"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Severity</Label>
                            <select
                                name="severity"
                                value={severity}
                                onChange={(e) => setSeverity(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-white/5"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>
                    </div>

                    {/* Moved verificationMethod UI block down */}

                    {/* Moved content */}

                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            name="title"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Brief description of the issue"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            name="description"
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Provide more details..."
                        />
                    </div>

                    {/* ══════ Verification Method ══════ */}
                    <div className="space-y-4 pt-6 border-t border-white/10 mt-6">
                        <Label className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
                            Step 2: Provide Proof & Verify
                        </Label>
                        
                        <div className="grid grid-cols-2 gap-3 h-12">
                            <button
                                type="button"
                                onClick={() => setVerificationMethod('CALL')}
                                className={cn(
                                    "flex items-center justify-center gap-2 rounded-xl border transition-all font-medium text-sm",
                                    verificationMethod === 'CALL' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                )}
                            >
                                AI Voice Call
                            </button>
                            <button
                                type="button"
                                onClick={() => setVerificationMethod('VIDEO')}
                                className={cn(
                                    "flex items-center justify-center gap-2 rounded-xl border transition-all font-medium text-sm",
                                    verificationMethod === 'VIDEO' ? "bg-blue-500/20 text-blue-400 border-blue-500/50" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                )}
                            >
                                <Video className="w-4 h-4" />
                                Upload Video
                            </button>
                        </div>

                        <div className="mt-4 relative overflow-hidden">
                            {verificationMethod === 'CALL' ? (
                                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                    <Label htmlFor="phoneNumber">Phone Number for AI Call</Label>
                                    <Input
                                        name="phoneNumber"
                                        id="phoneNumber"
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="+91XXXXXXXXXX"
                                        className="bg-white/5"
                                        required={verificationMethod === 'CALL'}
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1 text-emerald-400 font-medium">
                                        You will receive an AI voice call 10 seconds after submission to confirm this report.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                    <Label htmlFor="video">Upload Verification Video</Label>
                                    <div
                                        className={cn(
                                            "border-2 border-dashed border-white/20 rounded-lg p-6 flex flex-col items-center justify-center transition-colors relative min-h-[140px]",
                                            isPending ? "opacity-80 cursor-default" : "cursor-pointer hover:bg-white/5"
                                        )}
                                        onClick={() => !isPending && videoInputRef.current?.click()}
                                    >
                                        {videoPreview ? (
                                            <div className="w-full text-center">
                                                <div className="text-emerald-400 text-sm font-bold mb-3 flex items-center justify-center gap-2">
                                                    <ShieldCheck className="w-4 h-4" /> Video Selected
                                                </div>
                                                <div className="relative inline-block mx-auto rounded-lg overflow-hidden border border-white/10 shadow-lg">
                                                    <video src={videoPreview} className="h-32 object-cover block" controls={!isPending} />
                                                    {isPending && (
                                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 text-white z-10 transition-all">
                                                            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                                                            <span className="text-xs font-bold text-emerald-400 animate-pulse">{Math.round(uploadProgress)}%</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-2">
                                                    {isPending ? 'Uploading to secure server...' : 'Click to replace'}
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                                <span className="text-sm text-foreground/80 font-medium tracking-wide">Click to select video</span>
                                                <span className="text-xs text-muted-foreground mt-1 text-blue-400">Max size 100MB</span>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        name="video"
                                        id="video"
                                        ref={videoInputRef}
                                        className="hidden"
                                        accept="video/*"
                                        onChange={handleVideoChange}
                                        required={verificationMethod === 'VIDEO'}
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1 text-blue-400 font-medium">
                                        Uploading a video serves as confirmation and bypasses the AI call.
                                    </p>
                                </div>
                            )}
                        </div>
                        <input type="hidden" name="verificationMethod" value={verificationMethod} />
                    </div>

                    <div className="pt-4">
                        {aiData?.aiVerdict === 'AI_FLAGGED' && (
                            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 animate-in fade-in zoom-in-95 duration-300">
                                <AlertCircle className="w-8 h-8 text-red-500 mb-1" />
                                <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest">Submission Blocked</h3>
                                <p className="text-xs text-red-300/80 font-medium max-w-[90%]">
                                    Our systems detected that this image is likely AI-generated. To maintain platform integrity, manipulated or synthetic reports are not accepted.
                                </p>
                            </div>
                        )}
                        <Button 
                            type="submit" 
                            className={cn(
                                "w-full h-14 relative overflow-hidden transition-all font-semibold",
                                aiData?.aiVerdict === 'AI_FLAGGED' 
                                    ? "bg-red-950/50 text-red-500/50 cursor-not-allowed border border-red-900/50" 
                                    : "bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                            )} 
                            disabled={isPending || aiData?.aiVerdict === 'AI_FLAGGED'}
                        >
                            {isPending && (
                                <div className="absolute bottom-0 left-0 h-1.5 bg-black/20 w-full overflow-hidden">
                                     <div 
                                        className="h-full bg-emerald-400 rounded-r-full shadow-[0_0_10px_rgba(52,211,153,0.8)] transition-all duration-500 ease-out flex items-center justify-end pr-1" 
                                        style={{ width: `${uploadProgress}%` }}
                                     >
                                        <div className="w-1 h-1 bg-white rounded-full animate-pulse opacity-70"></div>
                                     </div>
                                </div>
                            )}
                            {isPending ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="h-5 w-5 animate-spin text-emerald-200" />
                                    <span className="text-white">
                                        {verificationMethod === 'VIDEO' ? 'Uploading Video...' : 'Submitting Report...'} 
                                        <span className="text-emerald-200 ml-2 font-mono text-xs">{Math.round(uploadProgress)}%</span>
                                    </span>
                                </div>
                            ) : aiData?.aiVerdict === 'AI_FLAGGED' ? (
                                'Cannot Submit AI Image'
                            ) : (
                                'Submit Report to Authorities'
                            )}
                        </Button>
                        {/* @ts-ignore - TS might complain about error property on state if types are strict */}
                        {state?.error && (
                            <div className="text-destructive mt-3 text-sm bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-left">
                                {/* @ts-ignore */}
                                {typeof state.error === 'string' ? state.error : (
                                    <div className="flex flex-col gap-2">
                                        <span className="font-semibold text-red-500 mb-1 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" /> Please check the following fields:
                                        </span>
                                        <ul className="list-disc pl-5 opacity-90 space-y-1">
                                            {/* @ts-ignore */}
                                            {Object.entries(state.error).map(([key, val]) => (
                                                <li key={key} className="text-xs capitalize">{key}: {Array.isArray(val) ? val[0] : 'Invalid'}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
