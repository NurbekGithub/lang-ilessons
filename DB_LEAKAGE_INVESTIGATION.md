# DB Singleton Leakage Investigation Report

## Executive Summary

The investigation revealed that the DB singleton is **leaking to the frontend code** through route loaders. While the DB singleton itself is not directly imported in frontend components, it is being bundled into the client through an anti-pattern where route loaders call library functions that use the DB singleton directly.

## Understanding TanStack Start Execution Model

Based on TanStack Start documentation:

### Critical Fact: Route Loaders are Isomorphic
Route loaders defined with `createFileRoute` execute on **BOTH** the server and the client:

- **Server-side**: During initial SSR, loaders run on the server
- **Client-side**: During hydration and client-side navigation, loaders run on the client
- **Security Risk**: Any code in a loader that accesses sensitive resources (like DB connections, secrets, etc.) will be bundled and executed on the client

### Proper Pattern for Server-Only Operations
To ensure code only runs on the server:
1. Create a server function using `createServerFn()` - this is an RPC that only executes on the server
2. Call the server function from the route loader
3. The loader orchestrates the isomorphic call pattern

**Reference**: TanStack Start docs - "Route loaders are isomorphic and execute in both server and client environments... To safely access server-only resources in loaders, create a dedicated server function using `createServerFn()` and call it from your loader."

## Current Architecture

### DB Singleton Implementation
File: [`src/db/index.ts`](src/db/index.ts:1)
```typescript
export const db = isDev
    ? drizzleNeon({ client: neon(process.env.DATABASE_URL!), schema })
    : drizzleBun({ client: new SQL({ adapter: "postgres", url: process.env.DATABASE_URL! }), schema })
```
- Module-level singleton initialized at load time
- Uses environment variables (DATABASE_URL)

### Library Functions Using DB Directly

1. **[`src/lib/vocabulary.ts`](src/lib/vocabulary.ts:1)**
   - Imports: `import { db } from "@/db"`
   - Functions: `addToVocabulary()`, `getVocabularyList()`, `deleteVocabularyItemById()`
   - All functions use `db` directly

2. **[`src/lib/auth.ts`](src/lib/auth.ts:1)**
   - Imports: `import { db } from "@/db"`
   - Uses `db` in better-auth adapter: `drizzleAdapter(db, { provider: "pg" })`

3. **[`src/lib/saved-texts.ts`](src/lib/saved-texts.ts:1)**
   - Imports: `import { db } from "@/db"`
   - Functions: `saveText()`, `getSavedTexts()`, `getPublicStories()`, `getSavedTextById()`, `updateSavedText()`, `deleteSavedText()`
   - All functions use `db` directly

### Server Functions (Properly Implemented)

1. **[`src/server-fns/texts.ts`](src/server-fns/texts.ts:1)**
   - Properly wraps library functions using `createServerFn()`
   - Functions: `getPublicStoriesFn`, `getSavedTextsFn`, `getTextByIdFn`, `createTextFn`, `updateTextFn`, `deleteTextFn`

2. **[`src/server-fns/vocabulary.ts`](src/server-fns/vocabulary.ts:1)**
   - Properly wraps library functions using `createServerFn()`
   - Functions: `getVocabularyFn`, `addVocabularyItemFn`, `deleteVocabularyItemFn`

3. **[`src/server-fns/session.ts`](src/server-fns/session.ts:1)**
   - Properly wraps auth using `createServerFn()`
   - Function: `getSessionFn`

## Leakage Points Identified

### 🔴 CRITICAL: Route Loaders Calling Library Functions Directly

#### 1. [`src/routes/index.tsx`](src/routes/index.ts:14) - Loader
```typescript
export const Route = createFileRoute('/')({
  loader: async () => {
    const session = await getSessionFn()  // ✅ Good - calls server function
    const publicStories = await getPublicStories()  // ❌ BAD - direct library call
    let savedTexts = []
    if (session?.user.id) {
      savedTexts = await getSavedTexts(session.user.id)  // ❌ BAD - direct library call
    }
    return { publicStories, savedTexts, user: session?.user }
  },
  component: HomePage,
})
```

**Problem**: `getPublicStories()` and `getSavedTexts()` are imported directly from [`@/lib/saved-texts`](src/lib/saved-texts.ts:1), which uses the DB singleton. When this loader runs on the client during hydration/navigation, the DB singleton gets bundled and executed.

#### 2. [`src/routes/texts.$textId.tsx`](src/routes/texts.$textId.tsx:13) - Loader
```typescript
export const Route = createFileRoute("/texts/$textId")({
  loader: async ({ params }) => {
    const text = await getSavedTextById(params.textId);  // ❌ BAD - direct library call
    if (!text) {
      throw new Error("Text not found");
    }
    return { text };
  },
  component: TextDetailsPage,
});
```

