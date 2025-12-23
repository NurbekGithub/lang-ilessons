import { db } from "@/db";
import { savedText } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export type StoryStatus = "draft" | "denied" | "published";

export interface SavedText {
    id: string;
    userId: string;
    content: string;
    sourceLanguage: string | null;
    title: string | null;
    isPublic: boolean;
    status: StoryStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface SaveTextInput {
    userId: string;
    content: string;
    title?: string;
    sourceLanguage?: string;
    isPublic?: boolean;
    status?: StoryStatus;
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
            isPublic: input.isPublic ?? false,
            status: input.status || (input.isPublic ? "published" : "draft"),
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

// Get public published stories
export async function getPublicStories(): Promise<SavedText[]> {
    const items = await db
        .select()
        .from(savedText)
        .where(eq(savedText.isPublic, true))
        .orderBy(desc(savedText.createdAt));

    // Filter by 'published' status in code for now or add 'and' condition
    // For now I'll use the where clause properly if I can import 'and'
    return (items as SavedText[]).filter(item => item.status === "published");
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

// Update a saved text
export async function updateSavedText(id: string, input: Partial<SaveTextInput>): Promise<SavedText | null> {
    const updateData: any = { ...input, status: input.isPublic ? "published" : "draft" };
    if (input.content && !input.title) {
        updateData.title = input.content.slice(0, 50) + (input.content.length > 50 ? "..." : "");
    }
    updateData.updatedAt = new Date();

    const result = await db
        .update(savedText)
        .set(updateData)
        .where(eq(savedText.id, id))
        .returning();

    return (result[0] as SavedText) || null;
}

// Delete a saved text
export async function deleteSavedText(id: string): Promise<void> {
    await db.delete(savedText).where(eq(savedText.id, id));
}
