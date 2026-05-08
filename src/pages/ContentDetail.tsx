import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useContentDetail } from "@/hooks/use-content-detail";
import InfographicModal from "@/components/InfographicModal";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Copy, Check, Download, Loader2, Image, FileText, Flame, Sparkles,
  Share2, Trash2, ChevronRight, Layers, Eye, Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const ContentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, variations, infographic, loading } = useContentDetail(id);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("posts");
  const [showInfographicModal, setShowInfographicModal] = useState(false);

  function handleCopy(idx: number) {
    const v = variations[idx];
    if (!v) return;
    navigator.clipboard.writeText(v.content);
    setCopiedIdx(idx);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  function handleDownload(format: "png" | "jpeg") {
    const base64 = infographic?.infographic_base64;
    if (!base64) return;

    if (format === "png") {
      const link = document.createElement("a");
      link.href = `data:image/png;base64,${base64}`;
      link.download = `supen-infographic-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PNG downloaded!");
    } else {
      const img = new window.Image();
      img.src = `data:image/png;base64,${base64}`;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#f8f9f7";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/jpeg", 0.95);
        link.download = `supen-infographic-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("JPEG downloaded!");
      };
    }
  }

  const bestScore = variations.length > 0
    ? Math.max(...variations.map((v) => v.viral_score || 0))
    : 0;

  const platform = session?.platform || variations[0]?.platform || "";
  const format = session?.format || variations[0]?.format || "";
  const topic = session?.topic || "";
  const createdAt = session?.created_at || variations[0]?.created_at || "";

  const hasInfographic = !!(infographic?.infographic_base64 || infographic?.infographic_html);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center bg-background/50">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <Sparkles className="w-4 h-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Loading Studio...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col overflow-hidden bg-[#fafafa]">
        
        {/* ═══ TOP ACTION BAR ═══ */}
        <header className="h-20 border-b border-border/40 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard/history")}
              className="h-10 w-10 rounded-xl hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                <Link to="/dashboard/history" className="hover:text-primary transition-colors">History</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground/40 truncate max-w-[200px]">{topic || "Untitled"}</span>
              </div>
              <h1 className="text-base font-black tracking-tight truncate max-w-[400px]">
                {topic || `${platform} ${format}`}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <Button variant="outline" className="h-10 px-4 text-xs font-bold gap-2 rounded-xl border-border/60 hover:bg-muted transition-all">
               <Share2 className="w-4 h-4" /> Share
             </Button>
             <Button variant="ghost" className="h-10 w-10 p-0 text-destructive hover:bg-destructive/5 rounded-xl transition-all">
               <Trash2 className="w-4 h-4" />
             </Button>
          </div>
        </header>

        {/* ═══ MAIN WORKSPACE ═══ */}
        <main className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
          
          {/* LEFT COLUMN: Content Feed */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
            <div className="max-w-3xl mx-auto px-6 py-8">
              
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                     <Layers className="w-5 h-5 text-primary" />
                   </div>
                   <div>
                     <h2 className="text-sm font-black uppercase tracking-tight">Variations</h2>
                     <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{variations.length} Versions Generated</p>
                   </div>
                 </div>
                 <Button variant="ghost" className="text-xs font-bold gap-2 text-primary hover:bg-primary/5 rounded-lg px-3">
                    <Copy className="w-3.5 h-3.5" /> Copy All
                 </Button>
              </div>

              <div className="space-y-6">
                {variations.map((v, idx) => {
                  const isBest = v.viral_score > 0 && v.viral_score === bestScore;
                  return (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={cn(
                        "group relative bg-white rounded-[2rem] border transition-all duration-500 overflow-hidden",
                        isBest ? "border-primary/30 shadow-xl shadow-primary/5" : "border-border/60 shadow-sm"
                      )}
                    >
                      {/* Card Header */}
                      <div className="px-8 pt-8 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[11px] font-black">
                              {idx + 1}
                            </span>
                            {isBest && (
                              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20">
                                Best Pick
                              </span>
                            )}
                         </div>
                         {v.viral_score > 0 && (
                            <div className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black tracking-tight",
                              v.viral_score >= 80 ? "bg-emerald-50 text-emerald-600" : "bg-primary/5 text-primary"
                            )}>
                              <Flame className="w-3.5 h-3.5" />
                              {v.viral_score}% VIRAL
                            </div>
                         )}
                      </div>

                      {/* Card Content */}
                      <div className="px-8 py-6">
                        <div className="prose prose-sm max-w-none">
                           <p className="text-[15px] leading-[1.7] text-foreground/80 font-medium whitespace-pre-wrap">
                             {v.content}
                           </p>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-8 py-6 bg-muted/30 border-t border-border/40 flex items-center justify-between">
                         <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                            <div className="flex items-center gap-1.5">
                               <FileText className="w-3 h-3" /> {v.content.split(/\s+/).length} words
                            </div>
                            <div className="flex items-center gap-1.5">
                               <Sparkles className="w-3 h-3" /> Optimized for {v.platform}
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                           <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 px-4 rounded-xl text-xs font-bold gap-2 text-muted-foreground hover:bg-white hover:text-primary transition-all shadow-none hover:shadow-sm"
                              onClick={() => handleCopy(idx)}
                            >
                              {copiedIdx === idx ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                              {copiedIdx === idx ? "Copied" : "Copy"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-white hover:text-primary transition-all shadow-none hover:shadow-sm"
                            >
                              <Wand2 className="w-4 h-4" />
                            </Button>
                         </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Visual Studio Sidebar */}
          <aside className="w-full md:w-[400px] border-l border-border/40 bg-white shrink-0 flex flex-col z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
            <div className="p-6 border-b border-border/40 bg-muted/[0.03]">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
                      <Image className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-tight">Visual Studio</h3>
                  </div>
                  {hasInfographic && (
                    <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Visual Ready
                    </span>
                  )}
               </div>

               {/* CANVAS AREA */}
               <div className="relative group">
                  <div className={cn(
                    "rounded-2xl overflow-hidden transition-all duration-500 bg-[#f8f9f7] shadow-inner",
                    hasInfographic ? "aspect-[4/5] border border-border/40 shadow-2xl shadow-black/5" : "aspect-[4/5] border-2 border-dashed border-border/40 flex items-center justify-center"
                  )}>
                    {hasInfographic ? (
                      <div className="w-full h-full relative cursor-zoom-in" onClick={() => setShowInfographicModal(true)}>
                        {infographic?.infographic_base64 ? (
                          <img
                            src={`data:image/png;base64,${infographic.infographic_base64}`}
                            alt="Infographic"
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                          />
                        ) : (
                          <iframe
                            srcDoc={infographic?.infographic_html || ""}
                            className="w-full h-full pointer-events-none"
                            style={{ border: "none" }}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center">
                             <Eye className="w-5 h-5 text-black" />
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8">
                         <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4 border border-border/40">
                           <Sparkles className="w-8 h-8 text-muted-foreground/30" />
                         </div>
                         <h4 className="text-sm font-bold mb-2">No Visual Yet</h4>
                         <p className="text-[11px] text-muted-foreground/60 leading-relaxed mb-6">
                            Generate a high-impact whiteboard infographic for your top variation.
                         </p>
                         <Button
                          onClick={() => setShowInfographicModal(true)}
                          className="h-10 px-6 rounded-xl font-bold text-xs gap-2 shadow-lg shadow-primary/20"
                        >
                          <Sparkles className="w-4 h-4" /> Create Visual
                        </Button>
                      </div>
                    )}
                  </div>
               </div>

               {/* SIDEBAR ACTIONS */}
               {hasInfographic && (
                 <div className="mt-8 space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                       <Button
                          variant="outline"
                          className="h-11 rounded-xl text-xs font-bold gap-2 border-border/60 hover:bg-muted"
                          onClick={() => handleDownload("png")}
                        >
                          <Download className="w-4 h-4" /> PNG
                        </Button>
                        <Button
                          variant="outline"
                          className="h-11 rounded-xl text-xs font-bold gap-2 border-border/60 hover:bg-muted"
                          onClick={() => handleDownload("jpeg")}
                        >
                          <Download className="w-4 h-4" /> JPEG
                        </Button>
                    </div>

                    <Button
                      onClick={() => setShowInfographicModal(true)}
                      className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-widest gap-2 shadow-xl shadow-primary/20 transition-all active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" /> Regenerate Visual
                    </Button>

                    <div className="pt-6 border-t border-border/40">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-4">Content Metadata</h4>
                       <div className="grid grid-cols-2 gap-2">
                          <div className="bg-muted/30 p-3 rounded-xl border border-border/20">
                             <p className="text-[9px] font-black text-muted-foreground/50 uppercase mb-1">Platform</p>
                             <p className="text-xs font-bold">{platform}</p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-xl border border-border/20">
                             <p className="text-[9px] font-black text-muted-foreground/50 uppercase mb-1">Created</p>
                             <p className="text-xs font-bold">{formatDate(createdAt)}</p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-xl border border-border/20">
                             <p className="text-[9px] font-black text-muted-foreground/50 uppercase mb-1">Variations</p>
                             <p className="text-xs font-bold">{variations.length}</p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-xl border border-border/20">
                             <p className="text-[9px] font-black text-muted-foreground/50 uppercase mb-1">Avg Score</p>
                             <p className="text-xs font-bold text-emerald-600">{bestScore}%</p>
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>
            
            <div className="p-6 mt-auto">
               <Button
                variant="ghost"
                onClick={() => navigate("/dashboard/studio")}
                className="w-full h-12 rounded-xl border border-dashed border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 text-xs font-bold gap-2"
              >
                <Sparkles className="w-4 h-4" /> Create New Content
              </Button>
            </div>
          </aside>
        </main>
      </div>

      <InfographicModal
        open={showInfographicModal}
        onClose={() => {
          setShowInfographicModal(false);
          window.location.reload();
        }}
        content={variations[0]?.content || ""}
        platform={platform}
        sessionId={id}
      />
    </DashboardLayout>
  );
};

export default ContentDetail;
