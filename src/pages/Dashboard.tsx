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

  return (
    <DashboardLayout>
      <div className="flex-1 flex min-h-0">
        {/* Colonne gauche — Sources (250px) */}
        <SourcePanel
          sources={sources}
          loading={sourcesLoading}
          onAddUrl={addUrl}
          onAddNote={addNote}
          onAddPdf={addPdf}
          onSearchWeb={searchWeb}
          onRemove={removeSource}
        />

        {/* Colonne centrale — Content Studio (flex-1) */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border/20">
          <StudioWizard />
        </div>

        {/* Colonne droite — Coach IA (300px) */}
        <div className="w-[300px] shrink-0">
          <ChatPanel
            sources={sources}
            messages={messages}
            onMessagesChange={setMessages}
            conversationLoading={conversationLoading}
            onClearConversation={clearConversation}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
