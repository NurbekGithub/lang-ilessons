import { useState } from "react";
import { Loader2, X, BookmarkPlus, Check, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TranslationPopupProps {
    originalText: string;
    translatedText?: string;
    source?: "google" | "libretranslate";
    alternatives?: string[];
    isLoading: boolean;
    error?: string | null;
    position: { x: number; y: number };
    onClose: () => void;
    onSaveToVocabulary?: (originalText: string, translatedText: string) => Promise<void>;
}

export function TranslationPopup({
    originalText,
    translatedText,
    source,
    alternatives,
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
                        <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <p className="font-medium text-primary break-words">
                                    {translatedText}
                                </p>
                                {source === "libretranslate" && (
                                    <div className="flex shrink-0 items-center justify-center text-amber-500 cursor-help group relative">
                                        <AlertCircle className="w-4 h-4" />
                                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-popover border rounded shadow-lg text-[10px] normal-case text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                            Google Translate is currently unavailable. Using degraded backup translation.
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Alternative translations */}
                            {alternatives && alternatives.length > 0 && (
                                <div className="space-y-1 pt-1 border-t border-border/50">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                                        Alternatives
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {alternatives.map((alt, i) => (
                                            <span
                                                key={i}
                                                className="text-[13px] px-2 py-0.5 bg-muted/50 rounded-full text-muted-foreground border border-border/50"
                                            >
                                                {alt}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
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
