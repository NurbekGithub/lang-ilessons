import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getGenAIClient, getVisionClient } from './google-clients'
import { BEST_MODEL, getLanguageName } from './constants'
import { arabicInstructions, formatInstructions } from './instructions'

// Input validation schema
const ocrInputSchema = z.object({
  imageData: z.string(), // Base64 encoded image
  languageHint: z.string().optional(), // 'auto', 'en', 'ar', 'zh', 'ru'
})

/**
 * Filter text by language using Gemini AI
 * For Arabic, ensures harakat (diacritical marks) are preserved
 */
async function filterTextByLanguage(
  text: string,
  targetLanguage: string
): Promise<string> {
  // Build prompt based on language
  let prompt = ''
  
  if (targetLanguage === 'auto') {
    // Auto mode: Extract text from the most dominant language
    prompt = `Analyze the following content and extract only the text from the most commonly used language.
Ignore text in any other languages.
${formatInstructions}
If it is arabic and: ${arabicInstructions}

Content:
${text}

Return ONLY the extracted text from the dominant language, nothing else.`
  } else if (targetLanguage === 'ar') {
    // Arabic: Extract only Arabic text and preserve harakat
    prompt = `Extract only Arabic text from the following content.
IMPORTANT: Preserve ALL harakat (diacritical marks) including fatha, kasra, damma, tanween, shadda, sukun, and other vowel signs.
Do NOT remove any harakat.
${formatInstructions}
${arabicInstructions}

Content:
${text}

Return ONLY the extracted Arabic text, nothing else.`
  } else {
    // Other languages: Extract only text in target language
    const languageName = getLanguageName(targetLanguage)
    
    prompt = `Extract only ${languageName} text from the following content.
Ignore text in any other languages.
${formatInstructions}

Content:
${text}

Return ONLY the extracted ${languageName} text, nothing else.`
  }

  try {
    const result = await getGenAIClient().models.generateContent({
      model: BEST_MODEL,
      contents: prompt,
    })
    return result.text || text
  } catch (error) {
    console.error('Gemini filtering error:', error)
    // If filtering fails, return original text
    return text
  }
}

/**
 * Extract text from image using Google Cloud Vision API
 * Supports auto-detection or manual language specification
 * Uses Gemini API to filter text by selected language
 */
export const extractTextFromImageFn = createServerFn({method: "POST"})
  .inputValidator(ocrInputSchema)
  .handler(async ({ data }) => {
    // Decode base64 image
    const buffer = Buffer.from(data.imageData, 'base64')
    
    // Build request for annotateImage
    const request: any = {
      image: { content: buffer },
      features: [{ type: 'DOCUMENT_TEXT_DETECTION' as const }],
    }
    
    // Add language hint if specified and not 'auto'
    if (data.languageHint && data.languageHint !== 'auto') {
      request.imageContext = {
        languageHints: [data.languageHint],
      }
    }
    
    try {
      // Call Vision API using annotateImage method
      const [result] = await getVisionClient().annotateImage(request)
      
      if (!result.fullTextAnnotation?.text) {
        throw new Error('No text detected in image')
      }
      
      // Extract text
      const rawText = result.fullTextAnnotation.text
      
      // Filter text by selected language using Gemini
      const filteredText = await filterTextByLanguage(rawText, data.languageHint || 'auto')
      
      // Detect languages from text blocks
      const languageMap = new Map<string, number>()
      let totalBlocks = 0
      
      for (const page of result.fullTextAnnotation.pages || []) {
        for (const block of page.blocks || []) {
          for (const lang of block.property?.detectedLanguages || []) {
            const langCode = lang.languageCode || 'en'
            const count = languageMap.get(langCode) || 0
            languageMap.set(langCode, count + 1)
            totalBlocks++
          }
          
          // If no detected languages, assume English
          if (!block.property?.detectedLanguages || block.property.detectedLanguages.length === 0) {
            const count = languageMap.get('en') || 0
            languageMap.set('en', count + 1)
            totalBlocks++
          }
        }
      }
      
      // Determine most common language
      let detectedLanguage = 'en'
      let maxCount = 0
      
      for (const [lang, count] of languageMap.entries()) {
        if (count > maxCount) {
          maxCount = count
          detectedLanguage = lang
        }
      }
      
      // If language hint was provided, use it
      if (data.languageHint && data.languageHint !== 'auto') {
        detectedLanguage = data.languageHint
      }
      
      // Build language breakdown
      const languageBreakdown = Array.from(languageMap.entries())
        .map(([language, count]) => ({ language, count }))
        .sort((a, b) => b.count - a.count)
      
      // Calculate confidence (average of all blocks)
      const confidence = result.fullTextAnnotation.pages?.[0]?.confidence || 0
      
      return {
        text: filteredText,
        detectedLanguage,
        confidence,
        languageBreakdown,
      }
    } catch (error) {
      console.error('OCR Error:', error)
      
      // Re-throw with user-friendly message
      if (error instanceof Error) {
        throw new Error(`Failed to extract text: ${error.message}`)
      }
      throw new Error('Failed to extract text from image')
    }
  })
