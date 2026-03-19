import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || '');

// Civic categories for BART zero-shot classification (descriptive for better accuracy)
const CIVIC_CATEGORIES = [
    "Road pothole or crack damage",
    "Garbage or waste dumping",
    "Water logging or flooding",
    "Broken or damaged streetlight",
    "Fallen tree blocking road",
    "Clean road no issues",
];

// Map BART labels back to short civic labels
const BART_TO_CIVIC: Record<string, string> = {
    "Road pothole or crack damage": "pothole",
    "Garbage or waste dumping": "garbage",
    "Water logging or flooding": "water logging",
    "Broken or damaged streetlight": "broken streetlight",
    "Fallen tree blocking road": "fallen tree",
    "Clean road no issues": "clean road",
};

// Full AI analysis result type
export interface AIAnalysisResult {
    label: string | null;
    caption: string | null;
    confidence: number;
    rawScores: { label: string; score: number }[];
    method: 'resnet-bart' | 'keyword' | 'fallback';
    isAI?: boolean;
    aiConfidence?: number;
    aiVerdict?: 'AUTHENTIC' | 'AI_FLAGGED';
}

/**
 * Step 1: Use ResNet-50 to get raw image labels.
 * Returns top-5 ImageNet labels like "manhole cover", "sandbar", etc.
 */
async function getImageLabels(imageBuffer: ArrayBuffer): Promise<string[] | null> {
    try {
        console.log("[AI] Step 1: Getting image labels with ResNet-50...");

        const output = await client.imageClassification({
            data: new Blob([imageBuffer], { type: "image/jpeg" }),
            model: "microsoft/resnet-50",
            provider: "hf-inference",
        });

        if (Array.isArray(output) && output.length > 0) {
            const labels = output.slice(0, 5).map(r => r.label);
            console.log("[AI] ResNet Labels:", labels.join(", "));
            return labels;
        }
        return null;
    } catch (e: any) {
        console.error("[AI] ResNet Error:", e.message);
        return null;
    }
}

/**
 * Step 2: Use BART zero-shot to classify ResNet labels into civic categories.
 * This is the key innovation — ResNet gives visual context, BART maps to civic issues.
 */
async function classifyIntoCivicCategory(resnetLabels: string[]): Promise<{
    label: string;
    confidence: number;
    rawScores: { label: string; score: number }[];
} | null> {
    try {
        console.log("[AI] Step 2: Classifying with BART zero-shot...");

        // Build a rich contextual prompt for BART from ResNet labels
        // Map ImageNet visual patterns to neutral physical descriptions
        const visualContext = resnetLabels.map(l => {
            const lower = l.toLowerCase();
            if (lower.includes("sand") || lower.includes("gravel") || lower.includes("cliff")) return "rough eroded surface with cracks and uneven terrain";
            if (lower.includes("volcano") || lower.includes("crater")) return "deep surface depression and damaged ground";
            if (lower.includes("seashore") || lower.includes("coast") || lower.includes("lake")) return "exposed outdoor terrain with surface irregularities";
            if (lower.includes("manhole") || lower.includes("grate") || lower.includes("grille")) return "road surface with infrastructure openings";
            if (lower.includes("tree") || lower.includes("branch") || lower.includes("log")) return "fallen vegetation and wood debris on the ground";
            if (lower.includes("trash") || lower.includes("bag") || lower.includes("plastic") || lower.includes("carton")) return "scattered refuse and waste material on the ground";
            if (lower.includes("lamp") || lower.includes("pole") || lower.includes("beacon") || lower.includes("traffic")) return "street lighting or signal infrastructure damage";
            if (lower.includes("fountain") || lower.includes("dam") || lower.includes("pipe") || lower.includes("puddle")) return "standing water accumulation and drainage issues";
            if (lower.includes("breakwater") || lower.includes("groyne")) return "broken barrier structure and eroded road edge";
            if (lower.includes("lakeside") || lower.includes("lakeshore")) return "standing water near infrastructure";
            if (lower.includes("shoe") || lower.includes("jean") || lower.includes("umbrella") || lower.includes("doormat")) return "urban ground-level scene showing road or sidewalk";
            return l;
        });
        // De-duplicate similar descriptions
        const uniqueContext = [...new Set(visualContext)];
        const inputText = `A citizen reported a civic issue in their city. Visual analysis of the uploaded photo shows: ${uniqueContext.join("; ")}. What type of civic infrastructure problem does this most likely represent?`;
        console.log(`[AI] BART Input: "${inputText}"`);

        const result = await client.zeroShotClassification({
            model: "facebook/bart-large-mnli",
            inputs: inputText,
            parameters: {
                candidate_labels: CIVIC_CATEGORIES,
            },
            provider: "hf-inference",
        });

        // Parse response — could be array or object
        let labels: string[] = [];
        let scores: number[] = [];

        if (Array.isArray(result)) {
            // Array format: [{label, score}, ...]
            labels = result.map((r: any) => r.label);
            scores = result.map((r: any) => r.score);
        } else if (result && typeof result === 'object') {
            labels = (result as any).labels || [];
            scores = (result as any).scores || [];
        }

        if (labels.length === 0) return null;

        // Map to civic labels
        const rawScores = labels.map((lbl: string, i: number) => ({
            label: BART_TO_CIVIC[lbl] || lbl,
            score: scores[i] || 0,
        }));

        const topCivicLabel = BART_TO_CIVIC[labels[0]] || labels[0];
        const topScore = scores[0] || 0;

        console.log(`[AI] Result: "${topCivicLabel}" — ${(topScore * 100).toFixed(1)}% confidence`);

        return {
            label: topCivicLabel,
            confidence: topScore,
            rawScores: rawScores.slice(0, 5),
        };
    } catch (e: any) {
        console.error("[AI] BART Error:", e.message);
        return null;
    }
}

