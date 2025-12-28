# Plan: Switch Gemini to Service Account Authentication

## Problem
The current OCR implementation in `src/server-fns/ocr.ts` uses `@google/generative-ai` which requires a `GEMINI_API_KEY` environment variable. However, the Vision API client already uses a service account JSON file (`secrets/lang-481909-7416a55f8e8d.json`) for authentication. We want to eliminate the need for additional environment variables and use the same service account for both services.

## Solution
Switch from `@google/generative-ai` to `@google/genai` package and configure it to use Vertex AI with service account authentication, using the same service account JSON file as the Vision API client.

## Implementation Steps

### 1. Install @google/genai Package
```bash
bun add @google/genai
```

### 2. Update src/server-fns/ocr.ts

**Changes needed:**
- Replace import from `@google/generative-ai` to `@google/genai`
- Remove `GEMINI_API_KEY` environment variable check
- Initialize GoogleGenAI client with Vertex AI configuration using service account
- Update model instantiation to use the new SDK syntax
- Remove fallback logic for missing API key (service account will always be available)

**Key configuration:**
```typescript
import { GoogleGenAI } from '@google/genai'
import path from 'node:path'

// Initialize Gemini AI client with Vertex AI using service account
const genAI = new GoogleGenAI({
  vertexai: true,
  project: 'lang-481909',  // Extract from service account or use env var
  location: 'us-central1',  // Default location, can be configured
  googleAuthOptions: {
    keyFilename: path.join(process.cwd(), 'secrets/lang-481909-7416a55f8e8d.json')
  }
})
```

**Model instantiation update:**
```typescript
// Old: const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
// New: const model = genAI.models.model('gemini-1.5-flash')
```

### 3. Update .env.example
Remove or comment out the `GEMINI_API_KEY` variable since it's no longer needed:
```bash
# Gemini API for language filtering (no longer needed - using service account)
# GEMINI_API_KEY=your-gemini-api-key-here
```

## Benefits
1. **Single authentication method**: Both Vision API and Gemini use the same service account
2. **No additional environment variables**: Eliminates the need for `GEMINI_API_KEY`
3. **Better security**: Service accounts are more secure than API keys for server-side applications
4. **Consistent with existing setup**: Uses the same authentication pattern as TTS and Vision API clients
5. **Vertex AI features**: Access to enterprise-grade features and better rate limits

## Technical Details

### Service Account File Location
- Path: `secrets/lang-481909-7416a55f8e8d.json`
- Already used by: Vision API (ocr.ts) and TTS (tts.ts)
- Contains: Project ID, private key, and authentication credentials

### Required Permissions
The service account should have the following roles:
- `roles/cloudvision.apiUser` (for Vision API - already configured)
- `roles/aiplatform.user` (for Vertex AI Gemini - may need to be added)

### Model Selection
- Current: `gemini-1.5-flash`
- Available on Vertex AI: Same model available
- No changes needed to model selection logic

## Testing Checklist
- [ ] Verify service account has Vertex AI permissions
- [ ] Test OCR with different languages (auto, en, ar, zh, ru)
- [ ] Verify Arabic harakat preservation works correctly
- [ ] Test error handling when service account is missing
- [ ] Confirm no console warnings about missing API key
- [ ] Verify language filtering functionality remains intact

## Rollback Plan
If issues arise, revert to the original `@google/generative-ai` implementation by:
1. Restoring the original ocr.ts file
2. Requiring `GEMINI_API_KEY` environment variable again
3. Documenting the need for both service account and API key

## Notes
- The project ID `lang-481909` is derived from the service account filename
- Location `us-central1` is a common default but can be adjusted if needed
- The new `@google/genai` package is the official successor to `@google/generative-ai`
- Both packages can coexist during migration if needed
