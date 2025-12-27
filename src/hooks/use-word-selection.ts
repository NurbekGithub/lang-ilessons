import { useCallback, useState } from "react";
import type { Token } from "@/lib/tokenizer";

export interface WordSelection {
    startIndex: number;
    endIndex: number;
}

export function useWordSelection() {
    const [selection, setSelection] = useState<WordSelection | null>(null);
    const [isRangeSelection, setIsRangeSelection] = useState(false);

    const handleWordClick = useCallback((wordIndex: number) => {
        setSelection((prev) => {
            if (prev === null) {
                // First click: select single word
                setIsRangeSelection(false);
                return { startIndex: wordIndex, endIndex: wordIndex };
            }

            if (!isRangeSelection) {
                // Second click (while one word is selected): create range
                const start = Math.min(prev.startIndex, wordIndex);
                const end = Math.max(prev.endIndex, wordIndex);
                setIsRangeSelection(true);
                return { startIndex: start, endIndex: end };
            }

            // Third click: reset and select new word
            setIsRangeSelection(false);
            return { startIndex: wordIndex, endIndex: wordIndex };
        });
    }, [isRangeSelection]);

    const clearSelection = useCallback(() => {
        setSelection(null);
        setIsRangeSelection(false);
    }, []);

    const getSelectedText = useCallback((tokens: Array<Token>): string => {
        if (!selection) return "";

        // Get all tokens between start and end word indices (inclusive)
        const wordTokens = tokens.filter((t) => t.type === "word");
        const startToken = wordTokens.find((t) => t.index === selection.startIndex);
        const endToken = wordTokens.find((t) => t.index === selection.endIndex);

        if (!startToken || !endToken) return "";

        // Get all tokens between the start and end token positions
        const startPos = tokens.findIndex((t) => t.index === startToken.index);
        const endPos = tokens.findIndex((t) => t.index === endToken.index);

        return tokens
            .slice(startPos, endPos + 1)
            .map((t) => t.value)
            .join("");
    }, [selection]);

    const isWordSelected = useCallback((wordIndex: number): boolean => {
        if (!selection) return false;
        return wordIndex >= selection.startIndex && wordIndex <= selection.endIndex;
    }, [selection]);

    return {
        selection,
        isRangeSelection,
        handleWordClick,
        clearSelection,
        getSelectedText,
        isWordSelected,
    };
}
