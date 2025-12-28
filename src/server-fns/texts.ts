import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  deleteSavedText,
  getPublicStories,
  getSavedTextById,
  getSavedTexts,
  saveText,
  updateSavedText,
} from '@/lib/saved-texts'

// Get public stories
export const getPublicStoriesFn = createServerFn().handler(async () => {
  return getPublicStories()
})

// Get user's saved texts
export const getSavedTextsFn = createServerFn()
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    return getSavedTexts(data.userId)
  })

// Get single text by ID
export const getTextByIdFn = createServerFn()
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const text = await getSavedTextById(data.id)
    
    return text
  })

// Create new text
export const createTextFn = createServerFn()
  .inputValidator(
    z.object({
      userId: z.string(),
      content: z.string(),
      title: z.string().optional(),
      sourceLanguage: z.string().optional(),
      isPublic: z.boolean().optional(),
    })
  )
  .handler(async ({ data }) => {
    return saveText(data)
  })

// Update text
export const updateTextFn = createServerFn()
  .inputValidator(
    z.object({
      id: z.string(),
      content: z.string().optional(),
      title: z.string().optional(),
      sourceLanguage: z.string().optional(),
      isPublic: z.boolean().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { id, ...updateData } = data
    const text = await updateSavedText(id, updateData)
    if (!text) {
      throw new Error('Text not found')
    }
    return text
  })

// Delete text
export const deleteTextFn = createServerFn()
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await deleteSavedText(data.id)
  })
