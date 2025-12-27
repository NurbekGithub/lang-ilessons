import { useCallback, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { translateTextFn } from "@/server-fns/translate";

interface TranslationResult {
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
    source: "google" | "libretranslate";
    alternatives?: Array<string>;
}

interface UseTranslationOptions {
    targetLanguage?: string;
}

export function useTranslation(options: UseTranslationOptions = {}) {
    const { targetLanguage = "en" } = options;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<TranslationResult | null>(null);
    const translateText = useServerFn(translateTextFn);

    const translate = useCallback(async (text: string, sourceLang?: string) => {
        if (!text.trim()) {
            setError("No text to translate");
            return null;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await translateText({
                data: {
                    text,
                    sourceLanguage: sourceLang || "auto",
                    targetLanguage,
                },
            });
            setResult(data);
            return data;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Translation failed";
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [targetLanguage, translateText]);

    const clearResult = useCallback(() => {
        setResult(null);
        setError(null);
    }, []);

    return {
        translate,
        isLoading,
        error,
        result,
        clearResult,
    };
}
