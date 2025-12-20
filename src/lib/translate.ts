const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || "https://libretranslate.com";

export interface TranslateOptions {
    text: string;
    sourceLanguage?: string; // "auto" for auto-detect
    targetLanguage: string;
}

export interface TranslateResult {
    translatedText: string;
    detectedLanguage?: string;
}

/**
 * Translate text using LibreTranslate API
 */
export async function translateText(options: TranslateOptions): Promise<TranslateResult> {
    const { text, sourceLanguage = "auto", targetLanguage } = options;

    const response = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            q: text,
            source: sourceLanguage,
            target: targetLanguage,
            format: "text",
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Translation failed: ${errorText}`);
    }

    const data = await response.json();

    return {
        translatedText: data.translatedText,
        detectedLanguage: data.detectedLanguage?.language,
    };
}

/**
 * Detect the language of the given text
 */
export async function detectLanguage(text: string): Promise<string> {
    const response = await fetch(`${LIBRETRANSLATE_URL}/detect`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: text }),
    });

    if (!response.ok) {
        throw new Error("Language detection failed");
    }

    const data = await response.json();
    return data[0]?.language || "en";
}
