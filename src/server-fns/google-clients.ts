import { GoogleGenAI } from '@google/genai'
import { ImageAnnotatorClient } from '@google-cloud/vision'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import {
  GOOGLE_LOCATION,
  GOOGLE_PROJECT_ID,
  SERVICE_ACCOUNT_KEY_PATH,
} from './constants'

/**
 * Singleton instances for Google Cloud clients
 * Using singleton pattern to avoid re-initializing clients on every request
 */

let genAIClient: GoogleGenAI | null = null
let visionClient: ImageAnnotatorClient | null = null
let ttsClient: TextToSpeechClient | null = null

/**
 * Get or create Google GenAI client instance
 */
export function getGenAIClient(): GoogleGenAI {
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      vertexai: true,
      project: GOOGLE_PROJECT_ID,
      location: GOOGLE_LOCATION,
      googleAuthOptions: {
        keyFilename: SERVICE_ACCOUNT_KEY_PATH,
      },
    })
  }
  return genAIClient
}

/**
 * Get or create Google Cloud Vision client instance
 */
export function getVisionClient(): ImageAnnotatorClient {
  if (!visionClient) {
    visionClient = new ImageAnnotatorClient({
      keyFilename: SERVICE_ACCOUNT_KEY_PATH,
    })
  }
  return visionClient
}

/**
 * Get or create Google Cloud Text-to-Speech client instance
 */
export function getTTSClient(): TextToSpeechClient {
  if (!ttsClient) {
    ttsClient = new TextToSpeechClient({
      keyFilename: SERVICE_ACCOUNT_KEY_PATH,
    })
  }
  return ttsClient
}
