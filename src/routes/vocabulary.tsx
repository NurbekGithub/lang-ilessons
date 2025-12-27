import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Loader2, Trash2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/vocabulary")({
    component: VocabularyPage,
});

interface VocabularyItem {
    id: string;
    originalText: string;
    translatedText: string;
    sourceLanguage: string | null;
    targetLanguage: string;
    context: string | null;
    createdAt: string;
}

function VocabularyPage() {
    const { data: session, isPending: isSessionPending } = useSession();
    const [items, setItems] = useState<Array<VocabularyItem>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (session?.user?.id) {
            loadVocabulary();
        } else if (!isSessionPending) {
            setIsLoading(false);
        }
    }, [session?.user?.id, isSessionPending]);

    const loadVocabulary = async () => {
        if (!session?.user?.id) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/vocabulary?userId=${session.user.id}`);
            if (response.ok) {
                const data = await response.json();
                setItems(data.items);
            }
        } catch (err) {
            console.error("Failed to load vocabulary:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const response = await fetch(`/api/vocabulary?id=${id}`, { method: "DELETE" });
            if (response.ok) {
                setItems((prev) => prev.filter((item) => item.id !== id));
            }
        } catch (err) {
            console.error("Failed to delete vocabulary item:", err);
        } finally {
            setDeletingId(null);
        }
    };

    if (!session && !isSessionPending) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-2xl mx-auto px-4 py-12 text-center">
                    <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Sign in to view your vocabulary</h1>
                    <p className="text-muted-foreground mb-6">
                        Save words and phrases while reading to build your personal vocabulary list.
                    </p>
                    <Link to="/login">
                        <Button>Sign In</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
                {/* Header */}
                <header className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link to="/">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">My Vocabulary</h1>
                            <p className="text-sm text-muted-foreground">
                                {items.length} {items.length === 1 ? "word" : "words"} saved
                            </p>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : items.length === 0 ? (
                        <Card className="bg-muted/50 border-dashed">
                            <CardContent className="py-12 text-center">
                                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <h2 className="text-lg font-medium mb-2">No words saved yet</h2>
                                <p className="text-muted-foreground mb-4">
                                    While reading text, tap on words to translate them and save them to your vocabulary.
                                </p>
                                <Link to="/">
                                    <Button>Start Reading</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item) => (
                                <Card key={item.id} className="overflow-hidden">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-lg break-words">
                                                    {item.originalText}
                                                </p>
                                                <p className="text-primary break-words">
                                                    {item.translatedText}
                                                </p>
                                                {item.context && (
                                                    <p className="text-sm text-muted-foreground mt-2 italic">
                                                        "{item.context}"
                                                    </p>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Added {new Date(item.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDelete(item.id)}
                                                disabled={deletingId === item.id}
                                            >
                                                {deletingId === item.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
