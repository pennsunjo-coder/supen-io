import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useContentDetail } from "@/hooks/use-content-detail";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Copy, Check, Download, Loader2, Image, FileText, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function scoreBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-500/15";
  if (score >= 50) return "bg-amber-500/15";
  return "bg-red-500/15";
}

type MobileTab = "posts" | "infographic";

const ContentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, variations, infographic, loading } = useContentDetail(id);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("posts");

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
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (variations.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-sm text-muted-foreground">Content not found or no session_id linked.</p>
          <Button variant="outline" onClick={() => navigate("/dashboard/history")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to History
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">

          {/* ═══ HEADER ═══ */}
          <div className="flex items-start gap-3 mb-6">
            <button
              onClick={() => navigate("/dashboard/history")}
              className="w-8 h-8 rounded-lg border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors shrink-0 mt-0.5"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">
                {topic || `${platform} ${format}`}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {platform && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {platform}
                  </span>
                )}
                {format && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/50 text-muted-foreground font-medium">
                    {format}
                  </span>
                )}
                {createdAt && (
                  <span className="text-[10px] text-muted-foreground/50">
                    {formatDate(createdAt)}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground/50">
                  {variations.length} variation{variations.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* ═══ MOBILE TABS ═══ */}
          <div className="flex md:hidden gap-1 mb-4 p-0.5 rounded-lg bg-accent/20 border border-border/20">
            <button
              onClick={() => setMobileTab("posts")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all",
                mobileTab === "posts" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              <FileText className="w-3.5 h-3.5" /> Posts ({variations.length})
            </button>
            <button
              onClick={() => setMobileTab("infographic")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all",
                mobileTab === "infographic" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              <Image className="w-3.5 h-3.5" /> Infographic
            </button>
          </div>

          {/* ═══ DESKTOP 2-COLUMN / MOBILE TABS ═══ */}
          <div className="flex flex-col md:flex-row gap-6">

            {/* LEFT — Variations */}
            <div className={cn(
              "flex-1 min-w-0 space-y-3",
              mobileTab !== "posts" && "hidden md:block",
            )}>
              {variations.map((v, idx) => {
                const isBest = v.viral_score > 0 && v.viral_score === bestScore;
                return (
                  <div
                    key={v.id}
                    className={cn(
                      "rounded-xl border p-4 transition-all",
                      isBest ? "border-amber-500/30 bg-amber-500/[0.03]" : "border-border/20",
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        Variation {idx + 1}
                      </span>
                      {isBest && (
                        <span className="text-[9px] font-semibold text-amber-400 flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" /> Top Pick
                        </span>
                      )}
                      <div className="ml-auto flex items-center gap-1.5">
                        {(v.viral_score ?? 0) > 0 && (
                          <span className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                            scoreBgColor(v.viral_score), scoreColor(v.viral_score),
                          )}>
                            {v.viral_score}%
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground/40">
                          {v.content.split(/\s+/).length} words
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-foreground/85 mb-3">
                      {v.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/10">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px] gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy(idx)}
                      >
                        {copiedIdx === idx
                          ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</>
                          : <><Copy className="w-3 h-3" /> Copy</>}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT — Infographic */}
            <div className={cn(
              "w-full md:w-[360px] shrink-0",
              mobileTab !== "infographic" && "hidden md:block",
            )}>
              <div className="sticky top-6">
                {hasInfographic ? (
                  <div className="rounded-xl border border-border/30 overflow-hidden bg-white">
                    {infographic?.infographic_base64 ? (
                      <img
                        src={`data:image/png;base64,${infographic.infographic_base64}`}
                        alt="Infographic"
                        className="w-full h-auto"
                      />
                    ) : infographic?.infographic_html ? (
                      <div className="relative w-full" style={{ paddingBottom: "125%" }}>
                        <iframe
                          srcDoc={infographic.infographic_html}
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          style={{ border: "none" }}
                          sandbox="allow-same-origin"
                          title="Infographic"
                        />
                      </div>
                    ) : null}

                    {/* Download buttons */}
                    {infographic?.infographic_base64 && (
                      <div className="flex gap-2 p-3 border-t border-border/20">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs gap-1.5"
                          onClick={() => handleDownload("png")}
                        >
                          <Download className="w-3 h-3" /> PNG
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs gap-1.5"
                          onClick={() => handleDownload("jpeg")}
                        >
                          <Download className="w-3 h-3" /> JPEG
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/30 p-8 text-center">
                    <div className="w-12 h-12 rounded-xl bg-accent/40 flex items-center justify-center mx-auto mb-3">
                      <Image className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      No infographic
                    </p>
                    <p className="text-xs text-muted-foreground/60 mb-4">
                      Generate an infographic from the Studio.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => navigate("/dashboard")}
                    >
                      Go to Studio
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ContentDetail;
