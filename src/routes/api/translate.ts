import { createFileRoute } from "@tanstack/react-router";
import { translateText } from "@/lib/translate";

export const Route = createFileRoute("/api/translate")({
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    const body = await request.json();
                    const { text, sourceLanguage, targetLanguage } = body;

                    if (!text || typeof text !== "string") {
                        return new Response(
                            JSON.stringify({ error: "Text is required" }),
                            { status: 400, headers: { "Content-Type": "application/json" } }
                        );
                    }

                    if (!targetLanguage || typeof targetLanguage !== "string") {
                        return new Response(
                            JSON.stringify({ error: "Target language is required" }),
                            { status: 400, headers: { "Content-Type": "application/json" } }
                        );
                    }

                    const result = await translateText({
                        text,
                        sourceLanguage: sourceLanguage || "auto",
                        targetLanguage,
                    });

                    return new Response(
                        JSON.stringify({
                            translatedText: result.translatedText,
                            sourceLanguage: result.detectedLanguage || sourceLanguage || "auto",
                            targetLanguage,
                        }),
                        { status: 200, headers: { "Content-Type": "application/json" } }
                    );
                } catch (error) {
                    console.error("Translation error:", error);
                    return new Response(
                        JSON.stringify({
                            error: error instanceof Error ? error.message : "Translation failed",
                        }),
                        { status: 500, headers: { "Content-Type": "application/json" } }
                    );
                }
            },
        },
    },
});
