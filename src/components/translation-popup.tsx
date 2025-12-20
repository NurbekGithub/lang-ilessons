import { useState } from "react";
import { Loader2, X, BookmarkPlus, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TranslationPopupProps {
    originalText: string;
    translatedText?: string;
    isLoading: boolean;
    error?: string | null;
    position: { x: number; y: number };
    onClose: () => void;
    onSaveToVocabulary?: (originalText: string, translatedText: string) => Promise<void>;
}

export function TranslationPopup({
    originalText,
    translatedText,
    isLoading,
    error,
    position,
    onClose,
    onSaveToVocabulary,
}: TranslationPopupProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = async () => {
        if (!onSaveToVocabulary || !translatedText) return;

        setIsSaving(true);
        try {
            await onSaveToVocabulary(originalText, translatedText);
            setIsSaved(true);
        } catch (err) {
            console.error("Failed to save to vocabulary:", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
                left: Math.min(position.x, window.innerWidth - 280),
                top: position.y + 10,
                maxWidth: "calc(100vw - 32px)",
            }}
        >
            <Card className="relative w-72 p-4 shadow-xl border-primary/20 bg-card/95 backdrop-blur-sm">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
                    aria-label="Close"
                >
                    <X className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Original text */}
                <div className="mb-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Original
                    </p>
                    <p className="font-medium text-foreground break-words">
                        {originalText}
                    </p>
                </div>

                {/* Separator */}
                <div className="h-px bg-border mb-3" />

                {/* Translation result */}
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Translation
                    </p>

                    {isLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground py-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Translating...</span>
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    {!isLoading && !error && translatedText && (
                        <p className="font-medium text-primary break-words">
                            {translatedText}
                        </p>
                    )}
                </div>

                {/* Save to Vocabulary Button */}
                {!isLoading && !error && translatedText && onSaveToVocabulary && (
                    <>
                        <div className="h-px bg-border my-3" />
                        <Button
                            variant={isSaved ? "secondary" : "outline"}
                            size="sm"
                            className="w-full gap-2"
                            onClick={handleSave}
                            disabled={isSaving || isSaved}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : isSaved ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Saved to Vocabulary
                                </>
                            ) : (
                                <>
                                    <BookmarkPlus className="w-4 h-4" />
                                    Save to Vocabulary
                                </>
                            )}
                        </Button>
                    </>
                )}
            </Card>
        </div>
    );
}
