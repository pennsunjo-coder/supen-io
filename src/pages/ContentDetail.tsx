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
import DOMPurify from "dompurify";

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
        <div className="flex-1 flex flex-col items-center justify-center bg-background">
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />
            <Sparkles className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-xs font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Opening Studio...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        
        {/* ═══ PREMIUM TOP BAR ═══ */}
        <header className="h-24 border-b border-white/5 bg-background/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-20">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/dashboard/history")}
              className="group w-12 h-12 rounded-2xl glass border-white/5 flex items-center justify-center text-muted-foreground hover:text-white transition-all active:scale-90"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.2em] mb-1">
                <Link to="/dashboard/history" className="hover:text-primary transition-colors">Library</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white/30 truncate max-w-[200px]">{topic || "Untitled Asset"}</span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-white truncate max-w-[400px]">
                {topic || `${platform} ${format}`}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <Button variant="ghost" className="h-12 px-6 rounded-2xl glass border-white/5 text-xs font-black uppercase tracking-widest gap-2 text-white hover:bg-white/10">
               <Share2 className="w-4 h-4" /> Share
             </Button>
             <button className="w-12 h-12 rounded-2xl glass border-white/5 flex items-center justify-center text-rose-500/60 hover:text-rose-500 hover:bg-rose-500/10 transition-all active:scale-90">
               <Trash2 className="w-5 h-5" />
             </button>
          </div>
        </header>

        {/* ═══ MAIN WORKSPACE ═══ */}
        <main className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
          
          {/* LEFT COLUMN: Content Feed */}
          {/* LEFT COLUMN: Strategic Assets */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
            <div className="max-w-4xl mx-auto px-8 py-12">
              
              <div className="flex items-center justify-between mb-12">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                     <Layers className="w-6 h-6 text-primary" />
                   </div>
                   <div>
                     <h2 className="text-lg font-black tracking-tight text-white">Creative Variations</h2>
                     <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">{variations.length} Strategically Optimized Versions</p>
                   </div>
                 </div>
                 <Button variant="ghost" className="h-10 px-5 rounded-xl glass border-white/5 text-[10px] font-black uppercase tracking-widest gap-2 text-primary hover:bg-primary/10">
                    <Copy className="w-3.5 h-3.5" /> Copy Library
                 </Button>
              </div>

              <div className="space-y-8">
                {variations.map((v, idx) => {
                  const isBest = v.viral_score > 0 && v.viral_score === bestScore;
                  return (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1, duration: 0.6 }}
                      className={cn(
                        "group relative rounded-[2.5rem] border transition-all duration-700",
                        isBest 
                          ? "bg-white/[0.05] border-primary/40 shadow-[0_30px_70px_-20px_rgba(20,184,166,0.3)] scale-[1.02] z-10" 
                          : "glass-card border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                      )}
                    >
                      {/* Card Header */}
                      <div className="px-10 pt-10 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <span className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-xs font-black text-white/40">
                              0{idx + 1}
                            </span>
                            {isBest && (
                              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                                <Flame className="w-3.5 h-3.5 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Viral Pick</span>
                              </div>
                            )}
                         </div>
                         {v.viral_score > 0 && (
                            <div className="flex flex-col items-end">
                               <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Potential</span>
                               <span className={cn("text-2xl font-black tracking-tighter", v.viral_score >= 80 ? "text-emerald-400" : "text-primary")}>
                                 {v.viral_score}%
                               </span>
                            </div>
                         )}
                      </div>

                      {/* Card Content */}
                      <div className="px-10 py-8">
                         <p className="text-lg leading-[1.75] text-white/90 font-medium whitespace-pre-wrap selection:bg-primary/30">
                           {v.content}
                         </p>
                      </div>

                      {/* Card Footer */}
                      <div className="px-10 py-8 border-t border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-6 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">
                            <div className="flex items-center gap-2">
                               <FileText className="w-4 h-4" /> {v.content.split(/\s+/).length} Words
                            </div>
                            <div className="flex items-center gap-2">
                               <Sparkles className="w-4 h-4" /> {v.platform} AI-Tuned
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                           <Button
                              variant="ghost"
                              onClick={() => handleCopy(idx)}
                              className="h-12 px-6 rounded-2xl glass border-white/5 text-[10px] font-black uppercase tracking-widest gap-2 text-white hover:bg-white/10"
                            >
                              {copiedIdx === idx ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              {copiedIdx === idx ? "Saved" : "Copy"}
                            </Button>
                            <Button
                              variant="ghost"
                              className="w-12 h-12 rounded-2xl glass border-white/5 text-muted-foreground hover:text-primary transition-all"
                            >
                              <Wand2 className="w-5 h-5" />
                            </Button>
                         </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Studio Canvas */}
          <aside className="w-full md:w-[450px] border-l border-white/5 bg-background/50 backdrop-blur-xl shrink-0 flex flex-col z-10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
            <div className="p-8 flex-1 overflow-y-auto no-scrollbar">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-xl">
                      <Image className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-black tracking-tight text-white">Visual Studio</h3>
                  </div>
                  {hasInfographic && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Master Render</span>
                    </div>
                  )}
               </div>

               {/* CANVAS AREA */}
               <div className="relative group mb-10">
                  <div className={cn(
                    "rounded-[2.5rem] overflow-hidden transition-all duration-700 bg-black/40 border border-white/5 shadow-2xl",
                    hasInfographic ? "aspect-[4/5] shadow-[0_30px_60px_-10px_rgba(0,0,0,0.5)]" : "aspect-[4/5] flex flex-col items-center justify-center p-12 text-center"
                  )}>
                    {hasInfographic ? (
                      <div className="w-full h-full relative cursor-zoom-in" onClick={() => setShowInfographicModal(true)}>
                        {infographic?.infographic_base64 ? (
                          <img
                            src={`data:image/png;base64,${infographic.infographic_base64}`}
                            alt="Infographic"
                            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-[1.5s] ease-out"
                          />
                        ) : (
                          <iframe
                            srcDoc={DOMPurify.sanitize(infographic?.infographic_html || "", {
                              ADD_TAGS: ["link", "style"],
                              ADD_ATTR: ["href", "rel", "target"],
                            })}
                            className="w-full h-full pointer-events-none"
                            style={{ border: "none" }}
                            sandbox="allow-popups"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center duration-500">
                           <div className="w-16 h-16 rounded-full glass border-white/20 shadow-2xl flex items-center justify-center active:scale-90 transition-transform">
                             <Eye className="w-8 h-8 text-white" />
                           </div>
                        </div>
                      </div>
                    ) : (
                      <>
                         <div className="w-24 h-24 rounded-[2rem] glass border-white/10 flex items-center justify-center mb-8 shadow-inner">
                           <Sparkles className="w-10 h-10 text-primary/40 animate-pulse" />
                         </div>
                         <h4 className="text-lg font-black text-white mb-3">No Visual Yet</h4>
                         <p className="text-xs text-muted-foreground/60 leading-relaxed mb-8">
                            Turn your strategic content into a high-impact whiteboard infographic.
                         </p>
                         <Button
                          onClick={() => setShowInfographicModal(true)}
                          className="h-14 px-10 rounded-2xl bg-primary text-white font-black text-sm gap-3 shadow-2xl shadow-primary/30 hover:scale-105 transition-all"
                        >
                          <Sparkles className="w-5 h-5" /> Generate Visual
                        </Button>
                      </>
                    )}
                  </div>
               </div>

               {/* SIDEBAR ACTIONS */}
               {hasInfographic && (
                 <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                       <Button
                          variant="ghost"
                          className="h-14 rounded-2xl glass border-white/5 text-xs font-black uppercase tracking-widest gap-2 text-white hover:bg-white/10"
                          onClick={() => handleDownload("png")}
                        >
                          <Download className="w-5 h-5" /> PNG
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-14 rounded-2xl glass border-white/5 text-xs font-black uppercase tracking-widest gap-2 text-white hover:bg-white/10"
                          onClick={() => handleDownload("jpeg")}
                        >
                          <Download className="w-5 h-5" /> JPEG
                        </Button>
                    </div>

                    <Button
                      onClick={() => setShowInfographicModal(true)}
                      className="w-full h-16 rounded-2xl bg-white text-black hover:bg-white/90 font-black text-xs uppercase tracking-[0.2em] gap-3 shadow-2xl transition-all active:scale-95"
                    >
                      <Sparkles className="w-5 h-5" /> Regenerate Master
                    </Button>

                    <div className="pt-8 border-t border-white/5">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mb-6">Asset Intelligence</h4>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="glass p-5 rounded-2xl border-white/5">
                             <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mb-2">Platform</p>
                             <p className="text-xs font-black text-white">{platform}</p>
                          </div>
                          <div className="glass p-5 rounded-2xl border-white/5">
                             <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mb-2">Created</p>
                             <p className="text-xs font-black text-white">{formatDate(createdAt)}</p>
                          </div>
                          <div className="glass p-5 rounded-2xl border-white/5">
                             <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mb-2">Library</p>
                             <p className="text-xs font-black text-white">{variations.length} Assets</p>
                          </div>
                          <div className="glass p-5 rounded-2xl border-white/5">
                             <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mb-2">Top Score</p>
                             <p className="text-xs font-black text-emerald-400">{bestScore}%</p>
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>
            
            <div className="p-8 mt-auto border-t border-white/5">
               <Button
                variant="ghost"
                onClick={() => navigate("/dashboard/studio")}
                className="w-full h-14 rounded-2xl border border-dashed border-white/10 text-muted-foreground hover:text-primary hover:border-primary/40 text-[10px] font-black uppercase tracking-widest gap-3"
              >
                <Sparkles className="w-5 h-5" /> Back to Studio
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
