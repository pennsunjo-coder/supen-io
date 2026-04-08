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

  // Compteur de générations pour forcer le refetch
  const [genCount, setGenCount] = useState(0);

  // Detect upgrade success from Stripe redirect
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      const plan = searchParams.get("plan") || "Pro";
      toast.success(`Bienvenue sur ${plan.charAt(0).toUpperCase() + plan.slice(1)} ! Ton compte a ete mis a jour.`);
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
    // Invalider le cache pour forcer un vrai refetch
    invalidateCache("history:");
    invalidateCache("dashboard:");
    dashboard.refetch();
    activity.refetch();
    setGenCount((c) => c + 1);
  }, [dashboard, activity]);

  // Refetch quand genCount change (après reset du wizard qui revient à l'accueil)
  useEffect(() => {
    if (genCount > 0) {
      dashboard.refetch();
      activity.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genCount]);

  return (
    <DashboardLayout>
      <div className="flex-1 flex min-h-0">
        <div className="hidden md:block">
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

        <div className="flex-1 flex flex-col min-w-0">
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
        </div>

        <div className="hidden lg:block w-[300px] shrink-0 border-l border-border/40 bg-accent/[0.03]">
          <ChatPanel
            sources={sources}
            messages={messages}
            onMessagesChange={setMessages}
            conversationLoading={conversationLoading}
            onClearConversation={clearConversation}
            lastGeneratedContent={lastGeneratedContent}
            profile={profile}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
