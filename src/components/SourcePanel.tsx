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
import { motion, AnimatePresence } from "framer-motion";

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
    setPdfLoading(true);
    try {
      const result = await onAddPdf(file);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`"${file.name}" imported.`);
        if (result.insertedIds && result.insertedIds.length > 0) {
          onToggleGroup(result.insertedIds);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setPdfLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const actions: { mode: FormMode | "pdf"; icon: typeof Globe; label: string }[] = [
    { mode: "pdf", icon: Upload, label: "PDF" },
    { mode: "note", icon: StickyNote, label: "Note" },
    { mode: "search", icon: Search, label: "Web" },
  ];

  return (
    <div className="w-full flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="px-6 py-8 border-b border-white/5 shrink-0">
        <h2 className="text-xs font-black tracking-[0.2em] uppercase text-primary mb-2">Knowledge Base</h2>
        <div className="flex items-center justify-between">
          <p className="text-xl font-black text-white">
            {groupedSources.length} <span className="text-muted-foreground font-medium">sources</span>
          </p>
          {activeCount > 0 && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary text-white font-black uppercase tracking-tighter shadow-lg shadow-primary/20">
              {activeCount} Active
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-5 grid grid-cols-3 gap-3 shrink-0">
        {actions.map(({ mode, icon: Icon, label }) => {
          const isActive = showForm && formMode === mode;
          const isPdf = mode === "pdf";
          return (
            <button
              key={mode}
              type="button"
              onClick={() => isPdf ? fileRef.current?.click() : (isActive ? closeForm() : openForm(mode as FormMode))}
              disabled={saving || pdfLoading}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95",
                isActive || (isPdf && pdfLoading)
                  ? "bg-primary border-primary text-white shadow-xl shadow-primary/20"
                  : "bg-white/[0.03] border-white/5 text-muted-foreground hover:text-white hover:bg-white/[0.08]"
              )}
            >
              {(isPdf && pdfLoading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
              {label}
            </button>
          );
        })}
      </div>

      <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) importPdf(file);
        e.target.value = "";
      }} />

      {/* Form Area */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-5 mb-5 p-5 rounded-2xl bg-white/[0.05] border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-primary">{formMode === "note" ? "New Knowledge Note" : "AI Web Research"}</span>
                <button onClick={closeForm} className="text-muted-foreground hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              
              {formMode === "note" ? (
                <div className="space-y-3">
                  <input ref={noteTitleRef} value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Topic title" className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-primary/40 transition-all outline-none" />
                  <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="What do you want the AI to know?" rows={4} className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm resize-none focus:border-primary/40 transition-all outline-none" />
                </div>
              ) : (
                <input ref={searchRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="Ex: Latest trends in AI automation..." className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-primary/40 transition-all outline-none" />
              )}

              {error && <p className="text-[10px] font-bold text-red-400 mt-3">{error}</p>}
              
              <Button size="sm" className="w-full mt-4 h-11 rounded-xl font-black bg-primary" disabled={saving} onClick={handleSubmit}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Store Knowledge"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Source List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-10 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary/30" /></div>
        ) : groupedSources.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4"><Upload className="w-6 h-6 text-muted-foreground/30" /></div>
            <p className="text-sm font-bold text-muted-foreground/50">Your library is empty</p>
          </div>
        ) : (
          groupedSources.map((group) => {
            const Icon = typeIcons[group.type] || StickyNote;
            const isActive = group.ids.every((gid) => activeSourceIds.has(gid));
            return (
              <motion.div
                key={group.id}
                layout
                className={cn(
                  "group p-4 rounded-2xl border transition-all duration-500 flex items-start gap-4 cursor-pointer",
                  isActive 
                    ? "bg-white/[0.06] border-primary/40 shadow-xl shadow-primary/5" 
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                )}
                onClick={() => onToggleGroup(group.ids)}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500", isActive ? "bg-primary text-white shadow-lg" : "bg-white/5 text-muted-foreground/30")}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={cn("text-sm font-bold truncate", isActive ? "text-white" : "text-muted-foreground")}>{group.title}</h3>
                    <div className={cn("w-8 h-4 rounded-full p-0.5 transition-all", isActive ? "bg-primary" : "bg-white/10")}>
                      <div className={cn("w-3 h-3 rounded-full bg-white transition-transform", isActive ? "translate-x-4" : "translate-x-0")} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{typeLabels[group.type]}</span>
                    <span className="text-[10px] font-medium text-muted-foreground/20">/</span>
                    <span className="text-[10px] font-medium text-muted-foreground/40">{group.wordCount || 0} words</span>
                  </div>
                  
                  {isActive && (
                    <div className="mt-3 flex items-center gap-2">
                       <button onClick={(e) => { e.stopPropagation(); setEditingDirective(group.id); setDirectiveText(group.directive || ""); }} className="flex-1 text-left px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-bold text-primary truncate transition-all">
                         {group.directive || "+ Add custom focus instruction"}
                       </button>
                       <button onClick={(e) => { e.stopPropagation(); onRemoveGroup(group); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all">
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Directive Editor */}
      <AnimatePresence>
        {editingDirective && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setEditingDirective(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="glass w-full max-w-sm p-8 rounded-[2rem] border-white/10" onClick={(e) => e.stopPropagation()}>
               <h3 className="text-xl font-black mb-2 text-white">Focus Instruction</h3>
               <p className="text-sm text-muted-foreground mb-6 font-medium">Guide the AI on what parts of this source to prioritize.</p>
               <textarea autoFocus value={directiveText} onChange={(e) => setDirectiveText(e.target.value)} placeholder="Ex: Focus on the marketing section..." className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-sm resize-none h-32 focus:border-primary outline-none transition-all mb-6" />
               <div className="flex gap-4">
                 <Button variant="ghost" className="flex-1 font-bold" onClick={() => setEditingDirective(null)}>Cancel</Button>
                 <Button className="flex-1 font-black bg-primary h-12 rounded-xl" onClick={() => {
                   const g = groupedSources.find(s => s.id === editingDirective);
                   if (g) saveDirective(g.id, g.ids, directiveText);
                 }}>Save Focus</Button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SourcePanel;
