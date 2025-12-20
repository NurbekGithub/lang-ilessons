import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth-form";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/login")({
    component: LoginPage,
});

function LoginPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30 relative">
            {/* Theme Toggle */}
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            {/* Logo/Brand */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">LangLessons</h1>
                    <p className="text-sm text-muted-foreground">Learn any language</p>
                </div>
            </div>

            {/* Auth Form */}
            <AuthForm onSuccess={() => navigate({ to: "/" })} />

            {/* Footer */}
            <p className="mt-8 text-sm text-muted-foreground text-center max-w-sm">
                Paste text in any language, tap on words to translate. Build your
                vocabulary naturally.
            </p>
        </div>
    );
}
