# Server Functions Migration Plan

## Overview
Migrate from traditional API routes (`/api/*`) to TanStack Start's `createServerFn` for better type safety and simpler code.

## Current API Routes Structure

### Existing Endpoints
1. **`/api/texts`** - CRUD operations for saved texts
   - GET: Fetch texts (by userId, by id, or public stories)
   - POST: Create new text
   - DELETE: Delete text by id
   - PATCH: Update text by id

2. **`/api/vocabulary`** - Vocabulary management
   - GET: Fetch vocabulary by userId
   - POST: Add vocabulary item
   - DELETE: Delete vocabulary item by id

3. **`/api/translate`** - Translation service
   - POST: Translate text

4. **`/api/tts`** - Text-to-speech
   - POST: Generate speech audio

5. **`/api/detect`** - Language detection
   - POST: Detect language of text

6. **`/api/auth/$`** - Authentication (special case)
   - GET/POST: Auth handler (keep as-is, uses Better Auth)

## Migration Strategy

### Phase 1: Create Server Functions

#### 1.1 Texts Server Functions
Create `src/server-fns/texts.ts`:

```typescript
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  getPublicStories,
  getSavedTexts,
  getSavedTextById,
  saveText,
  updateSavedText,
  deleteSavedText,
} from '@/lib/saved-texts'

// Get public stories
export const getPublicStoriesFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    return getPublicStories()
  })

// Get user's saved texts
export const getSavedTextsFn = createServerFn({ method: 'GET' })
  .input(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    return getSavedTexts(data.userId)
  })

// Get single text by ID
export const getTextByIdFn = createServerFn({ method: 'GET' })
  .input(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const text = await getSavedTextById(data.id)
    if (!text) {
      throw new Error('Text not found')
    }
    return text
  })

// Create new text
export const createTextFn = createServerFn({ method: 'POST' })
  .input(
    z.object({
      userId: z.string(),
      content: z.string(),
      title: z.string().optional(),
      sourceLanguage: z.string().optional(),
      isPublic: z.boolean().optional(),
    })
  )
  .handler(async ({ data }) => {
    return saveText(data)
  })

// Update text
export const updateTextFn = createServerFn({ method: 'POST' })
  .input(
    z.object({
      id: z.string(),
      content: z.string().optional(),
      title: z.string().optional(),
      sourceLanguage: z.string().optional(),
      isPublic: z.boolean().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { id, ...updateData } = data
    const text = await updateSavedText(id, updateData)
    if (!text) {
      throw new Error('Text not found')
    }
    return text
  })

// Delete text
export const deleteTextFn = createServerFn({ method: 'POST' })
  .input(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await deleteSavedText(data.id)
  })
```

#### 1.2 Vocabulary Server Functions
Create `src/server-fns/vocabulary.ts`:

```typescript
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  getVocabularyList,
  addToVocabulary,
  deleteVocabularyItemById,
} from '@/lib/vocabulary'

// Get user's vocabulary
export const getVocabularyFn = createServerFn({ method: 'GET' })
  .input(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    return getVocabularyList(data.userId)
  })

// Add vocabulary item
export const addVocabularyItemFn = createServerFn({ method: 'POST' })
  .input(
    z.object({
      userId: z.string(),
      originalText: z.string(),
      translatedText: z.string(),
      sourceLanguage: z.string().optional(),
      targetLanguage: z.string(),
      context: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    return addToVocabulary(data)
  })

// Delete vocabulary item
export const deleteVocabularyItemFn = createServerFn({ method: 'POST' })
  .input(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await deleteVocabularyItemById(data.id)
  })
```

#### 1.3 Translate Server Functions
Create `src/server-fns/translate.ts`:

```typescript
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { translateText } from '@/lib/translate'

export const translateTextFn = createServerFn({ method: 'POST' })
  .input(
    z.object({
      text: z.string(),
      sourceLanguage: z.string().optional(),
      targetLanguage: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const result = await translateText({
      text: data.text,
      sourceLanguage: data.sourceLanguage || 'auto',
      targetLanguage: data.targetLanguage,
    })
    return {
      translatedText: result.translatedText,
      sourceLanguage: result.detectedLanguage || data.sourceLanguage || 'auto',
      targetLanguage: data.targetLanguage,
      source: result.source,
      alternatives: result.alternatives,
    }
  })
```

