import { redis } from "bun";
import type { RedisClient } from "bun";
import { TRANSLATION_CACHE_TTL } from "@/server-fns/constants";

const CACHE_TTL = TRANSLATION_CACHE_TTL;

// Redis client instance (Bun's built-in client)
// Automatically reads REDIS_URL from environment variables
let redisClient: RedisClient | null = null;

/**
 * Get or create Redis client instance
 */
export function getRedisClient(): RedisClient | null {
  // If REDIS_URL is not configured, return null (caching disabled)
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!redisClient) {
    redisClient = redis;
  }

  return redisClient;
}

/**
 * Check if Redis is available and connected
 */
export async function isRedisAvailable(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.ping();
    return true;
  } catch (error) {
    console.warn("Redis is not available:", error);
    return false;
  }
}

/**
 * Generate cache key for translation
 * Format: translation:{sourceLang}:{targetLang}:{textHash}
 */
export function generateCacheKey(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): string {
  // Create a simple hash of the text for the cache key
  const textHash = Buffer.from(text).toString("base64").slice(0, 16);
  return `translation:${sourceLanguage}:${targetLanguage}:${textHash}`;
}

/**
 * Get cached translation
 */
export async function getCachedTranslation(
  cacheKey: string
): Promise<{ translatedText: string; detectedLanguage?: string } | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const cached = await client.get(cacheKey);
    if (!cached) return null;

    return JSON.parse(cached);
  } catch (error) {
    console.warn("Failed to get cached translation:", error);
    return null;
  }
}

/**
 * Cache a translation result
 */
export async function cacheTranslation(
  cacheKey: string,
  translation: { translatedText: string; detectedLanguage?: string }
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.set(cacheKey, JSON.stringify(translation));
    await client.expire(cacheKey, CACHE_TTL);
  } catch (error) {
    // Non-blocking: log warning but don't fail the translation
    console.warn("Failed to cache translation:", error);
  }
}

/**
 * Get cache TTL in seconds
 */
export function getCacheTTL(): number {
  return CACHE_TTL;
}
