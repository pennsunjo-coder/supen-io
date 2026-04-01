import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Youtube, Download, Image, ArrowRight, FileText,
  CheckCircle2, Loader2, Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: typeof Youtube;
  placeholder: string;
  action: string;
  badge?: string;
}

const tools: Tool[] = [
  {
    id: "transcriber",
    title: "YouTube Transcriber",
    description: "Extrais le transcript de n'importe quelle vidéo YouTube pour l'utiliser comme source.",
    icon: Youtube,
    placeholder: "https://youtube.com/watch?v=...",
    action: "Transcrire",
  },
  {
    id: "downloader",
    title: "Video Downloader",
    description: "Télécharge des vidéos depuis Instagram, Facebook et TikTok.",
    icon: Download,
    placeholder: "Colle l'URL de la vidéo...",
    action: "Télécharger",
  },
  {
    id: "imagegen",
    title: "Génération d'images",
    description: "Crée des visuels uniques à partir d'un prompt pour tes posts et stories.",
    icon: Image,
    placeholder: "Décris l'image que tu veux créer...",
    action: "Générer",
    badge: "Nouveau",
  },
];

const Tools = () => {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const handleAction = (toolId: string) => {
    if (!inputs[toolId]?.trim()) return;
    setLoading(toolId);
    setDone(null);
    setTimeout(() => {
      setLoading(null);
      setDone(toolId);
      setTimeout(() => setDone(null), 3000);
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Outils créateur</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-12">
              Des utilitaires gratuits pour accélérer ton workflow.
            </p>
          </div>

          {/* Tools list */}
          <div className="space-y-4">
            {tools.map((tool, i) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                className="rounded-xl border border-border/30 bg-card/50 p-5 hover:border-border/50 transition-colors"
              >
                <div className="flex items-start gap-3.5 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <tool.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{tool.title}</h3>
                      {tool.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={inputs[tool.id] || ""}
                    onChange={(e) => setInputs((prev) => ({ ...prev, [tool.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleAction(tool.id)}
                    placeholder={tool.placeholder}
                    className="bg-accent/30 border-border/30 h-10 text-sm focus:ring-primary/30"
                  />
                  <Button
                    size="sm"
                    className={cn(
                      "shrink-0 h-10 gap-1.5 min-w-[110px] text-xs font-medium",
                      done === tool.id && "bg-emerald-600 hover:bg-emerald-600"
                    )}
                    disabled={loading === tool.id || !inputs[tool.id]?.trim()}
                    onClick={() => handleAction(tool.id)}
                  >
                    {loading === tool.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        En cours...
                      </>
                    ) : done === tool.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Terminé !
                      </>
                    ) : (
                      <>
                        {tool.action}
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </Button>
                </div>

                {done === tool.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 flex items-center gap-2 text-xs text-emerald-400/80"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Résultat sauvegardé dans ton Notebook</span>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Tools;
