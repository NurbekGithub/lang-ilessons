import path from 'node:path'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { ImageAnnotatorClient } from '@google-cloud/vision'

// Initialize Vision API client with service account key
const client = new ImageAnnotatorClient({
  keyFilename: path.join(process.cwd(), 'secrets/lang-481909-7416a55f8e8d.json'),
})

// Input validation schema
const ocrInputSchema = z.object({
  imageData: z.string(), // Base64 encoded image
  languageHint: z.string().optional(), // 'auto', 'en', 'ar', 'zh', 'ru'
})

// Output interface
interface OcrResult {
  text: string
  detectedLanguage: string
  confidence: number
  languageBreakdown: Array<{ language: string; count: number }>
}

/**
 * Extract text from image using Google Cloud Vision API
 * Supports auto-detection or manual language specification
 */
export const extractTextFromImageFn = createServerFn()
  .inputValidator(ocrInputSchema)
  .handler(async ({ data }) => {
    // Decode base64 image
    const buffer = Buffer.from(data.imageData, 'base64')
    
    // Build request
    const request: any = {
      image: { content: buffer },
      features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
    }
    
    // Add language hint if specified and not 'auto'
    if (data.languageHint && data.languageHint !== 'auto') {
      request.imageContext = {
        languageHints: [data.languageHint],
      }
    }
    
    try {
      // Call Vision API
      const [result] = await client.documentTextDetection(request)
      
      if (!result.fullTextAnnotation?.text) {
        throw new Error('No text detected in image')
      }
      
      // Extract text
      const text = result.fullTextAnnotation.text
      
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
        text,
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
