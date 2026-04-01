import DashboardLayout from "@/components/DashboardLayout";
import SourcePanel from "@/components/SourcePanel";
import ChatPanel from "@/components/ChatPanel";
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
        <SourcePanel
          sources={sources}
          loading={sourcesLoading}
          onAddUrl={addUrl}
          onAddNote={addNote}
          onAddPdf={addPdf}
          onSearchWeb={searchWeb}
          onRemove={removeSource}
        />
        <ChatPanel
          sources={sources}
          messages={messages}
          onMessagesChange={setMessages}
          conversationLoading={conversationLoading}
          onClearConversation={clearConversation}
        />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
