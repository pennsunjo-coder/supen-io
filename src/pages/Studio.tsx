import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import SourcePanel from "@/components/SourcePanel";
import StudioWizard from "@/components/StudioWizard";
import { useSources } from "@/hooks/use-sources";
import { useProfile } from "@/hooks/use-profile";
import { useDashboard } from "@/hooks/use-dashboard";
import { useActivity } from "@/hooks/use-activity";
import { invalidateCache } from "@/lib/cache";
import { BookOpen, Sparkles, ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

type MobileTab = "sources" | "studio";

export default function Studio() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const {
    sources, grouped, loading: sourcesLoading,
    addUrl, addNote, addPdf, searchWeb, removeGrouped,
  } = useSources();

  const dashboard = useDashboard();
  const activity = useActivity();

  const [activeSourceIds, setActiveSourceIds] = useState<Set<string>>(new Set());
  const [showSources, setShowSources] = useState(false);

  const handleToggleGroup = useCallback((ids: string[]) => {
    setActiveSourceIds((prev) => {
      const next = new Set(prev);
      const allActive = ids.every((id) => next.has(id));
      if (allActive) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const handleGenerationComplete = useCallback(() => {
    invalidateCache("history:");
    invalidateCache("dashboard:");
    dashboard.refetch();
    activity.refetch();
  }, [dashboard, activity]);

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col min-h-0 bg-background relative overflow-hidden">
        
        {/* Floating Controls Header */}
        <div className="absolute top-8 left-8 right-8 z-30 flex items-center justify-between pointer-events-none">
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")} 
            className="h-12 gap-2 px-6 rounded-2xl glass border-white/5 font-bold shadow-xl pointer-events-auto active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Library
          </Button>

          <Button 
            variant="outline" 
            onClick={() => setShowSources(!showSources)} 
            className={cn(
              "h-12 gap-2 px-6 rounded-2xl glass border-white/5 font-bold shadow-xl pointer-events-auto active:scale-95 transition-all",
              showSources && "bg-primary/10 border-primary/20 text-primary"
            )}
          >
            <BookOpen className="w-4 h-4" /> 
            {showSources ? "Close Sources" : "Select Sources"}
            {activeSourceIds.size > 0 && <span className="ml-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center shadow-lg">{activeSourceIds.size}</span>}
          </Button>
        </div>

        {/* Immersive Studio Environment */}
        <div className="flex-1 flex items-center justify-center p-6 pt-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl h-full flex flex-col"
          >
            <ErrorBoundary
              fallback={
                <div className="flex-1 flex items-center justify-center glass rounded-[3rem] p-12 border-dashed border-white/10 text-center">
                  <div className="max-w-xs">
                    <p className="text-lg font-black mb-2 text-white">Studio temporary offline</p>
                    <p className="text-sm text-muted-foreground mb-8 font-medium leading-relaxed">The engine encountered a friction. Your data is perfectly safe.</p>
                    <Button onClick={() => window.location.reload()} size="lg" className="rounded-2xl px-10 font-black h-14 bg-primary shadow-2xl shadow-primary/20">Reload Studio</Button>
                  </div>
                </div>
              }
            >
              <StudioWizard
                activeSourceIds={Array.from(activeSourceIds)}
                sources={sources}
                profile={profile}
                sessions={dashboard.sessions}
                onUpdateImagePrompt={dashboard.updateImagePrompt}
                activityData={activity}
                onGenerationComplete={handleGenerationComplete}
              />
            </ErrorBoundary>
          </motion.div>
        </div>

        {/* Floating Sources Drawer */}
        <AnimatePresence>
          {showSources && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setShowSources(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 z-50 w-80 glass border-l border-white/10 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)]"
              >
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <span className="text-sm font-bold flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Content Sources</span>
                  <Button variant="ghost" size="icon" onClick={() => setShowSources(false)} className="h-8 w-8 rounded-lg"><X className="w-4 h-4" /></Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <SourcePanel
                    groupedSources={grouped}
                    loading={sourcesLoading}
                    activeSourceIds={activeSourceIds}
                    onToggleGroup={handleToggleGroup}
                    onAddUrl={addUrl}
                    onAddNote={addNote}
                    onAddPdf={addPdf}
                    onSearchWeb={searchWeb}
                    onRemoveGroup={removeGrouped}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
}
