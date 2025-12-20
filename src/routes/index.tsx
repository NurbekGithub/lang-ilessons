import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { TextInput } from "@/components/text-input";
import { TextDisplay } from "@/components/text-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState<string | null>(null);
  const [targetLanguage] = useState("en"); // TODO: make this configurable

  // Note: We're not enforcing auth redirect here for demo purposes
  // In production, you'd use route guards or redirect unauthenticated users

  const handleTextSubmit = (text: string) => {
    setInputText(text);
  };

  const handleBack = () => {
    setInputText(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-first container */}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/login" })}
            >
              Sign In
            </Button>
          )}
        </header>

        {/* Main Content */}
        <main>
          {!inputText ? (
            // Text Input View
            <div className="space-y-6">
              <TextInput onSubmit={handleTextSubmit} />

              {/* Instructions */}
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
                        Tap another word to translate the whole phrase between them
                      </span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Text Display View with word selection
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