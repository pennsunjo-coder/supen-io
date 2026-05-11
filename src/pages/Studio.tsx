import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import SourcePanel from "@/components/SourcePanel";
import StudioWizard from "@/components/StudioWizard";
import ChatPanel from "@/components/ChatPanel";
import { useSources } from "@/hooks/use-sources";
import { useProfile } from "@/hooks/use-profile";
import { useDashboard } from "@/hooks/use-dashboard";
import { useActivity } from "@/hooks/use-activity";
import { useConversation } from "@/hooks/use-conversation";
import { invalidateCache } from "@/lib/cache";
import { BookOpen, Sparkles, ArrowLeft, X, Bot } from "lucide-react";
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
  const { messages, setMessages, loading: conversationLoading, clearConversation } = useConversation();

  const [activeSourceIds, setActiveSourceIds] = useState<Set<string>>(new Set());
  const [showSources, setShowSources] = useState(false);
  const [showCoach, setShowCoach] = useState(false);

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
      <div className="flex-1 flex overflow-hidden bg-background relative">
        
        {/* LEFT SIDEBAR — Sources (Permanent on desktop) */}
        <div className={cn(
          "w-72 border-r border-border/40 flex flex-col transition-all duration-500 bg-card/10 backdrop-blur-xl shrink-0 z-20",
          !showSources && "hidden lg:flex"
        )}>
          <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card/20">
            <span className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2"><BookOpen className="w-3.5 h-3.5 text-primary" /> Sources</span>
            <Button variant="ghost" size="icon" onClick={() => setShowSources(false)} className="h-8 w-8 lg:hidden"><X className="w-4 h-4" /></Button>
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
        </div>

        {/* MAIN STUDIO AREA */}
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
          
          {/* Controls Header */}
          <div className="absolute top-6 left-6 right-6 z-30 flex items-center justify-between pointer-events-none">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate("/dashboard")} 
                className="h-10 gap-2 px-4 rounded-xl glass border-border/40 text-[10px] font-black uppercase tracking-widest shadow-xl pointer-events-auto active:scale-95 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Library
              </Button>

              <Button 
                variant="outline" 
                onClick={() => setShowSources(!showSources)} 
                className={cn(
                  "h-10 gap-2 px-4 rounded-xl glass border-border/40 text-[10px] font-black uppercase tracking-widest shadow-xl pointer-events-auto lg:hidden active:scale-95 transition-all",
                  showSources && "bg-primary/10 border-primary/20 text-primary"
                )}
              >
                <BookOpen className="w-3.5 h-3.5" /> 
                Sources
              </Button>
            </div>

            <Button 
              variant="outline" 
              onClick={() => setShowCoach(!showCoach)} 
              className={cn(
                "h-10 gap-2 px-4 rounded-xl glass border-border/40 text-[10px] font-black uppercase tracking-widest shadow-xl pointer-events-auto active:scale-95 transition-all",
                showCoach && "bg-primary/10 border-primary/20 text-primary"
              )}
            >
              <Bot className="w-3.5 h-3.5" /> 
              Coach
            </Button>
          </div>

          {/* Immersive Workspace */}
          <div className="flex-1 flex items-center justify-center p-6 pt-20">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-4xl h-full flex flex-col"
            >
              <ErrorBoundary
                fallback={
                  <div className="flex-1 flex items-center justify-center glass-card p-10 border-dashed border-border/40 text-center">
                    <div className="max-w-xs">
                      <p className="text-base font-black mb-2">Studio temporary offline</p>
                      <p className="text-xs text-muted-foreground/60 mb-6 font-medium leading-relaxed">The engine encountered a friction. Your data is safe.</p>
                      <Button onClick={() => window.location.reload()} size="sm" className="rounded-xl px-8 font-black h-12 bg-primary">Reload Studio</Button>
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
        </div>

        {/* RIGHT SIDEBAR — Coach */}
        <div className={cn(
          "w-80 border-l border-border/40 flex flex-col transition-all duration-500 bg-card/10 backdrop-blur-xl shrink-0 z-20",
          !showCoach && "hidden"
        )}>
          <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card/20">
            <span className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2"><Bot className="w-3.5 h-3.5 text-primary" /> AI Coach</span>
            <Button variant="ghost" size="icon" onClick={() => setShowCoach(false)} className="h-8 w-8"><X className="w-4 h-4" /></Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatPanel
              sources={sources}
              messages={messages}
              onMessagesChange={setMessages}
              conversationLoading={conversationLoading}
              onClearConversation={clearConversation}
              profile={profile}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