#### 1.4 TTS Server Functions
Create `src/server-fns/tts.ts`:

```typescript
import path from 'node:path'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'

const client = new TextToSpeechClient({
  keyFilename: path.join(process.cwd(), 'secrets/lang-481909-7416a55f8e8d.json'),
})

export const textToSpeechFn = createServerFn({ method: 'POST' })
  .input(
    z.object({
      text: z.string(),
      languageCode: z.string().default('en-US'),
      speakingRate: z.number().min(0.25).max(4.0).default(1.0),
    })
  )
  .handler(async ({ data }) => {
    const request = {
      input: { text: data.text },
      voice: { languageCode: data.languageCode, ssmlGender: 'NEUTRAL' as const },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: data.speakingRate,
      },
    }

    const [response] = await client.synthesizeSpeech(request)

    if (!response.audioContent) {
      throw new Error('No audio content returned from Google TTS')
    }

    const base64Audio = Buffer.from(response.audioContent as Uint8Array).toString('base64')
    return { audioContent: base64Audio }
  })
```

#### 1.5 Detect Server Functions
Create `src/server-fns/detect.ts`:

```typescript
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { detectLanguage } from '@/lib/translate'

export const detectLanguageFn = createServerFn({ method: 'POST' })
  .input(z.object({ text: z.string() }))
  .handler(async ({ data }) => {
    const sampleText = data.text.slice(0, 500)
    return detectLanguage(sampleText)
  })
```

### Phase 2: Update Client-Side Code

#### 2.1 Update `src/routes/index.tsx`
- Import server functions instead of making fetch calls
- Use `useServerFn()` hook for client-side calls
- Keep direct DB calls in loader (already done)

```typescript
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TextInput } from "@/components/text-input";
import { ThemeToggle } from "@/components/theme-toggle";
import { getPublicStories, getSavedTexts } from "@/lib/saved-texts";
import { createTextFn, deleteTextFn } from "@/server-fns/texts";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const session = await context.getSession();
    const publicStories = await getPublicStories();
    let savedTexts = [];
    if (session.data?.user.id) {
      savedTexts = await getSavedTexts(session.data.user.id);
    }
    return { publicStories, savedTexts, session };
  },
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { publicStories, savedTexts, session } = Route.useLoaderData();
  const createText = useServerFn(createTextFn);
  const deleteText = useServerFn(deleteTextFn);

  const handleTextSubmit = async (text: string, language: string, isPublic?: boolean) => {
    if (!session.data?.user.id) {
      alert("Please sign in to save texts");
      return;
    }

    const result = await createText({
      data: {
        userId: session.data.user.id,
        content: text,
        sourceLanguage: language === "auto" ? undefined : language,
        isPublic,
      },
    });

    if (result.data) {
      navigate({ to: "/texts/$textId", params: { textId: result.data.id } });
    }
  };

  const handleDeleteText = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this text?")) {
      return;
    }

    try {
      await deleteText({ data: { id } });
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete text:", err);
    }
  };

  // ... rest of component
}
```

#### 2.2 Update `src/routes/texts.$textId.tsx`
- Use server functions for update/delete operations
- Keep direct DB call in loader (already done)

