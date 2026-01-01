import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const LANGUAGES = [
    { code: "auto", name: "Auto-detect" },
    { code: "ar", name: "Arabic", rtl: true },
    { code: "zh", name: "Chinese" },
    { code: "en", name: "English" },
    { code: "ru", name: "Russian" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const RTL_LANGUAGES = ["ar", "fa"];

export function isRTL(languageCode: string): boolean {
    return RTL_LANGUAGES.includes(languageCode);
}

export function getLanguageName(code: string): string {
    const lang = LANGUAGES.find((l) => l.code === code);
    return lang?.name || code;
}

interface LanguageSelectorProps {
    value: string;
    onChange: (value: string) => void;
    isDetecting?: boolean;
    disabled?: boolean;
    showAuto?: boolean;
}

export function LanguageSelector({ value, onChange, isDetecting, disabled, showAuto = true }: LanguageSelectorProps) {
    const filteredLanguages = showAuto ? LANGUAGES : LANGUAGES.filter(lang => lang.code !== 'auto');

    return (
        <div className="flex items-center gap-2">
            <Select value={value} onValueChange={(val) => val && onChange(val)} disabled={disabled}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {filteredLanguages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {isDetecting && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Detecting...</span>
                </div>
            )}
        </div>
    );
}
