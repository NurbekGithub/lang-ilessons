import { useState } from "react";
import { Loader2, X, BookmarkPlus, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    PopoverContent,
    PopoverTitle,
    PopoverDescription,
    PopoverArrow,
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
            <PopoverArrow className="data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
                <ArrowSvg />
            </PopoverArrow>

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

function ArrowSvg(props: React.ComponentProps<'svg'>) {
    return (
        <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
            {/* Arrow fill - matches popover background */}
            <path
                d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
                className="fill-card"
            />
            {/* Arrow border/stroke */}
            <path
                d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
                className="fill-border"
            />
            <path
                d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
                className="fill-border"
            />
        </svg>
    );
}