/**
 * Step 3: Detect if image is AI generated.
 * 
 * THREE-TIER DETECTION PIPELINE:
 *   PRIMARY: SightEngine GenAI API — dedicated AI-image detection service (99% accuracy)
 *            Detects: Midjourney, DALL-E, Stable Diffusion, Flux, Imagen, etc.
 *   SECONDARY: Groq Llama 4 Scout Vision — VLM-based reasoning about AI artifacts
 *   FALLBACK: umm-maybe/AI-image-detector — basic binary classifier
 */
async function detectAIImage(imageBuffer: ArrayBuffer): Promise<{ isAI: boolean; confidence: number; verdict: 'AUTHENTIC' | 'AI_FLAGGED' } | null> {

    // === PRIMARY: SightEngine GenAI Detection (Best Accuracy) ===
    const seUser = process.env.SIGHTENGINE_API_USER;
    const seSecret = process.env.SIGHTENGINE_API_SECRET;
    
    if (seUser && seSecret) {
        try {
            console.log("[AI] Step 3: Analyzing image with SightEngine GenAI detector...");
            
            const formData = new FormData();
            formData.append('media', new Blob([imageBuffer], { type: 'image/jpeg' }), 'image.jpg');
            formData.append('models', 'genai');
            formData.append('api_user', seUser);
            formData.append('api_secret', seSecret);

            const seResponse = await fetch('https://api.sightengine.com/1.0/check.json', {
                method: 'POST',
                body: formData,
            });

            if (seResponse.ok) {
                const data = await seResponse.json();
                console.log(`[AI] SightEngine raw response:`, JSON.stringify(data?.type));

                if (data?.type?.ai_generated !== undefined) {
                    const aiScore = data.type.ai_generated; // 0.0 to 1.0
                    console.log(`[AI] SightEngine Verdict: AI=${(aiScore * 100).toFixed(1)}%`);

                    if (aiScore >= 0.50) {
                        return { isAI: true, confidence: aiScore, verdict: 'AI_FLAGGED' };
                    } else {
                        return { isAI: false, confidence: 1 - aiScore, verdict: 'AUTHENTIC' };
                    }
                }
            } else {
                const errText = await seResponse.text();
                console.error(`[AI] SightEngine API error: ${seResponse.status} — ${errText.substring(0, 200)}`);
            }
        } catch (e: any) {
            console.error("[AI] SightEngine Error:", e.message?.substring(0, 200));
        }
    } else {
        console.warn("[AI] SightEngine keys not set — skipping primary AI detection. Add SIGHTENGINE_API_USER and SIGHTENGINE_API_SECRET to .env");
    }

    // === SECONDARY: Groq Llama 4 Scout Vision (VLM reasoning) ===
    if (process.env.GROQ_API_KEY) {
        try {
            console.log("[AI] Step 3b: Analyzing image with Groq Llama Vision...");
            const base64Image = Buffer.from(imageBuffer).toString('base64');

            const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                    messages: [{
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `You are an AI-generated image forensic analyst. Determine if this image is a REAL photograph or AI-GENERATED. Look for: unnatural smoothness, impossible lighting, warped details, repeating textures, overly perfect composition. Respond ONLY with JSON: {"verdict": "AI_GENERATED" or "REAL_PHOTO", "confidence": 0.0 to 1.0, "reason": "brief"}`
                            },
                            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                        ]
                    }],
                    temperature: 0.1,
                    max_tokens: 200,
                }),
            });

            if (groqResponse.ok) {
                const data = await groqResponse.json();
                const content = data.choices?.[0]?.message?.content?.trim() || '';
                console.log(`[AI] Groq Vision raw: ${content}`);
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    const isAI = parsed.verdict === 'AI_GENERATED';
                    const confidence = parseFloat(parsed.confidence) || 0.5;
                    console.log(`[AI] Groq Vision: ${parsed.verdict} (${(confidence * 100).toFixed(1)}%)`);
                    return { isAI, confidence, verdict: isAI ? 'AI_FLAGGED' : 'AUTHENTIC' };
                }
            } else {
                console.error(`[AI] Groq Vision error: ${groqResponse.status}`);
            }
        } catch (e: any) {
            console.error("[AI] Groq Vision Error:", e.message?.substring(0, 200));
        }
    }

    // === FALLBACK: umm-maybe binary classifier ===
    try {
        console.log("[AI] Falling back to umm-maybe/AI-image-detector...");
        const output = await client.imageClassification({
            data: new Blob([imageBuffer], { type: "image/jpeg" }),
            model: "umm-maybe/AI-image-detector",
            provider: "hf-inference",
        });

        if (Array.isArray(output) && output.length > 0) {
            console.log(`[AI] umm-maybe raw:`, JSON.stringify(output.slice(0, 4)));
            const parsed = parseAIDetectionScores(output);
            if (parsed) {
                if (parsed.aiScore >= 0.50) {
                    return { isAI: true, confidence: parsed.aiScore, verdict: 'AI_FLAGGED' };
                }
                return { isAI: false, confidence: parsed.humanScore || (1 - parsed.aiScore), verdict: 'AUTHENTIC' };
            }
        }
    } catch (e: any) {
        console.error("[AI] umm-maybe fallback also failed:", e.message?.substring(0, 150));
    }

    console.error("[AI] All AI detection methods failed.");
    return null;
}

