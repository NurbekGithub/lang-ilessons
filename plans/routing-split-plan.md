# Routing Split Plan

## Overview
Split the current `/` route into two separate routes:
- `/` - Main page (input form, saved texts, public stories)
- `/texts/$textId` - Details page (text display with translations and editing)

## Architecture Decision: Router Context with Auth
To enable loaders to access authentication data, we'll use TanStack Router's context feature to pass the auth session throughout the router tree. This allows loaders to fetch authenticated data (like saved texts) instead of using `useEffect` + `useState`.

### Benefits of Router Context + Loaders
- Data fetched before component renders (better UX, no loading states in component)
- Automatic data refetching on navigation
- Type-safe access to auth data in loaders
- Cleaner component code (no data fetching logic)
- Better separation of concerns

## Current State
The [`index.tsx`](src/routes/index.tsx:1) route currently handles:
1. Main page view: TextInput, saved texts list, public stories list
2. Details view: TextDisplay component with translation functionality
3. Edit mode: TextInput with pre-filled data for editing

All state is managed locally in the component using `inputText`, `selectedLanguage`, `currentTextId`, and `isEditing` state variables.

## Proposed Changes

### 1. Create New Route: `src/routes/texts.$textId.tsx`

**Purpose**: Display a single text with translation capabilities and editing.

**Route Structure**: `/texts/$textId` (dynamic route with text ID parameter)

**Key Features**:
- **Loader**: Fetch text data by ID from `/api/texts?id=$textId`
- **Component**: Display the text using [`TextDisplay`](src/components/text-display.tsx:1)
- **Edit Mode**: Toggle between display and edit modes
- **Back Button**: Navigate back to `/` (main page)
- **Delete Button**: Allow deleting the text (if user owns it)

**Component Structure**:
```tsx
export const Route = createFileRoute('/texts/$textId')({
  loader: async ({ params }) => {
    const response = await fetch(`/api/texts?id=${params.textId}`)
    if (!response.ok) throw new Error('Text not found')
    return response.json()
  },
  component: TextDetailsPage,
})

function TextDetailsPage() {
  const { textId } = Route.useParams()
  const { text } = Route.useLoaderData()
  const [isEditing, setIsEditing] = useState(false)
  const navigate = useNavigate()
  
  // Display mode: TextDisplay component
  // Edit mode: TextInput component with pre-filled data
  // Back button: navigate({ to: '/' })
  // Update logic: PATCH /api/texts?id=$textId
}
```

### 2. Update `src/routes/index.tsx`

**Purpose**: Simplified main page focusing on input and browsing.

**Key Changes**:
- **Remove**: All inline text display logic (lines 222-391)
- **Remove**: State variables: `inputText`, `selectedLanguage`, `currentTextId`, `isEditing`, `savedTexts`, `publicStories`
- **Remove**: `useEffect` hooks for fetching data
- **Remove**: `useSession` hook (session will be available via router context)
- **Remove**: `handleBack` function
- **Remove**: Conditional rendering based on `inputText` state
- **Add**: Loader to fetch saved texts (for logged-in users) and public stories using router context
- **Update**: `handleOpenSavedText` to navigate to `/texts/$textId` instead of setting state
- **Keep**: TextInput component for new text submission
- **Keep**: Saved texts list (for logged-in users) - fetched via loader
- **Keep**: Public stories list - fetched via loader
- **Keep**: "How it works" instructions for non-logged-in users

**Updated Route Structure with Loader and Context**:
```tsx
export const Route = createFileRoute('/')({
  loader: async ({ context }) => {
    // Access session from router context
    const session = await context.getSession()
    
    // Fetch public stories for everyone
    const publicResponse = await fetch('/api/texts?public=true')
    const publicData = await publicResponse.json()
    
    // Fetch saved texts if user is logged in
    let savedTexts = []
    if (session?.user?.id) {
      const savedResponse = await fetch(`/api/texts?userId=${session.user.id}`)
      const savedData = await savedResponse.json()
      savedTexts = savedData.texts || []
    }
    
    return {
      publicStories: publicData.texts || [],
      savedTexts,
      session,
    }
  },
  component: HomePage,
})

function HomePage() {
  const navigate = useNavigate()
  const { publicStories, savedTexts, session } = Route.useLoaderData()
  
  const handleTextSubmit = async (text: string, language: string, isPublic?: boolean) => {
    // Save new text
    const response = await fetch('/api/texts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.user.id,
        content: text,
        sourceLanguage: language === 'auto' ? undefined : language,
        isPublic,
      }),
    })
    
    if (response.ok) {
      const data = await response.json()
      // Navigate to the new text's details page
      navigate({ to: '/texts/$textId', params: { textId: data.text.id } })
    }
  }
  
  const handleOpenSavedText = (text: SavedText) => {
    // Navigate to text details page
    navigate({ to: '/texts/$textId', params: { textId: text.id } })
  }
  
  // Simplified render: always show main page content
  return (
    <div>
      <header>...</header>
      <main>
        <TextInput onSubmit={handleTextSubmit} />
        <SavedTextsList texts={savedTexts} />
        <PublicStoriesList stories={publicStories} />
      </main>
    </div>
  )
}
```

