import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { TextInput } from "@/components/text-input";
import { TextDisplay } from "@/components/text-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  component: HomePage,
});

interface SavedText {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

function HomePage() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState<string | null>(null);
  const [currentTextId, setCurrentTextId] = useState<string | null>(null);
  const [targetLanguage] = useState("en");
  const [savedTexts, setSavedTexts] = useState<SavedText[]>([]);
  const [isLoadingTexts, setIsLoadingTexts] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load saved texts when user is logged in
  useEffect(() => {
    if (session?.user?.id) {
      loadSavedTexts();
    }
  }, [session?.user?.id]);

  const loadSavedTexts = async () => {
    if (!session?.user?.id) return;
    setIsLoadingTexts(true);
    try {
      const response = await fetch(`/api/texts?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setSavedTexts(data.texts);
      }
    } catch (err) {
      console.error("Failed to load saved texts:", err);
    } finally {
      setIsLoadingTexts(false);
    }
  };

  const handleTextSubmit = async (text: string) => {
    // Save text if user is logged in
    if (session?.user?.id) {
      try {
        const response = await fetch("/api/texts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            content: text,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentTextId(data.text.id);
          // Add to local list
          setSavedTexts((prev) => [data.text, ...prev]);
        }
      } catch (err) {
        console.error("Failed to save text:", err);
      }
    }
    setInputText(text);
  };

  const handleOpenSavedText = (text: SavedText) => {
    setCurrentTextId(text.id);
    setInputText(text.content);
  };

  const handleDeleteText = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      const response = await fetch(`/api/texts?id=${id}`, { method: "DELETE" });
      if (response.ok) {
        setSavedTexts((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete text:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleBack = () => {
    setInputText(null);
    setCurrentTextId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          {inputText ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          ) : (
            <div>
              <h1 className="text-2xl font-bold tracking-tight">LangLessons</h1>
              <p className="text-sm text-muted-foreground">
                Tap words to translate
              </p>
            </div>
          )}

          {session?.user && (
            <div className="flex items-center gap-3">
              <a
                href="/vocabulary"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                My Vocabulary
              </a>
              <ThemeToggle />
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm font-medium hidden sm:inline">
                {session.user.name || session.user.email}
              </span>
            </div>
          )}

          {!session && !isPending && (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: "/login" })}
              >
                Sign In
              </Button>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main>
          {!inputText ? (
            <div className="space-y-6">
              <TextInput onSubmit={handleTextSubmit} />

              {/* Saved Texts */}
              {session?.user && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">My Texts</h2>
                  {isLoadingTexts ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : savedTexts.length === 0 ? (
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
                              <p className="font-medium truncate">{text.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(text.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={(e) => handleDeleteText(text.id, e)}
                              disabled={deletingId === text.id}
                            >
                              {deletingId === text.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Instructions for non-logged in users */}
              {!session && (
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
                        <span>
                          Tap another word to translate the whole phrase
                        </span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Tap on words to translate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TextDisplay text={inputText} targetLanguage={targetLanguage} />
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}