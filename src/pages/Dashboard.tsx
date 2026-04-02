import { useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import SourcePanel from "@/components/SourcePanel";
import ChatPanel from "@/components/ChatPanel";
import StudioWizard from "@/components/StudioWizard";
import { useSources } from "@/hooks/use-sources";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { useDashboard } from "@/hooks/use-dashboard";
import { useActivity } from "@/hooks/use-activity";

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

  const handleToggleSource = useCallback((id: string) => {
    setActiveSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleGenerationComplete = useCallback(() => {
    dashboard.refetch();
    activity.refetch();
  }, [dashboard, activity]);

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
