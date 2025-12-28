import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { detectLanguage } from '@/lib/translate'

export const detectLanguageFn = createServerFn()
  .inputValidator(z.object({ text: z.string() }))
  .handler(async ({ data }) => {
    const sampleText = data.text.slice(0, 500)
    return detectLanguage(sampleText)
  })
