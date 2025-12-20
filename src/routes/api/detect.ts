import { createFileRoute } from "@tanstack/react-router";
import { detectLanguage } from "@/lib/translate";

export const Route = createFileRoute("/api/detect")({
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    const body = await request.json();
                    const { text } = body;

                    if (!text || typeof text !== "string") {
                        return new Response(
                            JSON.stringify({ error: "Text is required" }),
                            { status: 400, headers: { "Content-Type": "application/json" } }
                        );
                    }

                    // Only use first 500 chars for detection
                    const sampleText = text.slice(0, 500);
                    const language = await detectLanguage(sampleText);

                    return new Response(
                        JSON.stringify({ language }),
                        { status: 200, headers: { "Content-Type": "application/json" } }
                    );
                } catch (error) {
                    console.error("Language detection error:", error);
                    return new Response(
                        JSON.stringify({ error: "Detection failed", language: "en" }),
                        { status: 200, headers: { "Content-Type": "application/json" } }
                    );
                }
            },
        },
    },
});
