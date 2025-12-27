import { createFileRoute } from "@tanstack/react-router";
import { addToVocabulary, deleteVocabularyItemById, getVocabularyList } from "@/lib/vocabulary";

export const Route = createFileRoute("/api/vocabulary")({
    server: {
        handlers: {
            GET: async ({ request }) => {
                try {
                    const url = new URL(request.url);
                    const userId = url.searchParams.get("userId");

                    if (!userId) {
                        return new Response(
                            JSON.stringify({ error: "userId is required" }),
                            { status: 400, headers: { "Content-Type": "application/json" } }
                        );
                    }

                    const items = await getVocabularyList(userId);
                    return new Response(
                        JSON.stringify({ items }),
                        { status: 200, headers: { "Content-Type": "application/json" } }
                    );
                } catch (error) {
                    console.error("Failed to get vocabulary:", error);
                    return new Response(
                        JSON.stringify({ error: "Failed to get vocabulary" }),
                        { status: 500, headers: { "Content-Type": "application/json" } }
                    );
                }
            },

            POST: async ({ request }) => {
                try {
                    const body = await request.json();
                    const { userId, originalText, translatedText, sourceLanguage, targetLanguage, context } = body;

                    if (!userId || !originalText || !translatedText || !targetLanguage) {
                        return new Response(
                            JSON.stringify({ error: "Missing required fields" }),
                            { status: 400, headers: { "Content-Type": "application/json" } }
                        );
                    }

                    const item = await addToVocabulary({
                        userId,
                        originalText,
                        translatedText,
                        sourceLanguage,
                        targetLanguage,
                        context,
                    });

                    return new Response(
                        JSON.stringify({ success: true, item }),
                        { status: 201, headers: { "Content-Type": "application/json" } }
                    );
                } catch (error) {
                    console.error("Failed to add to vocabulary:", error);
                    return new Response(
                        JSON.stringify({ error: "Failed to add to vocabulary" }),
                        { status: 500, headers: { "Content-Type": "application/json" } }
                    );
                }
            },

            DELETE: async ({ request }) => {
                try {
                    const url = new URL(request.url);
                    const id = url.searchParams.get("id");

                    if (!id) {
                        return new Response(
                            JSON.stringify({ error: "id is required" }),
                            { status: 400, headers: { "Content-Type": "application/json" } }
                        );
                    }

                    await deleteVocabularyItemById(id);
                    return new Response(
                        JSON.stringify({ success: true }),
                        { status: 200, headers: { "Content-Type": "application/json" } }
                    );
                } catch (error) {
                    console.error("Failed to delete vocabulary item:", error);
                    return new Response(
                        JSON.stringify({ error: "Failed to delete vocabulary item" }),
                        { status: 500, headers: { "Content-Type": "application/json" } }
                    );
                }
            },
        },
    },
});
