import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Edit2, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextDisplay } from "@/components/text-display";
import { TextInput } from "@/components/text-input";
import { deleteTextFn, getTextByIdFn, updateTextFn } from "@/server-fns/texts";

export const Route = createFileRoute("/texts/$textId")({
  loader: async ({ params }) => {
    const text = await getTextByIdFn({ data: { id: params.textId } });
    if (!text) {
      throw new Error("Text not found");
    }
    return { text };
  },
  component: TextDetailsPage,
});

function TextDetailsPage() {
  const { textId } = Route.useParams();
  const { text } = Route.useLoaderData();
  const [isEditing, setIsEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const targetLanguage = "en";
  const updateText = useServerFn(updateTextFn);
  const deleteText = useServerFn(deleteTextFn);

  const handleBack = () => {
    navigate({ to: "/" });
  };

  const handleUpdate = async (updatedText: string, language: string) => {
    try {
      await updateText({
        data: {
          id: textId,
          content: updatedText,
          sourceLanguage: language === "auto" ? undefined : language,
        },
      });
      setIsEditing(false);
      // The route will automatically refetch the loader data
      window.location.reload();
    } catch (err) {
      console.error("Failed to update text:", err);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this text?")) {
      return;
    }

    setDeleting(true);
    try {
      await deleteText({ data: { id: textId } });
      navigate({ to: "/" });
    } catch (err) {
      console.error("Failed to delete text:", err);
    } finally {
      setDeleting(false);
    }
  };

  if (!text) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Text not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2 h-8"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive h-8 w-8"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Edit Text</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
              <TextInput
                onSubmit={handleUpdate}
                initialText={text.content}
                initialLanguage={text.sourceLanguage || "auto"}
                submitLabel="Update Text"
              />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Tap on words to translate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TextDisplay
                  text={text.content}
                  sourceLanguage={text.sourceLanguage || "auto"}
                  targetLanguage={targetLanguage}
                />
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
