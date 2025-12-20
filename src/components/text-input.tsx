import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Languages, ArrowRight, Loader2 } from "lucide-react";

interface TextInputProps {
    onSubmit: (text: string) => void;
    isLoading?: boolean;
}

export function TextInput({ onSubmit, isLoading }: TextInputProps) {
    const [text, setText] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onSubmit(text.trim());
        }
    };

    return (
        <Card className="p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Languages className="w-5 h-5" />
                    <span className="text-sm font-medium">Paste text in any language</span>
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
