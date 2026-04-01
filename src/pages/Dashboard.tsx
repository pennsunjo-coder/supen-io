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
      <div className="flex-1 flex overflow-hidden">
        <SourcePanel
          sources={sources}
          loading={sourcesLoading}
          onAddUrl={addUrl}
          onAddNote={addNote}
          onAddPdf={addPdf}
          onRemove={removeSource}
        />
        <div className="w-px bg-border/20" />
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
