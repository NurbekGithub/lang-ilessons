import path from 'node:path'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { GoogleGenAI } from '@google/genai'

const BEST_MODEL = "gemini-2.5-flash";
// const CHEAP_MODEL = "gemini-2.5-flash-lite";

// Initialize Gemini AI client with Vertex AI using service account
const genAI = new GoogleGenAI({
  vertexai: true,
  project: 'lang-481909',
  location: 'us-central1',
  googleAuthOptions: {
    keyFilename: path.join(process.cwd(), 'secrets/lang-481909-7416a55f8e8d.json'),
  },
})

// Generate AI story
export const generateStoryFn = createServerFn()
  .inputValidator(
    z.object({
      description: z.string().optional(),
      language: z.string(),
    })
  )
  .handler(async ({ data }) => {

    // Language mapping for prompts
    const languageMap: Record<string, string> = {
      ar: 'Arabic',
      zh: 'Chinese',
      en: 'English',
      ru: 'Russian',
    }

    const languageName = languageMap[data.language] || 'English'

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
      const result = await genAI.models.generateContent({
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
