import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useHistory, GeneratedItem } from "@/hooks/use-history";
import { Button } from "@/components/ui/button";
import {
  Copy, Check, Loader2, ChevronDown, Clock, Filter, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/* ─── Platform icons ─── */

const IconX = () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
const IconInstagram = () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
const IconLinkedIn = () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
const IconYouTube = () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
const IconFacebook = () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
const IconTikTok = () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>;

const platformIcons: Record<string, React.FC> = {
  "Instagram": IconInstagram,
  "TikTok": IconTikTok,
  "LinkedIn": IconLinkedIn,
  "Facebook": IconFacebook,
  "X (Twitter)": IconX,
  "YouTube": IconYouTube,
};

const platformFilters = ["Tout", "Instagram", "TikTok", "LinkedIn", "Facebook", "X (Twitter)", "YouTube"];

function truncate(text: string, words: number): string {
  const w = text.split(/\s+/);
  if (w.length <= words) return text;
  return w.slice(0, words).join(" ") + "...";
}

function isInfographicHtml(content: string): boolean {
  return (
    content.startsWith("<!DOCTYPE html>") ||
    content.startsWith("<html") ||
    (content.includes("<style>") && content.includes("font-family"))
  );
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

/* ─── Card item ─── */

function HistoryCard({ item }: { item: GeneratedItem }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const PlatformIcon = platformIcons[item.platform];

  function handleCopy() {
    navigator.clipboard.writeText(item.content);
    setCopied(true);
    toast.success(`Contenu copie ! Pret a publier sur ${item.platform}.`);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReuse() {
    navigate("/dashboard");
    toast("Ouvre le Studio pour creer du nouveau contenu.");
  }

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={cn(
        "rounded-xl border p-4 cursor-pointer transition-all",
        expanded ? "border-border/40 bg-card" : "border-border/15 hover:border-border/30",
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5">
        {PlatformIcon && (
          <div className="w-7 h-7 rounded-lg bg-accent/50 flex items-center justify-center shrink-0">
            <PlatformIcon />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">{item.platform}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/40 text-muted-foreground">{item.format}</span>
          </div>
          {!expanded && (
            <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">
              {isInfographicHtml(item.content) ? "Infographie" : truncate(item.content, 15)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground/50">{formatTime(item.created_at)}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground/40 transition-transform", expanded && "rotate-180")} />
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mt-3 pt-3 border-t border-border/15">
              {isInfographicHtml(item.content) ? (
                <div className="relative w-full rounded-lg overflow-hidden bg-white mb-3" style={{ height: "300px" }}>
                  <iframe srcDoc={item.content} className="absolute top-0 left-0 origin-top-left pointer-events-none" style={{ width: "1080px", height: "1350px", transform: "scale(0.278)", border: "none" }} sandbox="allow-same-origin" title="Infographie" />
                  <div className="absolute inset-0 flex items-end p-2"><span className="text-[10px] bg-black/40 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">Infographie</span></div>
                </div>
              ) : (
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-foreground/85">
                  {item.content}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                {!isInfographicHtml(item.content) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); handleReuse(); }}
                  >
                    <RotateCcw className="w-3 h-3" /> Reuse
                  </Button>
                )}
                <span className="text-[10px] text-muted-foreground/40 ml-auto">
                  {isInfographicHtml(item.content) ? "Infographie HTML" : `${item.content.split(/\s+/).length} words`}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Page ─── */

const History = () => {
  const { grouped, loading } = useHistory();
  const [filter, setFilter] = useState("Tout");

  const filteredGroups = useMemo(
    () => grouped
      .map((group) => ({
        ...group,
        items: filter === "Tout" ? group.items : group.items.filter((i) => i.platform === filter),
      }))
      .filter((group) => group.items.length > 0),
    [grouped, filter]
  );

  const totalCount = useMemo(
    () => filteredGroups.reduce((acc, g) => acc + g.items.length, 0),
    [filteredGroups]
  );

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Historique</h1>
              <p className="text-xs text-muted-foreground">
                {loading ? "Chargement..." : `${totalCount} contenu${totalCount > 1 ? "s" : ""} genere${totalCount > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">
            <Filter className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 mr-1" />
            {platformFilters.map((p) => (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all",
                  filter === p
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground border border-border/20 hover:border-border/40 hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent/40 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Aucun contenu</p>
              <p className="text-xs text-muted-foreground/60">
                {filter === "Tout"
                  ? "Genere du contenu dans le Studio pour le retrouver ici."
                  : `Aucun contenu ${filter} trouve.`}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredGroups.map((group) => (
                <div key={group.label}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <h2 className="text-xs font-semibold text-muted-foreground">{group.label}</h2>
                    <div className="flex-1 h-px bg-border/15" />
                    <span className="text-[10px] text-muted-foreground/40">{group.items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <HistoryCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default History;
