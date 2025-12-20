import { useMemo, useCallback, useState, useEffect } from "react";
import { tokenize } from "@/lib/tokenizer";
import { useWordSelection } from "@/hooks/use-word-selection";
import { useTranslation } from "@/hooks/use-translation";
import { WordSpan } from "@/components/word-span";
import { TranslationPopup } from "@/components/translation-popup";

interface TextDisplayProps {
    text: string;
    targetLanguage?: string;
}

export function TextDisplay({ text, targetLanguage = "en" }: TextDisplayProps) {
    const tokens = useMemo(() => tokenize(text), [text]);

    const {
        selection,
        handleWordClick,
        clearSelection,
        getSelectedText,
        isWordSelected,
    } = useWordSelection();

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
            translate(selectedText);
        }
    }, [selectedText, translate]);

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

    return (
        <div className="relative" data-text-display>
            {/* Text with clickable words */}
            <div className="text-lg leading-relaxed">
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
                        isLoading={isLoading}
                        error={error}
                        position={popupPosition}
                        onClose={handleClosePopup}
                    />
                </div>
            )}
        </div>
    );
}
