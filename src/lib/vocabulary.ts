import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { vocabulary } from "@/db/schema";

export interface VocabularyItem {
    id: string;
    userId: string;
    originalText: string;
    translatedText: string;
    sourceLanguage: string | null;
    targetLanguage: string;
    context: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface AddVocabularyInput {
    userId: string;
    originalText: string;
    translatedText: string;
    sourceLanguage?: string;
    targetLanguage: string;
    context?: string;
}

// Add a word/phrase to vocabulary
export async function addToVocabulary(input: AddVocabularyInput): Promise<VocabularyItem> {
    const result = await db
        .insert(vocabulary)
        .values({
            userId: input.userId,
            originalText: input.originalText,
            translatedText: input.translatedText,
            sourceLanguage: input.sourceLanguage,
            targetLanguage: input.targetLanguage,
            context: input.context,
        })
        .returning();

    return result[0] as VocabularyItem;
}

// Get user's vocabulary list
export async function getVocabularyList(userId: string): Promise<Array<VocabularyItem>> {
    const items = await db
        .select()
        .from(vocabulary)
        .where(eq(vocabulary.userId, userId))
        .orderBy(desc(vocabulary.createdAt));

    return items as Array<VocabularyItem>;
}

// Delete a vocabulary item
export async function deleteVocabularyItemById(id: string): Promise<void> {
    await db.delete(vocabulary).where(eq(vocabulary.id, id));
}
