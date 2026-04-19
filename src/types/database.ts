export interface Source {
  id: string;
  user_id: string;
  type: "url" | "note" | "pdf";
  title: string;
  content: string;
  file_path: string | null;
  directive?: string;
  created_at: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  messages: ConversationMessage[];
  created_at: string;
  updated_at: string;
}
