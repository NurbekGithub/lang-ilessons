import { useMemo, useCallback, useState, useEffect } from "react";
import { tokenize } from "@/lib/tokenizer";
import { useWordSelection } from "@/hooks/use-word-selection";
import { useTranslation } from "@/hooks/use-translation";
import { useSession } from "@/lib/auth-client";
import { WordSpan } from "@/components/word-span";
import { TranslationPopup } from "@/components/translation-popup";
import { isRTL } from "@/components/language-selector";

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

    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
    const [showPopup, setShowPopup] = useState(false);

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

    // Handle word click - track position for popup
    const onWordClick = useCallback(
        (wordIndex: number, event: React.MouseEvent) => {
            const rect = (event.target as HTMLElement).getBoundingClientRect();
            setPopupPosition({
                x: rect.left + window.scrollX,
                y: rect.bottom + window.scrollY,
            });
            setShowPopup(true);
            handleWordClick(wordIndex);
        },
        [handleWordClick]
    );

    // Close popup and clear selection
    const handleClosePopup = useCallback(() => {
        setShowPopup(false);
        clearSelection();
        clearResult();
    }, [clearSelection, clearResult]);

    // Save to vocabulary via API
    const handleSaveToVocabulary = useCallback(
        async (originalText: string, translatedText: string) => {
            if (!session?.user?.id) {
                throw new Error("Please sign in to save words");
            }

            const response = await fetch("/api/vocabulary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: session.user.id,
                    originalText,
                    translatedText,
                    sourceLanguage: sourceLanguage === "auto" ? undefined : sourceLanguage,
                    targetLanguage,
                    context: text.length <= 200 ? text : undefined,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save to vocabulary");
            }
        },
        [session?.user?.id, targetLanguage, text, sourceLanguage]
    );

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest("[data-text-display]") && !target.closest("[data-popup]")) {
                handleClosePopup();
            }
        };

        if (showPopup) {
            document.addEventListener("click", handleClickOutside);
            return () => document.removeEventListener("click", handleClickOutside);
        }
    }, [showPopup, handleClosePopup]);

    const rtl = useMemo(() => isRTL(sourceLanguage), [sourceLanguage]);

    return (
        <div className="relative" data-text-display>
            {/* Text with clickable words */}
            <div
                className={`text-lg leading-relaxed ${rtl ? "text-right" : "text-left"}`}
                dir={rtl ? "rtl" : "ltr"}
            >
                {tokens.map((token) => {
                    if (token.type === "word") {
                        return (
                            <WordSpan
                                key={token.index}
                                word={token.value}
                                index={token.index}
                                isSelected={isWordSelected(token.index)}
                                onClick={onWordClick}
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
            {showPopup && selectedText && (
                <div data-popup>
                    <TranslationPopup
                        originalText={selectedText}
                        translatedText={result?.translatedText}
                        source={result?.source}
                        alternatives={result?.alternatives}
                        isLoading={isLoading}
                        error={error}
                        position={popupPosition}
                        onClose={handleClosePopup}
                        onSaveToVocabulary={session?.user ? handleSaveToVocabulary : undefined}
                    />
                </div>
            )}
        </div>
    );
}
