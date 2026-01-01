import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { translateText } from '@/lib/translate'

export const translateTextFn = createServerFn()
  .inputValidator(
    z.object({
      text: z.string(),
      sourceLanguage: z.string().optional(),
      targetLanguage: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const result = await translateText({
      text: data.text,
      sourceLanguage: data.sourceLanguage || 'auto',
      targetLanguage: data.targetLanguage,
    })
    return {
      translatedText: result.translatedText,
      sourceLanguage: result.detectedLanguage || data.sourceLanguage || 'auto',
      targetLanguage: data.targetLanguage,
      source: result.source,
      alternatives: result.alternatives,
      fromCache: result.fromCache,
    }
  })
