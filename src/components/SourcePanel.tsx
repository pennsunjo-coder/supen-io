import { useState } from "react";
import { FileText, Globe, StickyNote, Plus, Upload, Link2, Search, X, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Source {
  id: string;
  type: string;
  title: string;
}

const typeIcons: Record<string, typeof FileText> = {
  file: FileText,
  url: Globe,
  note: StickyNote,
};

const typeLabels: Record<string, string> = {
  file: "Fichier",
  url: "Lien",
  note: "Note",
};

const SourcePanel = ({
  sources,
  onAddSource,
}: {
  sources: Source[];
  onAddSource: () => void;
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onAddSource}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick actions */}
      <div className="px-4 pb-3 flex gap-1.5">
        {[
          { icon: Upload, label: "Fichier" },
          { icon: Link2, label: "URL" },
          { icon: Search, label: "Web" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-border/40 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:border-border transition-all"
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="mx-4 h-px bg-border/30" />

      {/* Source list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {sources.length === 0 ? (
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
            const isSelected = selectedId === source.id;
            return (
              <button
                key={source.id}
                onClick={() => setSelectedId(isSelected ? null : source.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left group",
                  isSelected
                    ? "bg-primary/8 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors",
                    isSelected
                      ? "bg-primary/15 text-primary"
                      : "bg-accent/60 text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block truncate text-sm">{source.title}</span>
                  <span className="block text-[11px] text-muted-foreground/50 mt-0.5">
                    {typeLabels[source.type] || "Note"}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SourcePanel;
