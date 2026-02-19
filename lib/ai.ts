import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN);

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
 * Full AI analysis pipeline:
 *   Step 1: ResNet-50 → raw image labels
 *   Step 2: BART zero-shot → civic category classification
 */
export async function analyzeImageFull(imageBuffer: ArrayBuffer, fileName: string = ""): Promise<AIAnalysisResult> {
    // Step 1: Get ResNet labels
    const resnetLabels = await getImageLabels(imageBuffer);

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
