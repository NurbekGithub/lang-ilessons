const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || "https://libretranslate.com";
const LIBRETRANSLATE_API_KEY = process.env.LIBRETRANSLATE_API_KEY;
const GCP_TRANSLATE_API_KEY = process.env.GCP_TRANSLATE_API_KEY;

export interface TranslateOptions {
    text: string;
    sourceLanguage?: string; // "auto" for auto-detect
    targetLanguage: string;
}

export interface TranslateResult {
    translatedText: string;
    detectedLanguage?: string;
    alternatives?: string[];
    source: "google" | "libretranslate";
}

/**
 * Translate text using Google Translate API
 */
async function translateWithGoogle(options: TranslateOptions): Promise<TranslateResult> {
    if (!GCP_TRANSLATE_API_KEY) {
        throw new Error("GCP_TRANSLATE_API_KEY is not configured");
    }

    const { text, sourceLanguage = "auto", targetLanguage } = options;
    const url = `https://translation.googleapis.com/language/translate/v2?key=${GCP_TRANSLATE_API_KEY}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            q: text,
            source: sourceLanguage === "auto" ? undefined : sourceLanguage,
            target: targetLanguage,
            format: "text",
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Translation failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const translation = data.data.translations[0];

    return {
        translatedText: translation.translatedText,
        detectedLanguage: translation.detectedSourceLanguage,
        source: "google",
    };
}

/**
 * Translate text using LibreTranslate API
 */
async function translateWithLibre(options: TranslateOptions): Promise<TranslateResult> {
    const { text, sourceLanguage = "auto", targetLanguage } = options;

    const response = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            q: text,
            source: sourceLanguage,
            alternatives: 3,
            target: targetLanguage,
            format: "text",
            api_key: LIBRETRANSLATE_API_KEY,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LibreTranslate failed: ${errorText}`);
    }

    const data = await response.json();

    return {
        translatedText: data.translatedText,
        detectedLanguage: data.detectedLanguage?.language,
        alternatives: data.alternatives,
        source: "libretranslate",
    };
}

/**
 * Translate text with fallback logic (Google -> LibreTranslate)
 */
export async function translateText(options: TranslateOptions): Promise<TranslateResult> {
    try {
        // Try Google first
        return await translateWithGoogle(options);
    } catch (error) {
        console.warn("Google Translate failed, falling back to LibreTranslate:", error);
        // Fallback to LibreTranslate
        return await translateWithLibre(options);
    }
}

/**
 * Detect the language of the given text
 */
export async function detectLanguage(text: string): Promise<string> {
    try {
        if (GCP_TRANSLATE_API_KEY) {
            const url = `https://translation.googleapis.com/language/translate/v2/detect?key=${GCP_TRANSLATE_API_KEY}`;
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ q: text }),
            });

            if (response.ok) {
                const data = await response.json();
                return data.data.detections[0][0].language;
            }
        }
    } catch (error) {
        console.warn("Google detection failed:", error);
    }

    // Fallback to LibreTranslate detection
    try {
        const response = await fetch(`${LIBRETRANSLATE_URL}/detect`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                q: text,
                api_key: LIBRETRANSLATE_API_KEY,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            return data[0]?.language || "en";
        }
    } catch (error) {
        console.warn("LibreTranslate detection failed:", error);
    }

    return "en";
}