```typescript
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Edit2, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextDisplay } from "@/components/text-display";
import { TextInput } from "@/components/text-input";
import { getSavedTextById } from "@/lib/saved-texts";
import { updateTextFn, deleteTextFn } from "@/server-fns/texts";

export const Route = createFileRoute("/texts/$textId")({
  loader: async ({ params }) => {
    const text = await getSavedTextById(params.textId);
    if (!text) {
      throw new Error("Text not found");
    }
    return { text };
  },
  component: TextDetailsPage,
});

function TextDetailsPage() {
  const { textId } = Route.useParams();
  const { text } = Route.useLoaderData();
  const [isEditing, setIsEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const updateText = useServerFn(updateTextFn);
  const deleteText = useServerFn(deleteTextFn);

  const handleUpdate = async (updatedText: string, language: string) => {
    try {
      await updateText({
        data: {
          id: textId,
          content: updatedText,
          sourceLanguage: language === "auto" ? undefined : language,
        },
      });
      setIsEditing(false);
      window.location.reload();
    } catch (err) {
      console.error("Failed to update text:", err);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this text?")) {
      return;
    }

    setDeleting(true);
    try {
      await deleteText({ data: { id: textId } });
      navigate({ to: "/" });
    } catch (err) {
      console.error("Failed to delete text:", err);
    } finally {
      setDeleting(false);
    }
  };

  // ... rest of component
}
```

#### 2.3 Update `src/routes/vocabulary.tsx`
- Use server functions for vocabulary operations

```typescript
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, BookOpen, Loader2, Trash2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getVocabularyFn, deleteVocabularyItemFn } from "@/server-fns/vocabulary";

export const Route = createFileRoute("/vocabulary")({
  component: VocabularyPage,
});

function VocabularyPage() {
  const { data: session, isPending: isSessionPending } = useSession();
  const [items, setItems] = useState<Array<VocabularyItem>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const getVocabulary = useServerFn(getVocabularyFn);
  const deleteVocabularyItem = useServerFn(deleteVocabularyItemFn);

  useEffect(() => {
    if (session?.user.id) {
      loadVocabulary();
    } else if (!isSessionPending) {
      setIsLoading(false);
    }
  }, [session?.user.id, isSessionPending]);

  const loadVocabulary = async () => {
    if (!session?.user.id) return;

    setIsLoading(true);
    try {
      const result = await getVocabulary({ data: { userId: session.user.id } });
      setItems(result.data || []);
    } catch (err) {
      console.error("Failed to load vocabulary:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteVocabularyItem({ data: { id } });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete vocabulary item:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // ... rest of component
}
```

#### 2.4 Update `src/components/text-display.tsx`
- Use server function for translate

```typescript
import { useServerFn } from "@tanstack/react-start";
import { translateTextFn } from "@/server-fns/translate";

function TextDisplay({ text, sourceLanguage, targetLanguage }) {
  const translateText = useServerFn(translateTextFn);

  const handleTranslate = async (textToTranslate: string) => {
    const result = await translateText({
      data: {
        text: textToTranslate,
        sourceLanguage,
        targetLanguage,
      },
    });
    return result.data;
  };

  // ... rest of component
}
```

#### 2.5 Update `src/components/translation-popup.tsx`
- Use server function for translate (similar to text-display)

### Phase 3: Clean Up

#### 3.1 Remove Old API Route Files
Delete these files after migration is complete:
- `src/routes/api/texts.ts`
- `src/routes/api/vocabulary.ts`
- `src/routes/api/translate.ts`
- `src/routes/api/tts.ts`
- `src/routes/api/detect.ts`

**Keep:** `src/routes/api/auth/$.ts` (uses Better Auth, different pattern)

#### 3.2 Verify All Functionality
- Test creating, updating, and deleting texts
- Test vocabulary management
- Test translation functionality
- Test TTS functionality
- Test language detection
- Verify type safety across client/server boundary

## Benefits of Migration

1. **Type Safety**: Full type safety from server to client
2. **Simpler Code**: No manual Response handling, URL parsing, or JSON serialization
3. **Better DX**: Autocomplete and inline documentation
4. **Validation**: Built-in input validation with Zod
5. **Error Handling**: Consistent error handling across all functions
6. **No Boilerplate**: Less code to maintain

## Migration Order

1. Create all server functions in `src/server-fns/`
2. Update route loaders (already done for texts)
3. Update client-side code in routes
4. Update client-side code in components
5. Remove old API route files
6. Test thoroughly

## Notes

- Auth endpoint (`/api/auth/$`) should remain as-is since it uses Better Auth's handler
- Server functions automatically handle serialization/deserialization
- Use `useServerFn()` hook in components for client-side calls
- Call server functions directly in loaders (no hook needed)
- All server functions should use Zod for input validation
