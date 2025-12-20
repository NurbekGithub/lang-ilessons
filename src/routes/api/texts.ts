import { createFileRoute } from "@tanstack/react-router";
import { saveText, getSavedTexts, getSavedTextById, deleteSavedText, updateSavedText } from "@/lib/saved-texts";

export const Route = createFileRoute("/api/texts")({
    server: {
        handlers: {
            GET: async ({ request }) => {
                try {
                    const url = new URL(request.url);
                    const userId = url.searchParams.get("userId");
                    const id = url.searchParams.get("id");

                    // Get single text by ID
                    if (id) {
                        const text = await getSavedTextById(id);
                        if (!text) {
                            return new Response(
                                JSON.stringify({ error: "Text not found" }),
                                { status: 404, headers: { "Content-Type": "application/json" } }
                            );
                        }
                        return new Response(
                            JSON.stringify({ text }),
                            { status: 200, headers: { "Content-Type": "application/json" } }
                        );
                    }

                    // Get all texts for user
                    if (!userId) {
                        return new Response(
                            JSON.stringify({ error: "userId is required" }),
                            { status: 400, headers: { "Content-Type": "application/json" } }
                        );
                    }

                    const texts = await getSavedTexts(userId);
                    return new Response(
                        JSON.stringify({ texts }),
                        { status: 200, headers: { "Content-Type": "application/json" } }
                    );
                } catch (error) {
                    console.error("Failed to get texts:", error);
                    return new Response(
                        JSON.stringify({ error: "Failed to get texts" }),
                        { status: 500, headers: { "Content-Type": "application/json" } }
                    );
                }
            },

            POST: async ({ request }) => {
                try {
                    const body = await request.json();
                    const { userId, content, title, sourceLanguage } = body;

                    if (!userId || !content) {
                        return new Response(
                            JSON.stringify({ error: "userId and content are required" }),
                            { status: 400, headers: { "Content-Type": "application/json" } }
                        );
                    }

                    const text = await saveText({
                        userId,
                        content,
                        title,
                        sourceLanguage,
                    });

                    return new Response(
                        JSON.stringify({ success: true, text }),
                        { status: 201, headers: { "Content-Type": "application/json" } }
                    );
                } catch (error) {
                    console.error("Failed to save text:", error);
                    return new Response(
                        JSON.stringify({ error: "Failed to save text" }),
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

                    await deleteSavedText(id);
                    return new Response(
                        JSON.stringify({ success: true }),
                        { status: 200, headers: { "Content-Type": "application/json" } }
                    );
                } catch (error) {
                    console.error("Failed to delete text:", error);
                    return new Response(
                        JSON.stringify({ error: "Failed to delete text" }),
                        { status: 500, headers: { "Content-Type": "application/json" } }
                    );
                }
            },

            PATCH: async ({ request }) => {
                try {
                    const url = new URL(request.url);
                    const id = url.searchParams.get("id");
                    const body = await request.json();

                    if (!id) {
                        return new Response(
                            JSON.stringify({ error: "id is required" }),
                            { status: 400, headers: { "Content-Type": "application/json" } }
                        );
                    }

                    const text = await updateSavedText(id, body);
                    if (!text) {
                        return new Response(
                            JSON.stringify({ error: "Text not found" }),
                            { status: 404, headers: { "Content-Type": "application/json" } }
                        );
                    }

                    return new Response(
                        JSON.stringify({ success: true, text }),
                        { status: 200, headers: { "Content-Type": "application/json" } }
                    );
                } catch (error) {
                    console.error("Failed to update text:", error);
                    return new Response(
                        JSON.stringify({ error: "Failed to update text" }),
                        { status: 500, headers: { "Content-Type": "application/json" } }
                    );
                }
            },
        },
    },
});
