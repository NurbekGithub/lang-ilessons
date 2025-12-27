import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Languages, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { LanguageSelector, isRTL } from "@/components/language-selector";
import { useSession } from "@/lib/auth-client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TextInputProps {
    onSubmit: (text: string, language: string, isPublic?: boolean) => void;
    isLoading?: boolean;
    initialText?: string;
    initialLanguage?: string;
    isPublic?: boolean;
    submitLabel?: string;
    showPublicOption?: boolean;
}

export function TextInput({
    onSubmit,
    isLoading,
    initialText = "",
    initialLanguage = "auto",
    isPublic: initialIsPublic = false,
    submitLabel = "Start Learning",
    showPublicOption = true,
}: TextInputProps) {
    const { data: session } = useSession();
    const [text, setText] = useState(initialText);
    const [language, setLanguage] = useState(initialLanguage);
    const [isPublic, setIsPublic] = useState(initialIsPublic);
    const [isDetecting, setIsDetecting] = useState(false);
    const userManuallySelected = useRef(initialLanguage !== "auto");

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
            onSubmit(text.trim(), language, isPublic);
        }
    };

    const rtl = isRTL(language);

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
                    className={`min-h-[200px] md:min-h-[300px] text-base leading-relaxed resize-none ${rtl ? "text-right" : "text-left"}`}
                    dir={rtl ? "rtl" : "ltr"}
                    disabled={isLoading}
                />

                {/* Character count, Public option, and submit */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">
                            {text.length} characters
                        </span>
                        {session?.user && showPublicOption && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isPublic"
                                    checked={isPublic}
                                    onCheckedChange={(checked: boolean | "indeterminate") => setIsPublic(checked === true)}
                                />
                                <Label
                                    htmlFor="isPublic"
                                    className="text-sm font-medium leading-none cursor-pointer text-muted-foreground"
                                >
                                    Make Public
                                </Label>
                            </div>
                        )}
                    </div>
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
                                {submitLabel}
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