**Problem**: `getSavedTextById()` is imported directly from [`@/lib/saved-texts`](src/lib/saved-texts.ts:1), which uses the DB singleton.

### ✅ CORRECT: Routes Using Server Functions

#### 1. [`src/routes/vocabulary.tsx`](src/routes/vocabulary.tsx:10)
```typescript
export const Route = createFileRoute("/vocabulary")({
    component: VocabularyPage,
});
```
**Good**: No loader defined. Uses `useServerFn()` in the component to call server functions.

#### 2. Component-level server function usage
All components properly use `useServerFn()` to call server functions:
- [`src/routes/index.tsx`](src/routes/index.tsx:39): `const createText = useServerFn(createTextFn)`
- [`src/routes/texts.$textId.tsx`](src/routes/texts.$textId.tsx:30): `const updateText = useServerFn(updateTextFn)`
- [`src/routes/vocabulary.tsx`](src/routes/vocabulary.tsx:29): `const getVocabulary = useServerFn(getVocabularyFn)`

## Impact Assessment

### Security Risks
1. **Database Credentials Exposure**: `DATABASE_URL` environment variable is used in the DB singleton initialization. If this runs on the client, credentials could be exposed.
2. **Database Connection Logic**: The entire Drizzle ORM connection logic gets bundled to the client.
3. **Schema Information**: Database schema definitions could be exposed.

### Performance Issues
1. **Bundle Size Increase**: Database libraries (drizzle-orm, neon serverless) are unnecessarily bundled to the client.
2. **Initialization Overhead**: DB connection initialization runs on the client during hydration.

### Runtime Errors
1. **Environment Variable Access**: Client-side code cannot access `process.env.DATABASE_URL`, causing runtime errors.
2. **Network Restrictions**: Browser cannot connect directly to PostgreSQL databases.

## Recommended Fixes

### Fix 1: Update Route Loaders to Use Server Functions

#### For [`src/routes/index.tsx`](src/routes/index.tsx:14)
```typescript
export const Route = createFileRoute('/')({
  loader: async () => {
    const session = await getSessionFn()
    const publicStories = await getPublicStoriesFn()  // Use server function
    let savedTexts = []
    if (session?.user.id) {
      savedTexts = await getSavedTextsFn({ data: { userId: session.user.id } })  // Use server function
    }
    return { publicStories, savedTexts, user: session?.user }
  },
  component: HomePage,
})
```

#### For [`src/routes/texts.$textId.tsx`](src/routes/texts.$textId.tsx:13)
```typescript
export const Route = createFileRoute("/texts/$textId")({
  loader: async ({ params }) => {
    const result = await getTextByIdFn({ data: { id: params.textId } });  // Use server function
    if (!result) {
      throw new Error("Text not found");
    }
    return { text: result };
  },
  component: TextDetailsPage,
});
```

### Fix 2: Add Server-Only Guards (Optional but Recommended)

Wrap library functions with `createServerOnlyFn()` to prevent accidental client-side usage:

```typescript
// src/lib/vocabulary.ts
import { createServerOnlyFn } from '@tanstack/react-start'

export const addToVocabularySafe = createServerOnlyFn(addToVocabulary)
export const getVocabularyListSafe = createServerOnlyFn(getVocabularyList)
```

### Fix 3: Update Imports

Update route file imports:
- Remove: `import { getPublicStories, getSavedTexts } from '@/lib/saved-texts'`
- Remove: `import { getSavedTextById } from '@/lib/saved-texts'`
- Add: `import { getPublicStoriesFn, getSavedTextsFn, getTextByIdFn } from '@/server-fns/texts'`

## Summary

| File | Issue | Severity | Fix Required |
|------|-------|----------|--------------|
| [`src/routes/index.tsx`](src/routes/index.tsx:14) | Loader calls `getPublicStories()` and `getSavedTexts()` directly | 🔴 CRITICAL | Yes - use server functions |
| [`src/routes/texts.$textId.tsx`](src/routes/texts.$textId.tsx:13) | Loader calls `getSavedTextById()` directly | 🔴 CRITICAL | Yes - use server function |
| [`src/lib/vocabulary.ts`](src/lib/vocabulary.ts:1) | Uses DB singleton | ⚠️ MEDIUM | Optional - add server-only guard |
| [`src/lib/auth.ts`](src/lib/auth.ts:1) | Uses DB singleton | ⚠️ MEDIUM | Optional - add server-only guard |
| [`src/lib/saved-texts.ts`](src/lib/saved-texts.ts:1) | Uses DB singleton | ⚠️ MEDIUM | Optional - add server-only guard |

## Conclusion

The DB singleton is leaking to the frontend through route loaders that call library functions directly. The fix is straightforward: update the two problematic route loaders to use the existing server functions instead of calling library functions directly. This ensures the DB singleton never reaches the client bundle.

The server functions are already properly implemented and should be used for all database operations in route loaders.