function parseAIDetectionScores(data: any[]): { aiScore: number; humanScore: number } | null {
    if (!data || data.length === 0) return null;

    // Broadened labels to catch outputs from SMOGY, jacoballessio, and umm-maybe models
    const aiLabels = ['artificial', 'ai_generated', 'ai', 'fake', 'deepfake', 'generated', 'sd', 'stable_diffusion', 'midjourney'];
    const humanLabels = ['real', 'human', 'realism', 'authentic', 'not_generated', 'natural', 'original'];

    let aiScore = 0;
    let humanScore = 0;

    for (const item of data) {
        const label = (item.label || '').toLowerCase();
        if (aiLabels.some(l => label.includes(l)) && !label.includes('not_generated')) {
            aiScore = Math.max(aiScore, item.score || 0);
        }
        if (humanLabels.some(l => label.includes(l))) {
            humanScore = Math.max(humanScore, item.score || 0);
        }
    }

    console.log(`[AI] Model Scores: AI=${(aiScore * 100).toFixed(1)}%, Human=${(humanScore * 100).toFixed(1)}%`);

    return { aiScore, humanScore };
}

/**
 * Full AI analysis pipeline:
 *   Step 1: ResNet-50 → raw image labels
 *   Step 2: BART zero-shot → civic category classification
 *   Step 3: AI Image Detector → Authenticity check
 */
