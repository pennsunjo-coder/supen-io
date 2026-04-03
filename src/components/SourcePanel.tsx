import { useState, useRef, DragEvent } from "react";
import {
  FileText,
  Globe,
  StickyNote,
  Upload,
  Link2,
  Search,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sanitizeInput } from "@/lib/security";
import type { Source } from "@/types/database";

interface SourcePanelProps {
  sources: Source[];
  loading: boolean;
  activeSourceIds: Set<string>;
  onToggleSource: (id: string) => void;
  onAddUrl: (url: string) => Promise<{ error: string | null }>;
  onAddNote: (title: string, content: string) => Promise<{ error: string | null }>;
  onAddPdf: (file: File) => Promise<{ error: string | null }>;
  onSearchWeb: (query: string) => Promise<{ error: string | null }>;
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

type FormMode = "url" | "note" | "search";

const SourcePanel = ({
  sources,
  loading,
  activeSourceIds,
  onToggleSource,
  onAddUrl,
  onAddNote,
  onAddPdf,
  onSearchWeb,
  onRemove,
}: SourcePanelProps) => {
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("url");
  const [urlValue, setUrlValue] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const noteTitleRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const activeCount = activeSourceIds.size;

  const openForm = (mode: FormMode) => {
    setUrlValue("");
    setNoteTitle("");
    setNoteContent("");
    setSearchQuery("");
    setError(null);
    setFormMode(mode);
    setShowForm(true);
    requestAnimationFrame(() => {
      if (mode === "url") urlRef.current?.focus();
      if (mode === "note") noteTitleRef.current?.focus();
      if (mode === "search") searchRef.current?.focus();
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setError(null);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      let result: { error: string | null };

      if (formMode === "url") {
        const cleaned = urlValue.trim();
        if (!cleaned) { setSaving(false); return; }
        try { new URL(cleaned); } catch {
          setError("URL invalide (ex: https://exemple.com)");
          setSaving(false);
          return;
        }
        result = await onAddUrl(cleaned);
      } else if (formMode === "note") {
        const title = sanitizeInput(noteTitle, 200);
        const content = sanitizeInput(noteContent, 10000);
        if (!title || !content) {
          setError("Titre et contenu requis.");
          setSaving(false);
          return;
        }
        result = await onAddNote(title, content);
      } else {
        const q = searchQuery.trim();
        if (!q) { setSaving(false); return; }
        result = await onSearchWeb(q);
      }

      if (result.error) {
        setError(result.error);
      } else {
        closeForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setSaving(false);
    }
  };

  const importPdf = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Seuls les fichiers PDF sont acceptés.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 10 Mo.");
      return;
    }

    setPdfLoading(true);
    toast("Extraction du PDF en cours...");
    try {
      const result = await onAddPdf(file);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("PDF importé avec succès !");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setPdfLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importPdf(file);
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      importPdf(file);
    } else if (file) {
      toast.error("Seuls les fichiers PDF sont acceptés.");
    }
  };

  const handleRemove = async (source: Source) => {
    setDeletingId(source.id);
    try { await onRemove(source); } finally { setDeletingId(null); }
  };

  const actions: { mode: FormMode | "pdf"; icon: typeof Globe; label: string }[] = [
    { mode: "pdf", icon: Upload, label: "PDF" },
    { mode: "url", icon: Link2, label: "URL" },
    { mode: "note", icon: StickyNote, label: "Note" },
    { mode: "search", icon: Search, label: "Web" },
  ];

  const formLabels: Record<FormMode, string> = {
    url: "Ajouter un lien",
    note: "Ajouter une note",
    search: "Recherche web",
  };

  return (
    <div className="w-[250px] flex flex-col border-r border-border/20">
      {/* Header */}
      <div className="px-5 py-4 shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Sources</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {sources.length} élément{sources.length !== 1 ? "s" : ""}
          {activeCount > 0 && (
            <span className="text-primary"> · {activeCount} active{activeCount > 1 ? "s" : ""}</span>
          )}
        </p>
      </div>

      {/* 4 action buttons */}
      <div className="px-4 pb-3 grid grid-cols-4 gap-1.5 shrink-0">
        {actions.map(({ mode, icon: Icon, label }) => {
          const isActive = showForm && formMode === mode;
          const isPdf = mode === "pdf";
          const isPdfBusy = isPdf && pdfLoading;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => {
                if (isPdf) {
                  fileRef.current?.click();
                } else {
                  if (isActive) closeForm();
                  else openForm(mode as FormMode);
                }
              }}
              disabled={saving || pdfLoading}
              className={cn(
                "flex flex-col items-center gap-1 px-1 py-2 rounded-lg border text-[11px] font-medium transition-all disabled:opacity-50",
                isPdfBusy
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:border-border/60"
              )}
            >
              {isPdfBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
              {isPdfBusy ? "Import..." : label}
            </button>
          );
        })}
      </div>

      <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />

      {/* Form */}
      <div className={cn("mx-4 mb-3 p-3 rounded-lg border border-border/40 bg-card shrink-0", showForm ? "block" : "hidden")}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-foreground">{formLabels[formMode]}</span>
          <button type="button" onClick={closeForm} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className={formMode === "url" ? "block" : "hidden"}>
          <input ref={urlRef} value={urlValue} onChange={(e) => setUrlValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="https://exemple.com/article" className="w-full bg-accent/30 border border-border/30 rounded-md px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 mb-2" />
        </div>

        <div className={formMode === "note" ? "block" : "hidden"}>
          <input ref={noteTitleRef} value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Titre de la note" maxLength={200} className="w-full bg-accent/30 border border-border/30 rounded-md px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 mb-2" />
          <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Contenu..." rows={3} maxLength={10000} className="w-full bg-accent/30 border border-border/30 rounded-md px-2.5 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 mb-2" />
        </div>

        <div className={formMode === "search" ? "block" : "hidden"}>
          <input ref={searchRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="Rechercher sur le web..." className="w-full bg-accent/30 border border-border/30 rounded-md px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 mb-2" />
        </div>

        {error && <p className="text-[11px] text-destructive mb-2">{error}</p>}

        <Button type="button" size="sm" className="w-full h-7 text-xs" disabled={saving} onClick={handleSubmit}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : formMode === "search" ? "Rechercher" : "Ajouter"}
        </Button>
      </div>

      {saving && !showForm && (
        <div className="mx-4 mb-3 flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <Loader2 className="w-3 h-3 animate-spin" /> Upload en cours...
        </div>
      )}

      <div className="mx-4 h-px bg-border/30 shrink-0" />

      {/* Source list */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-3 space-y-0.5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : sources.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center py-12 px-4 text-center mx-3 my-3 rounded-xl border-2 border-dashed transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-border/30",
            )}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
          >
            <div className="w-12 h-12 rounded-xl bg-accent/50 flex items-center justify-center mb-3">
              <Upload className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Aucune source</p>
            <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">Glisse un PDF ici ou utilise les boutons ci-dessus</p>
            <p className="text-[10px] text-muted-foreground/40 mt-2">Max 10 MB</p>
          </div>
        ) : (
          sources.map((source) => {
            const Icon = typeIcons[source.type] || StickyNote;
            const isDeleting = deletingId === source.id;
            const isActive = activeSourceIds.has(source.id);
            return (
              <div
                key={source.id}
                className={cn(
                  "group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all",
                  isActive
                    ? "bg-primary/5 border border-primary/20"
                    : "hover:bg-accent/40 border border-transparent",
                )}
              >
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => onToggleSource(source.id)}
                  className={cn(
                    "w-8 h-4.5 rounded-full p-0.5 transition-colors shrink-0 flex items-center",
                    isActive ? "bg-primary" : "bg-accent/60",
                  )}
                  title={isActive ? "Désactiver" : "Activer"}
                >
                  <div className={cn(
                    "w-3.5 h-3.5 rounded-full bg-white transition-transform",
                    isActive ? "translate-x-3.5" : "translate-x-0",
                  )} />
                </button>

                <div className={cn(
                  "w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors",
                  isActive ? "bg-primary/15 text-primary" : "bg-accent/60 text-muted-foreground",
                )}>
                  <Icon className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn("block truncate text-xs", isActive ? "text-foreground" : "text-muted-foreground")}>
                    {source.title}
                  </span>
                  <span className="block text-[10px] text-muted-foreground/50">
                    {typeLabels[source.type] || "Note"}
                    {source.content && source.content.length > 0 && (
                      <span> · {Math.ceil(source.content.split(/\s+/).length)} mots</span>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(source)}
                  disabled={isDeleting}
                  className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded text-muted-foreground/50 hover:text-destructive transition-all"
                  title="Supprimer"
                >
                  {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
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
