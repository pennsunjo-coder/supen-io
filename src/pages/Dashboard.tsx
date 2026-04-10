import { useState, useCallback, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import SourcePanel from "@/components/SourcePanel";
import ChatPanel from "@/components/ChatPanel";
import StudioWizard from "@/components/StudioWizard";
import { useSources } from "@/hooks/use-sources";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { useDashboard } from "@/hooks/use-dashboard";
import { useActivity } from "@/hooks/use-activity";
import { invalidateCache } from "@/lib/cache";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { BookOpen, Sparkles, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";

type MobileTab = "sources" | "studio" | "coach";

const Dashboard = () => {
  const { profile } = useProfile();
  const {
    sources,
    grouped,
    loading: sourcesLoading,
    addUrl,
    addNote,
    addPdf,
    searchWeb,
    removeGrouped,
  } = useSources();

  const {
    messages,
    setMessages,
    loading: conversationLoading,
    clearConversation,
  } = useConversation();

  const dashboard = useDashboard();
  const activity = useActivity();

  const [activeSourceIds, setActiveSourceIds] = useState<Set<string>>(new Set());
  const [lastGeneratedContent, setLastGeneratedContent] = useState<string>("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("studio");

  // Compteur de générations pour forcer le refetch
  const [genCount, setGenCount] = useState(0);

  // Detect upgrade success from Stripe redirect
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      const plan = searchParams.get("plan") || "Pro";
      toast.success(`Welcome to ${plan.charAt(0).toUpperCase() + plan.slice(1)}! Your account has been updated.`);
      searchParams.delete("upgraded");
      searchParams.delete("plan");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleToggleGroup = useCallback((ids: string[]) => {
    setActiveSourceIds((prev) => {
      const next = new Set(prev);
      const allActive = ids.every((id) => next.has(id));
      if (allActive) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }, []);

  const handleGenerationComplete = useCallback(() => {
    invalidateCache("history:");
    invalidateCache("dashboard:");
    dashboard.refetch();
    activity.refetch();
    setGenCount((c) => c + 1);
  }, [dashboard, activity]);

  useEffect(() => {
    if (genCount > 0) {
      dashboard.refetch();
      activity.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genCount]);

  return (
    <DashboardLayout>
      <div className="flex-1 flex min-h-0 pb-16 md:pb-0">
        {/* Sources panel: desktop always visible, mobile only if tab active */}
        <div className={cn(
          "shrink-0 border-r border-border/40 bg-accent/[0.03] md:w-auto md:flex md:flex-col",
          mobileTab === "sources" ? "flex flex-col w-full" : "hidden md:flex",
        )}>
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

        {/* Studio: desktop always visible, mobile only if tab active */}
        <div className={cn(
          "flex-1 flex-col min-w-0 md:flex",
          mobileTab === "studio" ? "flex" : "hidden md:flex",
        )}>
          <ErrorBoundary
            fallback={
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                  <p className="text-sm font-medium mb-2">The Studio encountered an error</p>
                  <p className="text-xs text-muted-foreground mb-4">Your data is safe. Reload to try again.</p>
                  <Button onClick={() => window.location.reload()} size="sm" variant="outline">
                    Reload
                  </Button>
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
              onContentGenerated={setLastGeneratedContent}
              onGenerationComplete={handleGenerationComplete}
            />
          </ErrorBoundary>
        </div>

        {/* Coach panel: desktop visible at lg+, mobile only if tab active */}
        <div className={cn(
          "shrink-0 border-l border-border/40 bg-accent/[0.03] lg:w-[300px] lg:flex lg:flex-col",
          mobileTab === "coach" ? "flex flex-col w-full" : "hidden lg:flex",
        )}>
          <ErrorBoundary
            fallback={
              <div className="flex-1 flex items-center justify-center p-4">
                <p className="text-xs text-muted-foreground text-center">The Coach encountered an error. Reload the page.</p>
              </div>
            }
          >
            <ChatPanel
              sources={sources}
              messages={messages}
              onMessagesChange={setMessages}
              conversationLoading={conversationLoading}
              onClearConversation={clearConversation}
              lastGeneratedContent={lastGeneratedContent}
              profile={profile}
            />
          </ErrorBoundary>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border/30 flex items-center justify-around px-2 py-1.5 pb-[max(env(safe-area-inset-bottom),0.375rem)]">
        <button
          onClick={() => setMobileTab("sources")}
          className={cn(
            "flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition-all relative",
            mobileTab === "sources" ? "text-primary" : "text-muted-foreground/60",
          )}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[9px] font-medium">Sources</span>
          {grouped.length > 0 && (
            <span className="absolute top-0 right-2 w-1.5 h-1.5 rounded-full bg-primary" />
          )}
        </button>

        <button
          onClick={() => setMobileTab("studio")}
          className={cn(
            "flex flex-col items-center gap-0.5 py-1.5 px-5 rounded-2xl transition-all",
            mobileTab === "studio"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "text-muted-foreground/60",
          )}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[9px] font-medium">Studio</span>
        </button>

        <button
          onClick={() => setMobileTab("coach")}
          className={cn(
            "flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition-all relative",
            mobileTab === "coach" ? "text-primary" : "text-muted-foreground/60",
          )}
        >
          <Bot className="w-5 h-5" />
          <span className="text-[9px] font-medium">Coach</span>
          {messages.length > 0 && (
            <span className="absolute top-0 right-2 w-1.5 h-1.5 rounded-full bg-primary" />
          )}
        </button>
      </nav>
    </DashboardLayout>
  );
};

export default Dashboard;
