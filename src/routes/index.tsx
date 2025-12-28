import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { FileText, Languages } from 'lucide-react'
import type { SavedText } from '@/lib/saved-texts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TextInput } from '@/components/text-input'
import { ThemeToggle } from '@/components/theme-toggle'
import { createTextFn, deleteTextFn, getPublicStoriesFn, getSavedTextsFn } from '@/server-fns/texts'
import { getSessionFn } from '@/server-fns/session'

export const Route = createFileRoute('/')({
  loader: async () => {
    // Access session from router context
    const session = await getSessionFn()

    // Fetch public stories for everyone
    const publicStories = await getPublicStoriesFn()

    // Fetch saved texts if user is logged in
    let savedTexts: Awaited<ReturnType<typeof getSavedTextsFn>> = []
    if (session?.user.id) {
      savedTexts = await getSavedTextsFn({ data: { userId: session.user.id } })
    }

    return {
      publicStories,
      savedTexts,
      user: session?.user,
    }
  },
  component: HomePage,
})

function HomePage() {
  const navigate = useNavigate()
  const { publicStories, savedTexts, user } = Route.useLoaderData()
  const createText = useServerFn(createTextFn)
  const deleteText = useServerFn(deleteTextFn)

  const handleTextSubmit = async (
    text: string,
    language: string,
    isPublic?: boolean,
  ) => {
    if (!user?.id) {
      alert('Please sign in to save texts')
      return
    }

    // Save new text
    const result = await createText({
      data: {
        userId: user.id,
        content: text,
        sourceLanguage: language === 'auto' ? undefined : language,
        isPublic,
      },
    })

    navigate({ to: '/texts/$textId', params: { textId: result.id } })
  }

  const handleOpenSavedText = (text: SavedText) => {
    // Navigate to text details page
    navigate({ to: '/texts/$textId', params: { textId: text.id } })
  }

  const handleDeleteText = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this text?')) {
      return
    }

    try {
      await deleteText({ data: { id } })
      // Reload to refetch data
      window.location.reload()
    } catch (err) {
      console.error('Failed to delete text:', err)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">LangLessons</h1>
            <p className="text-sm text-muted-foreground">
              Tap words to translate
            </p>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <a
                href="/vocabulary"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                My Vocabulary
              </a>
              <ThemeToggle />
              {user.image && (
                <img
                  src={user.image}
                  alt={user.name || 'User'}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm font-medium hidden sm:inline">
                {user.name || user.email}
              </span>
            </div>
          )}

          {!user && (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: '/login' })}
              >
                Sign In
              </Button>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="space-y-8">
          <TextInput onSubmit={handleTextSubmit} />

          {/* Saved Texts */}
          {user && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">My Texts</h2>
              {savedTexts.length === 0 ? (
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="py-8 text-center">
                    <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      Your saved texts will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {savedTexts.map((text) => (
                    <Card
                      key={text.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleOpenSavedText(text)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {text.title || 'Untitled'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {text.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDeleteText(text.id, e)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-0.9 2-2 2H7c-1.1 0-2-0.9-2-2V6m3 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
                          </svg>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Public Stories */}
          <div className="space-y-3 pt-6 border-t border-border/50">
            <h2 className="text-lg font-semibold">Public Stories</h2>

            {publicStories.length === 0 ? (
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="py-8 text-center">
                  <Languages className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No public stories available yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {publicStories.map((story) => (
                  <Card
                    key={story.id}
                    className="cursor-pointer hover:bg-muted/50 transition-all hover:shadow-sm"
                    onClick={() => handleOpenSavedText(story)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {story.title || 'Untitled'}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                            {story.sourceLanguage || 'Auto'}
                          </p>
                          <span className="text-[10px] text-muted-foreground/30">
                            •
                          </span>
                          <p className="text-[10px] text-muted-foreground">
                            {story.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Instructions for non-logged in users */}
          {!user && (
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">How it works</h3>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-primary">1.</span>
                    <span>Paste any text in any language above</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-primary">2.</span>
                    <span>Tap on any word to see its translation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-primary">3.</span>
                    <span>Tap another word to translate the whole phrase</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
