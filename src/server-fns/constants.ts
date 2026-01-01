import * as path from 'node:path'

/**
 * Google Cloud Project Configuration
 */
export const GOOGLE_PROJECT_ID = 'lang-481909'
export const GOOGLE_LOCATION = 'us-central1'
export const SERVICE_ACCOUNT_KEY_PATH = path.join(
  process.cwd(),
  'secrets/lang-481909-7416a55f8e8d.json'
)

/**
 * AI Model Constants
 */
export const BEST_MODEL = 'gemini-2.5-flash'
export const CHEAP_MODEL = 'gemini-2.5-flash-lite'

/**
 * Translation Cache Configuration
 */
export const TRANSLATION_CACHE_TTL = 604800 // 7 days in seconds

/**
 * Language Code to Name Mapping
 */
export const LANGUAGE_MAP: Record<string, string> = {
  ar: 'Arabic',
  zh: 'Chinese',
  en: 'English',
  ru: 'Russian',
}

/**
 * Get language name from code, fallback to Arabic
 */
export function getLanguageName(code: string): string {
  return LANGUAGE_MAP[code] || 'Arabic'
}
