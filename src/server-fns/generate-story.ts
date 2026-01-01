import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getGenAIClient } from './google-clients'
import { BEST_MODEL, getLanguageName } from './constants'

// Generate AI story
export const generateStoryFn = createServerFn()
  .inputValidator(
    z.object({
      description: z.string().optional(),
      language: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const languageName = getLanguageName(data.language)

    // Build prompt based on whether description is provided
    let prompt = ''
    if (data.description && data.description.trim()) {
      prompt = `Write a short story in ${languageName} based on this description: "${data.description.trim()}". 

Requirements:
- Keep the story concise (100-200 words)
- Make it engaging and well-written
- Use natural, authentic ${languageName}
- Include clear dialogue and narrative flow
- End with a satisfying conclusion
- If it is arabic, make sure all the words are with proper harakat.

Return ONLY the story, nothing else.`
    } else {
      prompt = `Write a famous or classic short story in ${languageName}.

Requirements:
- Choose a well-known or classic story from ${languageName} literature
- Keep it concise (100-200 words)
- Make it engaging and well-written
- Use natural, authentic ${languageName}
- Include clear dialogue and narrative flow
- End with a satisfying conclusion
- If it is arabic, make sure all the words are with proper harakat.

Return ONLY the story, nothing else.`
    }

    try {
      const result = await getGenAIClient().models.generateContent({
        model: BEST_MODEL,
        contents: prompt,
      })

      const story = result.text

      if (!story || story.trim().length === 0) {
        throw new Error('Generated story is empty')
      }

      return {
        story: story.trim(),
        language: data.language,
      }
    } catch (error) {
      console.error('Error generating story:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Failed to generate story'
      )
    }
  })
