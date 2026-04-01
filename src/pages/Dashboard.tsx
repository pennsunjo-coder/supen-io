import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import SourcePanel from "@/components/SourcePanel";
import ChatPanel from "@/components/ChatPanel";

const Dashboard = () => {
  const [sources, setSources] = useState<Array<{ id: string; type: string; title: string }>>([
    { id: "1", type: "note", title: "Product launch ideas" },
    { id: "2", type: "url", title: "competitor-analysis.com" },
  ]);

  return (
    <DashboardLayout>
      <div className="flex-1 flex overflow-hidden">
        <SourcePanel
          sources={sources}
          onAddSource={() => {
            setSources((prev) => [
              ...prev,
              { id: String(Date.now()), type: "note", title: "New note" },
            ]);
          }}
        />
        <div className="w-px bg-border/20" />
        <ChatPanel />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
