import { useState, useCallback } from "react";

interface TranslationResult {
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
}

interface UseTranslationOptions {
    targetLanguage?: string;
}

export function useTranslation(options: UseTranslationOptions = {}) {
    const { targetLanguage = "en" } = options;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<TranslationResult | null>(null);

    const translate = useCallback(async (text: string, sourceLang?: string) => {
        if (!text.trim()) {
            setError("No text to translate");
            return null;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    sourceLanguage: sourceLang || "auto",
                    targetLanguage,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Translation failed");
            }

            const data: TranslationResult = await response.json();
            setResult(data);
            return data;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Translation failed";
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [targetLanguage]);

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