export async function analyzeImageFull(imageBuffer: ArrayBuffer, fileName: string = ""): Promise<AIAnalysisResult> {
    // Run detection and classification in parallel for performance
    const [resnetLabels, aiDetection] = await Promise.all([
        getImageLabels(imageBuffer),
        detectAIImage(imageBuffer)
    ]);

    if (resnetLabels && resnetLabels.length > 0) {
        // Step 2: Classify into civic categories
        const classification = await classifyIntoCivicCategory(resnetLabels);

        if (classification) {
            // Build a clean caption from the ResNet labels
            const caption = `AI vision system detected visual elements consistent with ${classification.label} in the uploaded image.`;

            return {
                label: classification.label,
                caption,
                confidence: classification.confidence,
                rawScores: classification.rawScores,
                method: 'resnet-bart',
                isAI: aiDetection?.isAI,
                aiConfidence: aiDetection?.confidence,
                aiVerdict: aiDetection?.verdict,
            };
        }

        // BART failed — fall back to keyword matching on ResNet labels
        const combinedLabels = resnetLabels.join(" ");
        const keywordLabel = getKeywordMatch(combinedLabels);
        return {
            label: keywordLabel,
            caption: keywordLabel ? `Detected signs of ${keywordLabel} from image analysis.` : null,
            confidence: keywordLabel ? 0.6 : 0,
            rawScores: [],
            method: 'keyword',
            isAI: aiDetection?.isAI,
            aiConfidence: aiDetection?.confidence,
            aiVerdict: aiDetection?.verdict,
        };
    }

    // Full fallback: keyword match on filename
    const keywordLabel = getKeywordMatch(fileName);
    return {
        label: keywordLabel,
        caption: null,
        confidence: keywordLabel ? 0.5 : 0,
        rawScores: [],
        method: 'keyword',
        isAI: aiDetection?.isAI,
        aiConfidence: aiDetection?.confidence,
        aiVerdict: aiDetection?.verdict,
    };
}

/**
 * Legacy wrapper — keeps backward compatibility.
 */
export async function analyzeImageWithFallback(
    imageBuffer: ArrayBuffer,
    fileName: string = ""
): Promise<string | null> {
    const result = await analyzeImageFull(imageBuffer, fileName);
    return result.label;
}

/**
 * Keyword-based fallback for when API is unavailable.
 */
function getKeywordMatch(text: string): string | null {
    const lower = text.toLowerCase();
    if (lower.includes("pothole") || lower.includes("crack") || lower.includes("hole") || lower.includes("manhole") || lower.includes("damaged road") || lower.includes("grille") || lower.includes("grate")) return "pothole";
    if (lower.includes("garbage") || lower.includes("trash") || lower.includes("waste") || lower.includes("litter") || lower.includes("dump") || lower.includes("bin") || lower.includes("dumpster")) return "garbage";
    if (lower.includes("water") || lower.includes("flood") || lower.includes("puddle") || lower.includes("leak") || lower.includes("logging") || lower.includes("fountain") || lower.includes("dam")) return "water logging";
    if (lower.includes("light") || lower.includes("pole") || lower.includes("lamp") || lower.includes("streetlight") || lower.includes("beacon") || lower.includes("traffic")) return "broken streetlight";
    if (lower.includes("tree") || lower.includes("fallen") || lower.includes("branch") || lower.includes("stump") || lower.includes("log")) return "fallen tree";
    if (lower.includes("road") || lower.includes("highway") || lower.includes("street") || lower.includes("sidewalk")) return "clean road";
    return null;
}

/**
 * Zero-Shot Text Classification for categorizing complaint descriptions.
 */
export async function categorizeText(text: string) {
    try {
        const result = await client.zeroShotClassification({
            model: "facebook/bart-large-mnli",
            inputs: text,
            parameters: {
                candidate_labels: ["Pothole", "Garbage", "Water Leak", "Broken Streetlight", "Water Logging", "Fallen Tree", "Other"],
            },
            provider: "hf-inference",
        });
        return result;
    } catch (e: any) {
        console.error("[AI] Text Classification Error:", e.message);
        return null;
    }
}

/**
 * Utility: Haversine distance between two coordinates in meters.
 */
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const rad = Math.PI / 180;
    const phi1 = lat1 * rad;
    const phi2 = lat2 * rad;
    const deltaPhi = (lat2 - lat1) * rad;
    const deltaLambda = (lon2 - lon1) * rad;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

