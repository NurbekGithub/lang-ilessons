import { useState } from "react";
import { Loader2, X, BookmarkPlus, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    PopoverContent,
    PopoverTitle,
    PopoverDescription,
    PopoverClose,
} from "@/components/ui/popover";

interface TranslationPopupProps {
    originalText: string;
    translatedText?: string;
    source?: "google" | "libretranslate";
    alternatives?: string[];
    isLoading: boolean;
    error?: string | null;
    onSaveToVocabulary?: (originalText: string, translatedText: string) => Promise<void>;
}

export function TranslationPopup({
    originalText,
    translatedText,
    source,
    alternatives,
    isLoading,
    error,
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
        <PopoverContent
            className="w-72 bg-card/95 backdrop-blur-sm border-primary/20 p-4"
        >
            <PopoverTitle className="sr-only">Translation</PopoverTitle>
            <PopoverDescription className="sr-only">Translation details for {originalText}</PopoverDescription>

            <PopoverClose
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors z-10"
                aria-label="Close"
            >
                <X className="w-4 h-4 text-muted-foreground" />
            </PopoverClose>

            {/* Original text */}
            <div className="mb-3 pr-6 relative">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                    Original
                </p>
                <p className="font-medium text-foreground break-words leading-tight">
                    {originalText}
                </p>
            </div>

            {/* Separator */}
            <div className="h-px bg-border mb-3" />

            {/* Translation result */}
            <div className="min-h-[40px]">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                    Translation
                </p>

                {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground py-1">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-sm">Translating...</span>
                    </div>
                )}

                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}

                {!isLoading && !error && translatedText && (
                    <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-primary break-words leading-tight">
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
                                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                                    Alternatives
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {alternatives.map((alt, i) => (
                                        <span
                                            key={i}
                                            className="text-[12px] px-1.5 py-0.5 bg-muted/60 rounded text-muted-foreground border border-border/50"
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
                        variant={isSaved ? "secondary" : "default"}
                        size="sm"
                        className="w-full gap-2 h-8 text-xs font-medium transition-all"
                        onClick={handleSave}
                        disabled={isSaving || isSaved}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Saving...
                            </>
                        ) : isSaved ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-green-500" />
                                Saved
                            </>
                        ) : (
                            <>
                                <BookmarkPlus className="w-3.5 h-3.5" />
                                Save to Vocabulary
                            </>
                        )}
                    </Button>
                </>
            )}
        </PopoverContent>
    );
}

