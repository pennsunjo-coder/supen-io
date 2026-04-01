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
      // Chercher la conversation la plus récente
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const conv = data as Conversation;
        setConversation(conv);
        setMessages(conv.messages ?? []);
      }
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
        if (conversation) {
          // Mettre à jour la conversation existante
          await supabase
            .from("conversations")
            .update({
              messages: updatedMessages,
              updated_at: new Date().toISOString(),
            })
            .eq("id", conversation.id);
        } else {
          // Créer une nouvelle conversation
          const { data } = await supabase
            .from("conversations")
            .insert({
              user_id: user.id,
              messages: updatedMessages,
            })
            .select()
            .single();

          if (data) {
            setConversation(data as Conversation);
          }
        }
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
    if (conversation) {
      await supabase
        .from("conversations")
        .delete()
        .eq("id", conversation.id);
    }
    setConversation(null);
    setMessages([]);
  }, [conversation]);

  return { messages, setMessages: updateMessages, loading, clearConversation };
}
