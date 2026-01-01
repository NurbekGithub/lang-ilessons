# AI Story Generation Feature Plan

## Overview
Add a third tab with an AI icon that allows users to generate short stories using AI. Users can provide a description or skip it to get a random famous short story in the selected language.

## Technical Architecture

### Current Stack Analysis
- **Frontend**: React 19, TanStack Router, shadcn/ui components
- **AI Integration**: Google GenAI SDK (@google/genai) already installed
- **Language Support**: Arabic, Chinese, English, Russian (no auto mode for AI tab)
- **State Management**: React hooks, TanStack Server Functions

### Component Structure
```
src/
├── components/
│   └── ai-story-input.tsx          # NEW: AI story generation component
├── server-fns/
│   └── generate-story.ts            # NEW: Server function for AI generation
└── routes/
    └── index.tsx                    # MODIFY: Add third AI tab
```

## Implementation Steps

### 1. Create AI Story Generation Server Function
**File**: `src/server-fns/generate-story.ts`

**Responsibilities**:
- Accept description (optional) and target language
- Use Google GenAI API to generate short stories
- Handle two modes:
  - **With description**: Generate story based on user's description
  - **Without description**: Generate random famous short story in target language
- Return generated story content

**API Integration**:
```typescript
// Use @google/genai SDK
import { GoogleGenerativeAI } from '@google/genai'

// Environment variable needed:
// GOOGLE_GENAI_API_KEY (add to .env.example)
```

**Prompt Strategy**:
- **With description**: "Write a short story in [language] based on this description: [description]. Keep it concise (200-400 words) and engaging."
- **Without description**: "Write a famous or classic short story in [language]. Keep it concise (200-400 words) and engaging."

### 2. Create AI Story Input Component
**File**: `src/components/ai-story-input.tsx`

**UI Elements**:
- Description textarea (optional)
- Language selector (no auto option)
- "Generate Story" button
- Loading state with spinner
- Display generated story after generation
- "Start Learning" button (reuses existing flow)

**State Management**:
```typescript
interface AiStoryInputProps {
  onGenerate: (story: string, language: string) => void;
  isLoading?: boolean;
}
```

**Component Features**:
- Character count for description
- Language selector without "auto" option
- Smooth transition from description to story display
- RTL support for Arabic
- Error handling for API failures

### 3. Update Language Selector for Non-Auto Mode
**File**: `src/components/language-selector.tsx`

**Changes**:
- Add `showAuto` prop to control whether "auto" option is shown
- Default behavior: show auto (backward compatible)
- AI tab: hide auto option

```typescript
interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  isDetecting?: boolean;
  disabled?: boolean;
  showAuto?: boolean;  // NEW
}
```

### 4. Update Home Page with Third AI Tab
**File**: `src/routes/index.tsx`

**Changes**:
- Import `Sparkles` icon from lucide-react (AI icon)
- Update `TabsList` to use `grid-cols-3` instead of `grid-cols-2`
- Add third `TabsTrigger` with value "ai" and Sparkles icon
- Add third `TabsContent` with `AiStoryInput` component
- Import and use `generateStoryFn` server function

**Tab Layout**:
```tsx
<TabsList className="grid w-full grid-cols-3 mb-4">
  <TabsTrigger value="text">Paste Text</TabsTrigger>
  <TabsTrigger value="ocr">Scan Image</TabsTrigger>
  <TabsTrigger value="ai">
    <Sparkles className="w-4 h-4 mr-2" />
    AI Story
  </TabsTrigger>
</TabsList>
```

**Story Generation Flow**:
1. User enters description (optional) and selects language
2. Click "Generate Story"
3. Show loading state
4. Display generated story in place of description
5. Show "Start Learning" button
6. Click "Start Learning" → navigate to text learning page with generated story

### 5. Handle Story Generation Flow
**In `src/routes/index.tsx`**:

```typescript
const handleAiStoryGenerate = async (description: string, language: string) => {
  try {
    const result = await generateStoryFn({
      data: { description, language }
    })
    
    // Navigate to text learning page with generated story
    if (user?.id) {
      const savedText = await createTextFn({
        data: {
          userId: user.id,
          content: result.story,
          sourceLanguage: language,
          isPublic: false,  // AI-generated stories are private by default
        }
      })
      navigate({ to: '/texts/$textId', params: { textId: savedText.id } })
    } else {
      // For non-logged-in users, navigate with story in state
      // Or prompt to sign in
      alert('Please sign in to save and learn AI-generated stories')
    }
  } catch (error) {
    console.error('Failed to generate story:', error)
    alert('Failed to generate story. Please try again.')
  }
}
```

### 6. Environment Configuration
**File**: `.env.example`

Add:
```bash
# Google Generative AI (for story generation)
GOOGLE_GENAI_API_KEY=your-genai-api-key-here
```

### 7. Error Handling & Edge Cases
- **API Key Missing**: Show user-friendly error message
- **API Rate Limits**: Implement retry logic with exponential backoff
- **Empty Response**: Fallback to predefined famous stories
- **Language Not Supported**: Default to English with warning
- **Network Errors**: Show retry button
- **Story Too Long**: Truncate or ask AI to regenerate shorter version

### 8. User Experience Enhancements
- **Loading Animation**: Use existing `Loader2` icon from shadcn/ui
- **Success Feedback**: Toast notification when story is generated
- **Character Limits**: Show character count for description (max 500 chars)
- **Language Validation**: Ensure language is selected before generation
- **Responsive Design**: Mobile-friendly layout matching existing tabs

## Database Schema
No changes needed. AI-generated stories will be saved using existing `texts` table structure.

## API Endpoints
No new API endpoints. Server function pattern follows existing architecture.

## Testing Checklist
- [ ] Generate story with description
- [ ] Generate random story without description
- [ ] Test all supported languages (ar, zh, en, ru)
- [ ] Test RTL layout for Arabic
- [ ] Test with logged-in user
- [ ] Test without authentication
- [ ] Test error scenarios (API failure, network error)
- [ ] Test responsive design on mobile
- [ ] Test character limit enforcement
- [ ] Test story navigation to learning page

## Future Enhancements (Out of Scope)
- Story length customization
- Genre selection
- Difficulty level selection
- Save favorite AI-generated stories
- Regenerate story option
- Story history
- Batch story generation

## Dependencies
**Already Installed**:
- @google/genai: ^1.34.0 ✓
- lucide-react: ^0.562.0 ✓ (for Sparkles icon)

**No Additional Dependencies Required**

## Security Considerations
- API key stored in environment variables (never committed)
- Rate limiting on server side
- Input sanitization for descriptions
- Content moderation (AI should generate appropriate content)

## Performance Considerations
- Implement caching for generated stories
- Debounce API calls if user types rapidly
- Lazy load AI tab content
- Optimize prompt for faster generation

## Accessibility
- Keyboard navigation for all controls
- Screen reader support for language selector
- Loading state announcements
- Error message accessibility
- High contrast mode support
