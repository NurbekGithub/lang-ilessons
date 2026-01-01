# Server Functions DRY Plan

## Analysis Summary

After analyzing the `src/server-fns` directory, I've identified the following duplications:

### 1. **Google Cloud Configuration** (Duplicated 3 times)
- **Files:** [`generate-story.ts`](src/server-fns/generate-story.ts:10-17), [`ocr.ts`](src/server-fns/ocr.ts:10-24), [`tts.ts`](src/server-fns/tts.ts:6-8)
- **Duplications:**
  - Service account key path: `path.join(process.cwd(), 'secrets/lang-481909-7416a55f8e8d.json')`
  - Project ID: `'lang-481909'`
  - Location: `'us-central1'`

### 2. **Google GenAI Client Initialization** (Duplicated 2 times)
- **Files:** [`generate-story.ts`](src/server-fns/generate-story.ts:10-17), [`ocr.ts`](src/server-fns/ocr.ts:16-24)
- **Duplications:**
  - `new GoogleGenAI({ vertexai: true, project, location, googleAuthOptions })`

### 3. **AI Model Constants** (Duplicated 2 times)
- **Files:** [`generate-story.ts`](src/server-fns/generate-story.ts:6-7), [`ocr.ts`](src/server-fns/ocr.ts:8-9)
- **Duplications:**
  - `const BEST_MODEL = "gemini-2.5-flash"`
  - Commented out `CHEAP_MODEL`

### 4. **Language Mapping** (Duplicated 2 times)
- **Files:** [`generate-story.ts`](src/server-fns/generate-story.ts:30-35), [`ocr.ts`](src/server-fns/ocr.ts:68-72)
- **Duplications:**
  - Language code to name mapping (ar: Arabic, zh: Chinese, en: English, ru: Russian)

### 5. **Import Pattern** (Consistent across all files)
- All files import: `createServerFn` from `@tanstack/react-start`, `z` from `zod`

## Refactoring Plan

### Step 1: Create Common Constants File
**File:** `src/server-fns/constants.ts`

Will export:
- `GOOGLE_PROJECT_ID` - `'lang-481909'`
- `GOOGLE_LOCATION` - `'us-central1'`
- `SERVICE_ACCOUNT_KEY_PATH` - Path to service account JSON
- `BEST_MODEL` - `'gemini-2.5-flash'`
- `CHEAP_MODEL` - `'gemini-2.5-flash-lite'` (optional)
- `LANGUAGE_MAP` - Language code to name mapping

### Step 2: Create Google Clients Initialization File
**File:** `src/server-fns/google-clients.ts`

Will export:
- `getGenAIClient()` - Singleton or factory for GoogleGenAI client
- `getVisionClient()` - Singleton or factory for ImageAnnotatorClient
- `getTTSClient()` - Singleton or factory for TextToSpeechClient

**Design Decision:** Use singleton pattern to avoid re-initializing clients on every request, which improves performance.

### Step 3: Refactor Files

#### [`generate-story.ts`](src/server-fns/generate-story.ts)
- Remove duplicated constants and client initialization
- Import from `constants.ts` and `google-clients.ts`
- Keep only the story generation logic

#### [`ocr.ts`](src/server-fns/ocr.ts)
- Remove duplicated constants and client initialization
- Import from `constants.ts` and `google-clients.ts`
- Keep only OCR-specific logic

#### [`tts.ts`](src/server-fns/tts.ts)
- Remove duplicated client initialization
- Import from `constants.ts` and `google-clients.ts`
- Keep only TTS-specific logic

### Step 4: Verify No Breaking Changes
- Ensure all imports are correctly updated
- Verify that client initialization happens correctly
- Check that all functionality remains intact

## Benefits

1. **Single Source of Truth:** Configuration lives in one place
2. **Easier Maintenance:** Changes to Google Cloud config only need to be made once
3. **Better Performance:** Singleton pattern reduces client initialization overhead
4. **Cleaner Code:** Each file focuses on its specific domain logic
5. **Type Safety:** Shared constants are typed once

## Risk Mitigation

- **No API Changes:** This is purely internal refactoring
- **Backward Compatible:** All server function signatures remain unchanged
- **Testable:** Can test client initialization independently
- **Rollback Safe:** Easy to revert if issues arise

## Files to Create

1. `src/server-fns/constants.ts` - Shared constants
2. `src/server-fns/google-clients.ts` - Google client initialization

## Files to Modify

1. `src/server-fns/generate-story.ts` - Remove duplications
2. `src/server-fns/ocr.ts` - Remove duplications
3. `src/server-fns/tts.ts` - Remove duplications

## Files Unchanged

- `src/server-fns/detect.ts` - No duplications found
- `src/server-fns/instructions.ts` - No duplications found
- `src/server-fns/session.ts` - No duplications found
- `src/server-fns/texts.ts` - No duplications found
- `src/server-fns/translate.ts` - No duplications found
- `src/server-fns/vocabulary.ts` - No duplications found