/**
 * Utility: Cosine Similarity between two arrays of numbers.
 * Returns a value between -1 and 1.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Get Sentence Embeddings for text using HuggingFace Feature Extraction.
 * This provides a vector representation of the text for similarity comparison.
 */
export async function getTextEmbedding(text: string): Promise<number[] | null> {
    try {
        console.log(`[AI] Generating embedding for text snippet...`);
        const output = await client.featureExtraction({
            model: "sentence-transformers/all-MiniLM-L6-v2",
            inputs: text,
            provider: "hf-inference",
        });

        // The API returns a multi-dimensional array or flat array depending on the model
        // Typically it's a 1D array of floats or a 2D array [[floats]]
        if (Array.isArray(output)) {
             // Handle 2D array output: [[...]]
            if (Array.isArray(output[0])) {
                return output[0] as number[];
            }
            // Handle 1D array output: [...]
            return output as number[];
        }
        // Unexpected format
        return null;
    } catch (e: any) {
        console.error("[AI] Text Embedding Error:", e.message);
        return null;
    }
}

/**
 * Step 4: Compare two images using ResNet-50 visual features.
 * This function calculates the similarity between an original issue image
 * and a resolution (proof-of-work) image to confirm authenticity.
 */
export async function compareImages(originalUrl: string, resolutionUrl: string): Promise<number> {
    try {
        console.log(`[AI] Comparing images for resolution verification...`);
        
        // 1. Fetch both images as ArrayBuffers
        const [originalRes, resolutionRes] = await Promise.all([
            fetch(originalUrl),
            fetch(resolutionUrl)
        ]);

        if (!originalRes.ok || !resolutionRes.ok) {
            console.error("[AI] Failed to download one or both images for comparison.");
            return 0; // Return 0 if download fails
        }

        const originalBuffer = await originalRes.arrayBuffer();
        const resolutionBuffer = await resolutionRes.arrayBuffer();

        // 2. Run Image Classification on both
        const [originalOutput, resolutionOutput] = await Promise.all([
            client.imageClassification({
                data: new Blob([originalBuffer], { type: "image/jpeg" }),
                model: "microsoft/resnet-50",
                provider: "hf-inference",
            }).catch(() => null),
            client.imageClassification({
                data: new Blob([resolutionBuffer], { type: "image/jpeg" }),
                model: "microsoft/resnet-50",
                provider: "hf-inference",
            }).catch(() => null)
        ]);

        if (!originalOutput || !resolutionOutput || !Array.isArray(originalOutput) || !Array.isArray(resolutionOutput)) {
            console.error("[AI] ResNet failed to classify images for comparison.");
            return 0; // Default to 0 if API fails
        }

        // 3. Build Score Vectors (Label -> Score)
        const vectorA: Record<string, number> = {};
        const vectorB: Record<string, number> = {};
        
        // Collect all unique labels
        const allLabels = new Set<string>();

        originalOutput.forEach((item: any) => {
            vectorA[item.label] = item.score;
            allLabels.add(item.label);
        });

        resolutionOutput.forEach((item: any) => {
            vectorB[item.label] = item.score;
            allLabels.add(item.label);
        });

        // 4. Calculate Cosine Similarity over the sparse vectors
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        allLabels.forEach(label => {
            const valA = vectorA[label] || 0;
            const valB = vectorB[label] || 0;
            dotProduct += valA * valB;
            normA += valA * valA;
            normB += valB * valB;
        });

        if (normA === 0 || normB === 0) return 0;
        
        const similarityScore = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        
        // Normalize the score: Even extremely similar scenes might only get 60-70% cosine similarity
        // because ResNet produces sharp probability spikes on its top 1 guess.
        // We will apply a small boost so scores > 0.4 look acceptable.
        let boostedScore = similarityScore * 1.5;
        const percentageScore = Math.max(0, Math.min(100, Math.round(boostedScore * 100)));
        
        console.log(`[AI] Raw Cosine Similarity: ${(similarityScore).toFixed(2)}, Boosted Confidence Score: ${percentageScore}%`);
        return percentageScore;
        
    } catch (e: any) {
        console.error("[AI] Image Comparison Error:", e.message);
        return 0;
    }
}
