import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Conversation, ConversationMessage } from "@/types/database";

export function useConversation() {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Charger ou créer la conversation active
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const { data } = await supabase
          .from("conversations")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          const conv = data as Conversation;
          setConversation(conv);
          setMessages(conv.messages ?? []);
        }
      } catch { /* table may not exist yet */ }
      setLoading(false);
    };

    load();
  }, [user]);

  // Sauvegarder les messages dans Supabase (debounced)
  const persistMessages = useCallback(
    (updatedMessages: ConversationMessage[]) => {
      if (!user) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          if (conversation) {
            await supabase
              .from("conversations")
              .update({
                messages: updatedMessages,
                updated_at: new Date().toISOString(),
              })
              .eq("id", conversation.id);
          } else {
            const { data } = await supabase
              .from("conversations")
              .insert({
                user_id: user.id,
                messages: updatedMessages,
              })
              .select()
              .maybeSingle();

            if (data) {
              setConversation(data as Conversation);
            }
          }
        } catch { /* table may not exist */ }
      }, 500);
    },
    [user, conversation]
  );

  const updateMessages = useCallback(
    (updater: (prev: ConversationMessage[]) => ConversationMessage[]) => {
      setMessages((prev) => {
        const next = updater(prev);
        persistMessages(next);
        return next;
      });
    },
    [persistMessages]
  );

  const clearConversation = useCallback(async () => {
    try {
      if (conversation) {
        await supabase
          .from("conversations")
          .delete()
          .eq("id", conversation.id);
      }
    } catch { /* table may not exist */ }
    setConversation(null);
    setMessages([]);
  }, [conversation]);

  return { messages, setMessages: updateMessages, loading, clearConversation };
}
