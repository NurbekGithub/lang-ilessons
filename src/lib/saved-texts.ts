import { db } from "@/db";
import { savedText } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export interface SavedText {
    id: string;
    userId: string;
    content: string;
    sourceLanguage: string | null;
    title: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface SaveTextInput {
    userId: string;
    content: string;
    title?: string;
    sourceLanguage?: string;
}

// Save a new text
export async function saveText(input: SaveTextInput): Promise<SavedText> {
    // Generate a title from first 50 chars if not provided
    const autoTitle = input.title || input.content.slice(0, 50) + (input.content.length > 50 ? "..." : "");

    const result = await db
        .insert(savedText)
        .values({
            userId: input.userId,
            content: input.content,
            title: autoTitle,
            sourceLanguage: input.sourceLanguage,
        })
        .returning();

    return result[0] as SavedText;
}

// Get user's saved texts
export async function getSavedTexts(userId: string): Promise<SavedText[]> {
    const items = await db
        .select()
        .from(savedText)
        .where(eq(savedText.userId, userId))
        .orderBy(desc(savedText.createdAt));

    return items as SavedText[];
}

// Get a single saved text by ID
export async function getSavedTextById(id: string): Promise<SavedText | null> {
    const items = await db
        .select()
        .from(savedText)
        .where(eq(savedText.id, id))
        .limit(1);

    return (items[0] as SavedText) || null;
}

// Delete a saved text
export async function deleteSavedText(id: string): Promise<void> {
    await db.delete(savedText).where(eq(savedText.id, id));
}
