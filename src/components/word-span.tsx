import { cn } from "@/lib/utils";

interface WordSpanProps {
    word: string;
    index: number;
    isSelected: boolean;
    onClick: (index: number, event: React.MouseEvent) => void;
}

export function WordSpan({ word, index, isSelected, onClick }: WordSpanProps) {
    return (
        <span
            role="button"
            tabIndex={0}
            onClick={(e) => onClick(index, e)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    onClick(index, e as unknown as React.MouseEvent);
                }
            }}
            className={cn(
                // Base styles
                "cursor-pointer rounded px-0.5 -mx-0.5 transition-all duration-150",
                // Touch-friendly tap target (at least 44px)
                "min-h-[44px] inline-flex items-center",
                // Hover state
                "hover:bg-primary/10",
                // Active/pressed state
                "active:scale-95",
                // Selected state
                isSelected && "bg-primary/20 text-primary font-medium"
            )}
        >
            {word}
        </span>
    );
}