### 3. Navigation Flow

**Current Flow**:
1. User on `/` sees main page
2. User clicks saved text → state changes, text displays inline
3. User clicks "Back" → state resets, back to main page

**New Flow**:
1. User on `/` sees main page
2. User clicks saved text → navigate to `/texts/$textId`
3. User on `/texts/$textId` sees text details
4. User clicks "Back" → navigate back to `/`

**Benefits**:
- Direct URLs to specific texts (shareable)
- Browser back/forward navigation works correctly
- Cleaner separation of concerns
- Better SEO (each text has its own URL)

## Implementation Steps

### Step 0: Add Router Context with Auth
- Update `src/routes/__root.tsx` to use `createRootRouteWithContext`
- Define router context type with `getSession` function
- Update `src/router.tsx` to pass auth context when creating router

**Root Route with Context**:
```tsx
// src/routes/__root.tsx
import { createRootRouteWithContext } from '@tanstack/react-router'
import { getSession } from '@/lib/auth-client'

export interface RouterContext {
  getSession: typeof getSession
}

export const Route = createRootRouteWithContext<RouterContext>()({
  // ... existing config
})
```

**Router with Context**:
```tsx
// src/router.tsx
import { createRouter } from '@tanstack/react-router'
import { getSession } from '@/lib/auth-client'
import { routeTree } from './routeTree.gen'

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {
      getSession,
    },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  })

  return router
}
```

### Step 1: Create the details route
- Create `src/routes/texts.$textId.tsx`
- Implement loader to fetch text by ID
- Implement component with display/edit modes
- Add back button navigation

### Step 2: Update the index route
- Add loader to fetch public stories and saved texts using router context
- Remove inline text display logic
- Remove unnecessary state variables (`inputText`, `selectedLanguage`, `currentTextId`, `isEditing`, `savedTexts`, `publicStories`)
- Remove `useEffect` hooks for fetching data
- Remove `useSession` hook (session available via loader)
- Update click handlers to navigate instead of setting state
- Simplify component to only show main page

### Step 3: Update text submission
- After saving a new text, navigate to its details page
- Ensure the text ID is available after creation

### Step 4: Test the changes
- Verify navigation works correctly
- Test back/forward browser buttons
- Test editing functionality
- Test delete functionality
- Verify both saved texts and public stories work
- Verify data fetching works via loaders

## File Changes Summary

### New Files
- `src/routes/texts.$textId.tsx` - New details route

### Modified Files
- `src/routes/__root.tsx` - Add router context with auth
- `src/router.tsx` - Pass auth context to router
- `src/routes/index.tsx` - Simplified to main page only with loader

### Files Not Modified
- `src/components/text-display.tsx` - No changes needed
- `src/components/text-input.tsx` - No changes needed
- `src/lib/auth-client.ts` - No changes needed

## Technical Considerations

### TanStack Router Features Used
- **Dynamic Routes**: `$textId` parameter in route path
- **Loaders**: Fetch data before component renders
- **useParams**: Access route parameters
- **useLoaderData**: Access loader data in component
- **useNavigate**: Programmatic navigation

### Error Handling
- Handle 404 when text not found
- Handle loading states in the details route
- Handle errors from API calls

### State Management
- Details route: Local state for edit mode only
- Index route: All data fetched via loaders (public stories and saved texts)
  - Router context provides `getSession` function to loaders
  - Loaders can fetch authenticated data before component renders
  - No `useEffect` or `useState` needed for data fetching
- No shared state between routes (each route is independent)

### Router Context Architecture
By using `createRootRouteWithContext`, we can pass the `getSession` function from `better-auth` to all route loaders. This enables:

1. **Server-like data fetching**: Loaders can access session data and make authenticated requests
2. **Type safety**: TypeScript knows the shape of the context
3. **Automatic refetching**: Data refetches when navigating back to the route
4. **Better UX**: No loading states in components, data is ready before render

**How it works**:
1. Root route defines context type with `getSession` function
2. Router instance is created with the context value
3. Loaders access `context.getSession()` to get session
4. Loaders fetch authenticated data based on session
5. Components access data via `Route.useLoaderData()`

## Testing Checklist

- [ ] Navigate to `/` - see main page
- [ ] Submit new text - navigate to `/texts/$textId`
- [ ] Click saved text - navigate to `/texts/$textId`
- [ ] Click public story - navigate to `/texts/$textId`
- [ ] Click back button - return to `/`
- [ ] Use browser back button - return to `/`
- [ ] Use browser forward button - return to text details
- [ ] Edit text on details page - updates successfully
- [ ] Delete text on details page - returns to `/` and removes from list
- [ ] Refresh page on `/texts/$textId` - text still loads correctly
- [ ] Access invalid text ID - shows error or redirects
