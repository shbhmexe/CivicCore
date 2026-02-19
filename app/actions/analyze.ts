'use server';

import { analyzeImageFull, type AIAnalysisResult } from '@/lib/ai';

// Maps civic labels to user-friendly categories and severity levels
const LABEL_MAP: Record<string, { category: string; severity: string }> = {
    'pothole': { category: 'Pothole', severity: 'HIGH' },
    'garbage': { category: 'Garbage', severity: 'MEDIUM' },
    'clean road': { category: 'Clean Road', severity: 'LOW' },
    'broken streetlight': { category: 'Broken Streetlight', severity: 'MEDIUM' },
    'water logging': { category: 'Water Leak', severity: 'HIGH' },
    'fallen tree': { category: 'Fallen Tree', severity: 'CRITICAL' },
};

// Professional description templates for each civic category
const DESCRIPTION_TEMPLATES: Record<string, (caption: string) => string> = {
    'pothole': (caption) =>
        `Road surface damage has been detected in the uploaded image. The AI vision system identified signs of deteriorated road infrastructure, including possible potholes or cracks that may pose a hazard to vehicles and pedestrians. This issue requires prompt assessment and repair by the municipal road maintenance department.`,
    'garbage': (caption) =>
        `Waste accumulation or improper refuse disposal has been identified in the uploaded image. The area appears to require municipal cleanup to maintain public hygiene and prevent potential health hazards. Immediate attention from the sanitation department is recommended.`,
    'water logging': (caption) =>
        `A water-related infrastructure issue has been detected in the uploaded image. Signs of water accumulation, possible leakage, or flooding are present, which may indicate drainage system failure or pipeline damage. This issue requires urgent attention from the water and drainage department.`,
    'broken streetlight': (caption) =>
        `A damaged or non-functional streetlight or electrical fixture has been identified in the uploaded image. This lighting infrastructure issue may compromise public safety, especially during nighttime hours. The electrical maintenance department should inspect and repair this promptly.`,
    'fallen tree': (caption) =>
        `Fallen or damaged vegetation has been detected in the uploaded image. A tree or large branch appears to be obstructing the area, which may block traffic or pose a risk to nearby infrastructure. The parks and urban forestry department should arrange for removal at the earliest.`,
    'clean road': (caption) =>
        `The uploaded image appears to show a road or public area in acceptable condition. No significant civic infrastructure issues were detected by the AI system. If you believe there is an issue not captured by the automated analysis, please describe it in the details below.`,
};

export interface AnalyzeResult {
    title?: string;
    description?: string;
    category?: string;
    severity?: string;
    caption?: string;
    confidence?: number;
    rawScores?: { label: string; score: number }[];
    method?: string;
    error?: string;
}

export async function analyzeImage(formData: FormData): Promise<AnalyzeResult> {
    const file = formData.get('image') as File;

    if (!file) {
        return { error: 'No image provided' };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const result: AIAnalysisResult = await analyzeImageFull(arrayBuffer, file.name);

        if (!result.label) {
            return {
                title: "Report Issue",
                description: "The AI analysis could not determine the specific issue type. Please describe the problem in detail below so our team can assess and address it appropriately.",
                category: "Other",
                severity: "MEDIUM",
                caption: result.caption || undefined,
                confidence: 0,
                rawScores: [],
                method: result.method,
            };
        }

        const match = LABEL_MAP[result.label.toLowerCase()] || { category: 'Other', severity: 'MEDIUM' };
        const cleanLabel = match.category;

        // Generate professional description
        const templateFn = DESCRIPTION_TEMPLATES[result.label.toLowerCase()];
        const description = templateFn
            ? templateFn(result.caption || '')
            : `An infrastructure issue has been identified in the uploaded image. The AI system classified this as "${cleanLabel}". Please review the details and provide any additional context to help authorities address this issue efficiently.`;

        return {
            title: `Issue: ${cleanLabel}`,
            description,
            category: match.category,
            severity: match.severity,
            caption: result.caption || undefined,
            confidence: result.confidence,
            rawScores: result.rawScores,
            method: result.method,
        };
    } catch (error) {
        console.error("Analyze Action Error:", error);
        return {
            title: "Report Issue",
            description: "AI analysis encountered an error. Please describe the issue manually so our team can assess it.",
            category: "Other",
            severity: "MEDIUM",
        };
    }
}
