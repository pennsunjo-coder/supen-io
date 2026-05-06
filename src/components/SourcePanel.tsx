import { useState, useRef, DragEvent } from "react";
import {
  FileText,
  Globe,
  StickyNote,
  Upload,
  Search,
  Trash2,
  Loader2,
  X,
  Lightbulb,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sanitizeInput } from "@/lib/security";
import type { GroupedSource } from "@/hooks/use-sources";

interface SourcePanelProps {
  groupedSources: GroupedSource[];
  loading: boolean;
  activeSourceIds: Set<string>;
  onToggleGroup: (ids: string[]) => void;
  onAddUrl?: (url: string) => Promise<{ error: string | null }>;
  onAddNote: (title: string, content: string) => Promise<{ error: string | null }>;
  onAddPdf: (file: File) => Promise<{ error: string | null }>;
  onSearchWeb: (query: string) => Promise<{ error: string | null }>;
  onRemoveGroup: (group: GroupedSource) => Promise<{ error: string | null }>;
}

const typeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  url: Globe,
  note: StickyNote,
};

const typeLabels: Record<string, string> = {
  pdf: "PDF",
  url: "Link",
  note: "Note",
};

type FormMode = "note" | "search";

const SourcePanel = ({
  groupedSources,
  loading,
  activeSourceIds,
  onToggleGroup,
  onAddUrl,
  onAddNote,
  onAddPdf,
  onSearchWeb,
  onRemoveGroup,
}: SourcePanelProps) => {
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("note");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editingDirective, setEditingDirective] = useState<string | null>(null);
  const [directiveText, setDirectiveText] = useState("");
  const [savingDirective, setSavingDirective] = useState(false);

  async function saveDirective(groupId: string, ids: string[], text: string) {
    setSavingDirective(true);
    try {
      await supabase.from("sources").update({ directive: text }).in("id", ids);
      toast.success(text ? "Focus instruction saved" : "Focus instruction removed");
    } catch { /* column may not exist */ }
    setEditingDirective(null);
    setSavingDirective(false);
  }
  const fileRef = useRef<HTMLInputElement>(null);
  const noteTitleRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const activeCount = activeSourceIds.size;

  const openForm = (mode: FormMode) => {
    setNoteTitle("");
    setNoteContent("");
    setSearchQuery("");
    setError(null);
    setFormMode(mode);
    setShowForm(true);
    requestAnimationFrame(() => {
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

      if (formMode === "note") {
        const title = sanitizeInput(noteTitle, 200);
        const content = sanitizeInput(noteContent, 10000);
        if (!title || !content) {
          setError("Title and content required.");
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
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  const importPdf = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are accepted.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must not exceed 10 MB.");
      return;
    }

    setPdfLoading(true);
    const sizeKb = Math.round(file.size / 1024);
    const loadingToast = toast.loading(`Extracting PDF... (${sizeKb} KB)`);
    try {
      const result = await onAddPdf(file);
      toast.dismiss(loadingToast);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`PDF imported successfully — "${file.name}"`);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err instanceof Error ? err.message : "Unexpected error");
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
      toast.error("Only PDF files are accepted.");
    }
  };

  // handleRemove removed — we use onRemoveGroup directly in the JSX

  const actions: { mode: FormMode | "pdf"; icon: typeof Globe; label: string }[] = [
    { mode: "pdf", icon: Upload, label: "PDF" },
    { mode: "note", icon: StickyNote, label: "Note" },
    { mode: "search", icon: Search, label: "Web" },
  ];

  const formLabels: Record<FormMode, string> = {
    note: "Add a note",
    search: "Web search",
  };

  return (
    <div className="w-full flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-border/20 shrink-0">
        <h2 className="text-base font-semibold text-foreground">Sources</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {groupedSources.length} source{groupedSources.length !== 1 ? "s" : ""}
          {activeCount > 0 && (
            <span className="text-primary"> · {activeCount} active{activeCount > 1 ? "s" : ""}</span>
          )}
        </p>
      </div>

      {/* 3 action buttons — pr keeps the Web button away from the right border */}
      <div className="pl-4 pr-5 pb-3 grid grid-cols-3 gap-2 shrink-0">
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
                "flex flex-col items-center gap-1 px-1 py-3 md:py-2 rounded-lg border text-[11px] font-medium transition-all disabled:opacity-50 active:scale-95",
                isPdfBusy
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:border-border/60"
              )}
            >
              {isPdfBusy ? <Loader2 className="w-5 h-5 md:w-4 md:h-4 animate-spin" /> : <Icon className="w-5 h-5 md:w-4 md:h-4" />}
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

        <div className={formMode === "note" ? "block" : "hidden"}>
          <input ref={noteTitleRef} value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Note title" maxLength={200} className="w-full bg-accent/30 border border-border/30 rounded-md px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 mb-2" />
          <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Content..." rows={3} maxLength={10000} className="w-full bg-accent/30 border border-border/30 rounded-md px-2.5 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 mb-2" />
        </div>

        <div className={formMode === "search" ? "block" : "hidden"}>
          <input ref={searchRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="Search the web..." className="w-full bg-accent/30 border border-border/30 rounded-md px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 mb-2" />
        </div>

        {error && <p className="text-[11px] text-destructive mb-2">{error}</p>}

        <Button type="button" size="sm" className="w-full h-7 text-xs" disabled={saving} onClick={handleSubmit}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : formMode === "search" ? "Search" : "Add"}
        </Button>
      </div>

      {saving && !showForm && (
        <div className="mx-4 mb-3 flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
        </div>
      )}

      <div className="mx-4 h-px bg-border/30 shrink-0" />

      {/* Source list */}
      <div
        className={cn(
          "flex-1 overflow-y-auto min-h-0 px-3 py-3 space-y-0.5 transition-all",
          dragOver && groupedSources.length > 0 && "border-2 border-dashed border-primary/40",
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : groupedSources.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center py-12 px-4 text-center mx-3 my-3 rounded-xl border-2 border-dashed transition-colors cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02]",
              dragOver ? "border-primary bg-primary/5" : "border-border/30",
            )}
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
          >
            <div className="w-12 h-12 rounded-xl bg-accent/50 flex items-center justify-center mb-3">
              <Upload className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No sources</p>
            <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">Click or drag a PDF here</p>
            <p className="text-[10px] text-muted-foreground/40 mt-2">Max 10 MB</p>
          </div>
        ) : (
          groupedSources.map((group) => {
            const Icon = typeIcons[group.type] || StickyNote;
            const isDeleting = deletingId === group.id;
            const isActive = group.ids.every((gid) => activeSourceIds.has(gid));
            return (
              <div
                key={group.id}
                className={cn(
                  "group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all",
                  isActive
                    ? "bg-primary/5 border border-primary/20"
                    : "hover:bg-accent/40 border border-transparent",
                )}
              >
                <button
                  type="button"
                  onClick={() => onToggleGroup(group.ids)}
                  className={cn(
                    "w-8 h-4.5 rounded-full p-0.5 transition-colors shrink-0 flex items-center",
                    isActive ? "bg-primary" : "bg-accent/60",
                  )}
                  title={isActive ? "Deactivate" : "Activate"}
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
                  <span className={cn("block truncate text-[13px]", isActive ? "text-foreground" : "text-muted-foreground")}>
                    {group.title}
                  </span>
                  <span className="block text-[11px] text-muted-foreground/50">
                    {typeLabels[group.type] || "Note"}
                    {group.chunkCount > 1 && <span> · {group.chunkCount} parts</span>}
                    {group.wordCount > 0 && <span> · {group.wordCount} words</span>}
                  </span>
                  {isActive && group.directive ? (
                    <button onClick={() => { setEditingDirective(group.id); setDirectiveText(group.directive || ""); }} className="flex items-center gap-1 mt-0.5 text-[10px] text-amber-400/80 hover:text-amber-400 transition-colors truncate">
                      <Lightbulb className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{group.directive}</span>
                    </button>
                  ) : isActive ? (
                    <button onClick={() => { setEditingDirective(group.id); setDirectiveText(""); }} className="text-[10px] text-muted-foreground/40 hover:text-primary transition-colors mt-0.5">
                      + Add focus instruction
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => { setDeletingId(group.id); onRemoveGroup(group).finally(() => setDeletingId(null)); }}
                  disabled={isDeleting}
                  className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded text-muted-foreground/50 hover:text-destructive transition-all"
                  title="Delete"
                >
                  {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Directive editor modal */}
      {editingDirective && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={() => setEditingDirective(null)}>
          <div className="bg-card border border-border/30 rounded-2xl p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-sm mb-1">What should the AI focus on?</h3>
            <p className="text-xs text-muted-foreground mb-4">Guide the AI to create content about a specific topic from this document.</p>
            <textarea
              autoFocus
              value={directiveText}
              onChange={(e) => setDirectiveText(e.target.value)}
              placeholder={"Examples:\n- Focus on LinkedIn growth strategies\n- Extract key statistics and data points\n- Summarize the monetization methods"}
              className="w-full text-sm rounded-xl border border-border/20 bg-accent/20 p-3 resize-none h-28 placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 mb-4"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 h-9" onClick={() => setEditingDirective(null)}>Cancel</Button>
              <Button size="sm" className="flex-1 h-9 gap-1.5" disabled={savingDirective} onClick={() => {
                const group = groupedSources.find((g) => g.id === editingDirective);
                if (group) saveDirective(group.id, group.ids, directiveText);
              }}>
                <Lightbulb className="w-3.5 h-3.5" /> Save Focus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SourcePanel;
