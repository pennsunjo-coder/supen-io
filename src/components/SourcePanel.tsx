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
    <div className="w-full flex flex-col h-full bg-sidebar-background">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border/40 shrink-0 bg-sidebar-background/80 backdrop-blur-md sticky top-0 z-10">
        <h2 className="text-sm font-display font-black tracking-widest uppercase text-foreground/80">Sources</h2>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-[11px] font-bold text-muted-foreground/50">
            {groupedSources.length} library items
          </p>
          {activeCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-black uppercase tracking-tighter">
              {activeCount} Active
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 grid grid-cols-3 gap-2.5 shrink-0 bg-sidebar-background/40">
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
                "flex flex-col items-center gap-1.5 px-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all duration-300 disabled:opacity-50 active:scale-95 shadow-sm hover:shadow-md",
                isPdfBusy || isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                  : "bg-card border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-background"
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
      <div className={cn("mx-4 mb-4 p-4 rounded-2xl border border-primary/20 bg-card shadow-2xl shadow-primary/5 shrink-0 animate-in fade-in slide-in-from-top-2", showForm ? "block" : "hidden")}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-black uppercase tracking-widest text-primary">{formLabels[formMode]}</span>
          <button type="button" onClick={closeForm} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className={formMode === "note" ? "block" : "hidden"}>
          <input 
            ref={noteTitleRef} 
            value={noteTitle} 
            onChange={(e) => setNoteTitle(e.target.value)} 
            placeholder="Note title" 
            maxLength={200} 
            className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/40 focus:bg-background transition-all mb-3" 
          />
          <textarea 
            value={noteContent} 
            onChange={(e) => setNoteContent(e.target.value)} 
            placeholder="Content..." 
            rows={4} 
            maxLength={10000} 
            className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/40 focus:bg-background transition-all mb-3" 
          />
        </div>

        <div className={formMode === "search" ? "block" : "hidden"}>
          <input 
            ref={searchRef} 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()} 
            placeholder="What are we looking for?" 
            className="w-full bg-muted/40 border border-border/40 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/40 focus:bg-background transition-all mb-3" 
          />
        </div>

        {error && <p className="text-[10px] font-bold text-destructive mb-3 px-1">{error}</p>}

        <Button type="button" size="sm" className="w-full h-9 rounded-xl font-bold shadow-lg shadow-primary/10" disabled={saving} onClick={handleSubmit}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : formMode === "search" ? "Start Search" : "Add to Library"}
        </Button>
      </div>

      {saving && !showForm && (
        <div className="mx-4 mb-4 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10 text-[10px] font-bold text-primary shrink-0 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading to memory...
        </div>
      )}

      {/* Source list */}
      <div
        className={cn(
          "flex-1 overflow-y-auto min-h-0 px-4 pb-10 space-y-2 transition-all no-scrollbar",
          dragOver && groupedSources.length > 0 && "border-2 border-dashed border-primary/40 rounded-3xl mx-2 my-2",
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary/30" />
          </div>
        ) : groupedSources.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center py-12 px-6 text-center rounded-3xl border-2 border-dashed transition-all duration-300 group cursor-pointer hover:bg-primary/[0.02]",
              dragOver ? "border-primary bg-primary/5 scale-[0.98]" : "border-border/60 bg-muted/20 hover:border-primary/40",
            )}
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
          >
            <div className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center mb-4 shadow-sm border border-border/40 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-bold text-foreground/80">No sources yet</p>
            <p className="text-[11px] text-muted-foreground/50 mt-1 leading-relaxed">
              Drag & drop a PDF here or use the buttons above to add knowledge.
            </p>
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
                  "group relative flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-300 border",
                  isActive
                    ? "bg-card border-primary/30 shadow-lg shadow-primary/5 scale-[1.02] ring-1 ring-primary/5"
                    : "bg-card/40 border-border/40 hover:bg-card hover:border-border/80 hover:shadow-md hover:scale-[1.01]",
                )}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onToggleGroup(group.ids)}
                    className={cn(
                      "w-8 h-4.5 rounded-full p-0.5 transition-all shrink-0 flex items-center",
                      isActive ? "bg-primary shadow-inner" : "bg-muted border border-border/40",
                    )}
                    title={isActive ? "Deactivate source" : "Activate source"}
                  >
                    <div className={cn(
                      "w-3.5 h-3.5 rounded-full bg-white transition-transform shadow-sm",
                      isActive ? "translate-x-3.5" : "translate-x-0",
                    )} />
                  </button>
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    isActive ? "bg-primary/10 text-primary shadow-sm" : "bg-muted text-muted-foreground/40",
                  )}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <span className={cn("block truncate text-xs font-bold tracking-tight mb-0.5", isActive ? "text-foreground" : "text-muted-foreground/70")}>
                    {group.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                      {typeLabels[group.type] || "Note"}
                    </span>
                    {(group.chunkCount > 1 || group.wordCount > 0) && (
                      <span className="text-[9px] font-bold text-muted-foreground/30 flex items-center gap-1">
                        · {group.wordCount > 0 ? `${group.wordCount} words` : `${group.chunkCount} parts`}
                      </span>
                    )}
                  </div>
                  {isActive && group.directive ? (
                    <button onClick={() => { setEditingDirective(group.id); setDirectiveText(group.directive || ""); }} className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg bg-primary/5 text-[9px] font-bold text-primary hover:bg-primary/10 transition-all truncate group/directive">
                      <Lightbulb className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{group.directive}</span>
                    </button>
                  ) : isActive ? (
                    <button onClick={() => { setEditingDirective(group.id); setDirectiveText(""); }} className="text-[9px] font-bold text-muted-foreground/30 hover:text-primary transition-all mt-2 flex items-center gap-1">
                      + Add focus instruction
                    </button>
                  ) : null}
                </div>
                
                <button
                  type="button"
                  onClick={() => { setDeletingId(group.id); onRemoveGroup(group).finally(() => setDeletingId(null)); }}
                  disabled={isDeleting}
                  className="opacity-0 group-hover:opacity-100 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                  title="Remove from library"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
