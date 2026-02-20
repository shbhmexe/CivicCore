'use client';

import { useState, useRef, useActionState } from 'react';
import { createReport } from '@/app/actions/report';
import { analyzeImage } from '@/app/actions/analyze';
import type { AnalyzeResult } from '@/app/actions/analyze';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import exifr from 'exif-js';
import { Loader2, MapPin, Upload, Wand2, Brain, Sparkles, Eye, BarChart3 } from 'lucide-react';
import Image from 'next/image';

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
    const [state, formAction, isPending] = useActionState(createReport, initialState);
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

    // AI Analysis Data
    const [aiData, setAiData] = useState<AnalyzeResult | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const detectLocation = async () => {
        if (!navigator.geolocation) return;

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setLocation({ lat, lng });
                const addr = await getAddressFromCoords(lat, lng);
                setAddress(addr);
                setIsLocating(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
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

                                {/* Category + Severity + Confidence Row */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                                        <div className="text-xs text-muted-foreground mb-1">Category</div>
                                        <div className="font-bold text-primary text-sm">{aiData.category}</div>
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
                            {!location && (
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
                                    Detect Location
                                </Button>
                            )}
                        </div>
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

                    <div className="pt-4">
                        <Button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting Report...
                                </>
                            ) : (
                                'Submit Report to Authorities'
                            )}
                        </Button>
                        {/* @ts-ignore - TS might complain about error property on state if types are strict */}
                        {state?.error && (
                            <p className="text-destructive mt-2 text-sm">
                                {/* @ts-ignore */}
                                {typeof state.error === 'string' ? state.error : 'Please check the form fields'}
                            </p>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
