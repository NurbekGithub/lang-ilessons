import { createFileRoute } from "@tanstack/react-router";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import path from "path";

// Initialize the Google Cloud TTS client with the service account key
const client = new TextToSpeechClient({
    keyFilename: path.join(process.cwd(), "secrets/lang-481909-7416a55f8e8d.json"),
});

export const Route = createFileRoute("/api/tts")({
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    const body = await request.json();
                    const { text, languageCode = "en-US", speakingRate = 1.0 } = body;

                    if (!text || typeof text !== "string") {
                        return new Response(
                            JSON.stringify({ error: "Text is required" }),
                            { status: 400, headers: { "Content-Type": "application/json" } }
                        );
                    }

                    // Construct the request
                    const ttsRequest = {
                        input: { text },
                        // Select the language and SSML voice gender (optional)
                        voice: { languageCode, ssmlGender: "NEUTRAL" as const },
                        // select the type of audio encoding
                        audioConfig: {
                            audioEncoding: "MP3" as const,
                            speakingRate: Math.max(0.25, Math.min(4.0, speakingRate)),
                        },
                    };

                    // Performs the text-to-speech request
                    const [response] = await client.synthesizeSpeech(ttsRequest);

                    if (!response.audioContent) {
                        throw new Error("No audio content returned from Google TTS");
                    }

                    // Return the audio content as a base64 string
                    // We can also return it as a binary stream if preferred
                    const base64Audio = Buffer.from(response.audioContent as Uint8Array).toString("base64");

                    return new Response(
                        JSON.stringify({
                            audioContent: base64Audio,
                        }),
                        { status: 200, headers: { "Content-Type": "application/json" } }
                    );
                } catch (error) {
                    console.error("TTS error:", error);
                    return new Response(
                        JSON.stringify({
                            error: error instanceof Error ? error.message : "Speech synthesis failed",
                        }),
                        { status: 500, headers: { "Content-Type": "application/json" } }
                    );
                }
            },
        },
    },
});
