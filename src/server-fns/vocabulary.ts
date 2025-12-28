import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { addToVocabulary, deleteVocabularyItemById, getVocabularyList } from '@/lib/vocabulary'

// Get user's vocabulary
export const getVocabularyFn = createServerFn()
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    return getVocabularyList(data.userId)
  })

// Add vocabulary item
export const addVocabularyItemFn = createServerFn()
  .inputValidator(
    z.object({
      userId: z.string(),
      originalText: z.string(),
      translatedText: z.string(),
      sourceLanguage: z.string().optional(),
      targetLanguage: z.string(),
      context: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    return addToVocabulary(data)
  })

// Delete vocabulary item
export const deleteVocabularyItemFn = createServerFn()
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await deleteVocabularyItemById(data.id)
  })
