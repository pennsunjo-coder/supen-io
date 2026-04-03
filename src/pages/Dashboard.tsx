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

const Dashboard = () => {
  const { profile } = useProfile();
  const {
    sources,
    loading: sourcesLoading,
    addUrl,
    addNote,
    addPdf,
    searchWeb,
    removeSource,
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

  const handleToggleSource = useCallback((id: string) => {
    setActiveSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
  }, [genCount]);

  return (
    <DashboardLayout>
      <div className="flex-1 flex min-h-0">
        <SourcePanel
          sources={sources}
          loading={sourcesLoading}
          activeSourceIds={activeSourceIds}
          onToggleSource={handleToggleSource}
          onAddUrl={addUrl}
          onAddNote={addNote}
          onAddPdf={addPdf}
          onSearchWeb={searchWeb}
          onRemove={removeSource}
        />

        <div className="flex-1 flex flex-col min-w-0 border-r border-border/20">
          <StudioWizard
            activeSourceIds={Array.from(activeSourceIds)}
            sources={sources}
            profile={profile}
            topContent={dashboard.topContent}
            onUpdateImagePrompt={dashboard.updateImagePrompt}
            activityData={activity}
            onContentGenerated={setLastGeneratedContent}
            onGenerationComplete={handleGenerationComplete}
          />
        </div>

        <div className="w-[300px] shrink-0">
          <ChatPanel
            sources={sources}
            messages={messages}
            onMessagesChange={setMessages}
            conversationLoading={conversationLoading}
            onClearConversation={clearConversation}
            lastGeneratedContent={lastGeneratedContent}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
