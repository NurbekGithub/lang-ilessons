export interface Token {
    type: "word" | "whitespace" | "punctuation";
    value: string;
    index: number; // Position in original token array
}

/**
 * Tokenizes text into words, whitespace, and punctuation.
 * Handles multiple languages including CJK characters.
 */
export function tokenize(text: string): Array<Token> {
    const tokens: Array<Token> = [];

    // Regex to match words (including non-Latin scripts), whitespace, or punctuation
    // Uses Unicode categories:
    // - \p{L} = Letters (any language)
    // - \p{N} = Numbers
    // - \p{M} = Marks (diacritics, etc.)
    // - \s = Whitespace
    // - Everything else is punctuation
    const regex = /[\p{L}\p{N}\p{M}]+|[\s]+|[^\p{L}\p{N}\p{M}\s]+/gu;

    let match;
    let index = 0;

    while ((match = regex.exec(text)) !== null) {
        const value = match[0];
        let type: Token["type"];

        if (/^[\s]+$/.test(value)) {
            type = "whitespace";
        } else if (/^[\p{L}\p{N}\p{M}]+$/u.test(value)) {
            type = "word";
        } else {
            type = "punctuation";
        }

        tokens.push({ type, value, index });
        index++;
    }

    return tokens;
}

/**
 * Gets only the word tokens from a token array, with their original indices
 */
export function getWordTokens(tokens: Array<Token>): Array<Token> {
    return tokens.filter((t) => t.type === "word");
}

/**
 * Rebuilds the text from tokens, optionally extracting a range
 */
export function tokensToText(tokens: Array<Token>, startIndex?: number, endIndex?: number): string {
    const start = startIndex ?? 0;
    const end = endIndex ?? tokens.length - 1;

    return tokens
        .filter((t) => t.index >= start && t.index <= end)
        .map((t) => t.value)
        .join("");
}
