import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { tokenize } from "@/lib/tokenizer";
import { useWordSelection } from "@/hooks/use-word-selection";
import { useTranslation } from "@/hooks/use-translation";
import { useSession } from "@/lib/auth-client";
import { WordSpan } from "@/components/word-span";
import { TranslationPopup } from "@/components/translation-popup";
import { isRTL } from "@/components/language-selector";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { addVocabularyItemFn } from "@/server-fns/vocabulary";

interface TextDisplayProps {
    text: string;
    sourceLanguage?: string;
    targetLanguage?: string;
}

export function TextDisplay({
    text,
    sourceLanguage = "auto",
    targetLanguage = "en"
}: TextDisplayProps) {
    const tokens = useMemo(() => tokenize(text), [text]);
    const { data: session } = useSession();

    const {
        selection,
        handleWordClick,
        clearSelection,
        getSelectedText,
        isWordSelected,
    } = useWordSelection();

    // Passing sourceLanguage to useTranslation if it's not "auto"
    const { translate, isLoading, error, result, clearResult } = useTranslation({
        targetLanguage,
    });

    const [showPopup, setShowPopup] = useState(false);
    const [activeTriggerId, setActiveTriggerId] = useState<string | null>(null);
    const addVocabularyItem = useServerFn(addVocabularyItemFn);

    // Get the currently selected text
    const selectedText = useMemo(() => {
        if (!selection) return "";
        return getSelectedText(tokens);
    }, [selection, tokens, getSelectedText]);

    // Trigger translation when selection changes
    useEffect(() => {
        if (selectedText) {
            // Use the provided sourceLanguage or "auto"
            translate(selectedText, sourceLanguage);
        }
    }, [selectedText, translate, sourceLanguage]);

    // Handle word click
    const onWordClick = useCallback(
        (wordIndex: number) => {
            setActiveTriggerId(`word-${wordIndex}`);
            setShowPopup(true);
            handleWordClick(wordIndex);
        },
        [handleWordClick]
    );

    // Close popup and clear selection
    const handleClosePopup = useCallback(() => {
        setShowPopup(false);
        setActiveTriggerId(null);
        clearSelection();
        clearResult();
    }, [clearSelection, clearResult]);

    // Save to vocabulary via API
    const handleSaveToVocabulary = useCallback(
        async (originalText: string, translatedText: string) => {
            if (!session?.user.id) {
                throw new Error("Please sign in to save words");
            }

            await addVocabularyItem({
                data: {
                    userId: session.user.id,
                    originalText,
                    translatedText,
                    sourceLanguage: sourceLanguage === "auto" ? undefined : sourceLanguage,
                    targetLanguage,
                    context: text.length <= 200 ? text : undefined,
                },
            });
        },
        [session?.user.id, targetLanguage, text, sourceLanguage, addVocabularyItem]
    );

    // Simple open change handler
    const onOpenChange = useCallback((open: boolean) => {
        if (!open) {
            handleClosePopup();
        } else {
            setShowPopup(true);
        }
    }, [handleClosePopup]);

    const rtl = useMemo(() => isRTL(sourceLanguage), [sourceLanguage]);

    return (
        <Popover open={showPopup} onOpenChange={onOpenChange} triggerId={activeTriggerId}>
            <div className="relative" data-text-display>
                {/* Text with clickable words */}
                <div
                    className={`text-lg pb-72 leading-relaxed ${rtl ? "text-right" : "text-left"}`}
                    dir={rtl ? "rtl" : "ltr"}
                >
                    {tokens.map((token) => {
                        if (token.type === "word") {
                            return (
                                <PopoverTrigger
                                    key={token.index}
                                    id={`word-${token.index}`}
                                    nativeButton={false}
                                    render={(props) => (
                                        <WordSpan
                                            {...props}
                                            word={token.value}
                                            index={token.index}
                                            isSelected={isWordSelected(token.index)}
                                            onClick={onWordClick}
                                        />
                                    )}
                                />
                            );
                        }
                        // Render whitespace and punctuation as-is
                        return (
                            <span key={token.index} className="whitespace-pre-wrap">
                                {token.value}
                            </span>
                        );
                    })}
                </div>

                {/* Translation Popup */}
                {selectedText && (
                    <TranslationPopup
                        originalText={selectedText}
                        translatedText={result?.translatedText}
                        sourceLanguage={result?.sourceLanguage || sourceLanguage}
                        source={result?.source}
                        alternatives={result?.alternatives}
                        isLoading={isLoading}
                        error={error}
                        onSaveToVocabulary={session?.user ? handleSaveToVocabulary : undefined}
                    />
                )}
            </div>
        </Popover>
    );
}
