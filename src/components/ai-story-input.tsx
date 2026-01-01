import { useState } from 'react'
import { ArrowRight, Loader2, RotateCcw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { LanguageSelector, isRTL } from '@/components/language-selector'

interface AiStoryInputProps {
  onGenerate: (description: string, language: string) => Promise<{ story: string }>
  onStartLearning: (story: string, language: string) => void
  isLoading?: boolean
}

export function AiStoryInput({
  onGenerate,
  onStartLearning,
  isLoading = false,
}: AiStoryInputProps) {
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState('ar')
  const [generatedStory, setGeneratedStory] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (isGenerating) return

    setIsGenerating(true)
    try {
      const result = await onGenerate(description, language)
      setGeneratedStory(result.story)
    } catch (error) {
      console.error('Failed to generate story:', error)
      alert('Failed to generate story. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStartLearning = () => {
    if (generatedStory.trim()) {
      onStartLearning(generatedStory, language)
    }
  }

  const handleReset = () => {
    setGeneratedStory('')
    setDescription('')
  }

  const rtl = isRTL(language)

  return (
    <Card className="p-4 md:p-6">
      <div className="space-y-4">
        {/* Header with Language Selector */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-medium">AI Story Generator</span>
          </div>
          <LanguageSelector
            value={language}
            onChange={setLanguage}
            disabled={isGenerating || isLoading}
            showAuto={false}
          />
        </div>

        {!generatedStory ? (
          <>
            {/* Description Textarea */}
            <div className="space-y-2">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the story you want to generate... (optional)

Example: A story about a brave knight who saves a village from a dragon, set in medieval times.

Leave empty to generate a random famous short story."
                className={`min-h-[200px] md:min-h-[250px] text-base leading-relaxed resize-none ${rtl ? 'text-right' : 'text-left'}`}
                dir={rtl ? 'rtl' : 'ltr'}
                disabled={isGenerating || isLoading}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{description.length} / 500 characters</span>
                {description.length > 500 && (
                  <span className="text-destructive">Description too long</span>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || isLoading || description.length > 500}
              className="w-full gap-2"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Story...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Story
                </>
              )}
            </Button>

            {/* Help Text */}
            {!isGenerating && !isLoading && (
              <p className="text-sm text-muted-foreground text-center">
                {description.trim()
                  ? 'Click to generate a story based on your description'
                  : 'Click to generate a random famous short story'}
              </p>
            )}
          </>
        ) : (
          <>
            {/* Generated Story Display */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Generated Story</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={isGenerating || isLoading}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Generate Another
                </Button>
              </div>

              <div
                className={`p-4 rounded-lg bg-muted/50 border border-border/50 ${rtl ? 'text-right' : 'text-left'}`}
                dir={rtl ? 'rtl' : 'ltr'}
              >
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {generatedStory}
                </p>
              </div>

              {/* Story Info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Language:</span>
                <span className="font-medium text-foreground">
                  {language === 'ar' ? 'Arabic' : language === 'zh' ? 'Chinese' : language === 'ru' ? 'Russian' : 'English'}
                </span>
                <span>•</span>
                <span>{generatedStory.split(/\s+/).length} words</span>
              </div>
            </div>

            {/* Start Learning Button */}
            <Button
              onClick={handleStartLearning}
              disabled={isLoading}
              className="w-full gap-2"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Start Learning
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}
