import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Languages, ArrowRight, Loader2 } from "lucide-react";
import { LanguageSelector } from "@/components/language-selector";

interface TextInputProps {
    onSubmit: (text: string, language: string) => void;
    isLoading?: boolean;
}

export function TextInput({ onSubmit, isLoading }: TextInputProps) {
    const [text, setText] = useState("");
    const [language, setLanguage] = useState("auto");
    const [isDetecting, setIsDetecting] = useState(false);
    const userManuallySelected = useRef(false);

    // Simple debounce implementation
    const debouncedDetect = useCallback(
        (() => {
            let timeout: ReturnType<typeof setTimeout>;
            return (val: string) => {
                if (!val.trim() || userManuallySelected.current) return;
                clearTimeout(timeout);
                timeout = setTimeout(async () => {
                    setIsDetecting(true);
                    try {
                        const response = await fetch("/api/detect", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ text: val }),
                        });
                        if (response.ok) {
                            const data = await response.json();
                            if (data.language && !userManuallySelected.current) {
                                setLanguage(data.language);
                            }
                        }
                    } catch (err) {
                        console.error("Auto-detect failed:", err);
                    } finally {
                        setIsDetecting(false);
                    }
                }, 1000);
            };
        })(),
        []
    );

    useEffect(() => {
        if (text.length > 15 && !userManuallySelected.current) {
            debouncedDetect(text);
        }
    }, [text, debouncedDetect]);

    const handleLanguageChange = (val: string) => {
        setLanguage(val);
        if (val !== "auto") {
            userManuallySelected.current = true;
        } else {
            userManuallySelected.current = false;
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onSubmit(text.trim(), language);
        }
    };

    return (
        <Card className="p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Header with Language Selector */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Languages className="w-5 h-5 text-muted-foreground" />
                        <LanguageSelector
                            value={language}
                            onChange={handleLanguageChange}
                            isDetecting={isDetecting}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Textarea */}
                <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste or type your text here... You can use any language - English, Spanish, Chinese, Arabic, Japanese, and more."
                    className="min-h-[200px] md:min-h-[300px] text-base leading-relaxed resize-none"
                    disabled={isLoading}
                />

                {/* Character count and submit */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                        {text.length} characters
                    </span>
                    <Button
                        type="submit"
                        disabled={!text.trim() || isLoading}
                        className="gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Start Learning
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
