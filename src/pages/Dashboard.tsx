import { useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import SourcePanel from "@/components/SourcePanel";
import ChatPanel from "@/components/ChatPanel";
import StudioWizard from "@/components/StudioWizard";
import { useSources } from "@/hooks/use-sources";
import { useConversation } from "@/hooks/use-conversation";

const Dashboard = () => {
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
            onContentGenerated={setLastGeneratedContent}
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
