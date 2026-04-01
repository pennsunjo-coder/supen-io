import { useState, useRef } from "react";
import {
  FileText,
  Globe,
  StickyNote,
  Plus,
  Upload,
  Link2,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sanitizeInput } from "@/lib/security";
import type { Source } from "@/types/database";

interface SourcePanelProps {
  sources: Source[];
  loading: boolean;
  onAddUrl: (url: string) => Promise<{ error: string | null }>;
  onAddNote: (title: string, content: string) => Promise<{ error: string | null }>;
  onAddPdf: (file: File) => Promise<{ error: string | null }>;
  onRemove: (source: Source) => Promise<{ error: string | null }>;
}

const typeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  url: Globe,
  note: StickyNote,
};

const typeLabels: Record<string, string> = {
  pdf: "PDF",
  url: "Lien",
  note: "Note",
};

type AddMode = null | "url" | "note";

const SourcePanel = ({
  sources,
  loading,
  onAddUrl,
  onAddNote,
  onAddPdf,
  onRemove,
}: SourcePanelProps) => {
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [urlInput, setUrlInput] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setAddMode(null);
    setUrlInput("");
    setNoteTitle("");
    setNoteContent("");
    setError(null);
  };

  const handleAddUrl = async () => {
    const cleaned = urlInput.trim();
    if (!cleaned) return;

    // Validation basique de l'URL
    try {
      new URL(cleaned);
    } catch {
      setError("URL invalide. Utilise un format comme https://exemple.com");
      return;
    }

    setSaving(true);
    setError(null);
    const result = await onAddUrl(cleaned);
    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      resetForm();
    }
  };

  const handleAddNote = async () => {
    const title = sanitizeInput(noteTitle, 200);
    const content = sanitizeInput(noteContent, 10000);
    if (!title || !content) {
      setError("Le titre et le contenu sont requis.");
      return;
    }

    setSaving(true);
    setError(null);
    const result = await onAddNote(title, content);
    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      resetForm();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Seuls les fichiers PDF sont acceptés.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Le fichier ne doit pas dépasser 10 Mo.");
      return;
    }

    setSaving(true);
    setError(null);
    const result = await onAddPdf(file);
    setSaving(false);

    if (result.error) {
      setError(result.error);
    }

    // Reset le file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = async (source: Source) => {
    setDeletingId(source.id);
    await onRemove(source);
    setDeletingId(null);
  };

  return (
    <div className="w-72 flex flex-col shrink-0">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Sources</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sources.length} élément{sources.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 pb-3 flex gap-1.5">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-border/40 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:border-border transition-all disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" />
          PDF
        </button>
        <button
          onClick={() => { resetForm(); setAddMode("url"); }}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-border/40 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:border-border transition-all disabled:opacity-50"
        >
          <Link2 className="w-3.5 h-3.5" />
          URL
        </button>
        <button
          onClick={() => { resetForm(); setAddMode("note"); }}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-border/40 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:border-border transition-all disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          Note
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Inline form */}
      {addMode && (
        <div className="mx-4 mb-3 p-3 rounded-lg border border-border/40 bg-accent/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">
              {addMode === "url" ? "Ajouter un lien" : "Ajouter une note"}
            </span>
            <button
              onClick={resetForm}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {addMode === "url" && (
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
              placeholder="https://exemple.com/article"
              autoFocus
              className="w-full bg-background border border-border/30 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          )}

          {addMode === "note" && (
            <>
              <input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Titre de la note"
                autoFocus
                maxLength={200}
                className="w-full bg-background border border-border/30 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Contenu..."
                rows={3}
                maxLength={10000}
                className="w-full bg-background border border-border/30 rounded-md px-2.5 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </>
          )}

          {error && (
            <p className="text-[11px] text-destructive">{error}</p>
          )}

          <Button
            size="sm"
            className="w-full h-7 text-xs"
            disabled={saving}
            onClick={addMode === "url" ? handleAddUrl : handleAddNote}
          >
            {saving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              "Ajouter"
            )}
          </Button>
        </div>
      )}

      {/* Saving indicator for PDF */}
      {saving && !addMode && (
        <div className="mx-4 mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Upload en cours...
        </div>
      )}

      <div className="mx-4 h-px bg-border/30" />

      {/* Source list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-accent/50 flex items-center justify-center mb-3">
              <StickyNote className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Aucune source
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">
              Ajoute des fichiers, liens ou notes pour commencer ton analyse
            </p>
          </div>
        ) : (
          sources.map((source) => {
            const Icon = typeIcons[source.type] || StickyNote;
            const isDeleting = deletingId === source.id;
            return (
              <div
                key={source.id}
                className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left text-muted-foreground hover:text-foreground hover:bg-accent/40"
              >
                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-accent/60 text-muted-foreground group-hover:text-foreground transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block truncate text-sm">{source.title}</span>
                  <span className="block text-[11px] text-muted-foreground/50 mt-0.5">
                    {typeLabels[source.type] || "Note"}
                  </span>
                </div>
                <button
                  onClick={() => handleRemove(source)}
                  disabled={isDeleting}
                  className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded text-muted-foreground/50 hover:text-destructive transition-all"
                  title="Supprimer"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SourcePanel;
