import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { anthropic, CLAUDE_MODEL, SYSTEM_PROMPT } from "@/lib/anthropic";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestedPrompts = [
  "Résume mes sources",
  "Trouve les idées clés",
  "Génère un post LinkedIn",
  "Compare les points de vue",
];

const ChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const content = text || input.trim();
      if (!content || isLoading) return;

      setError(null);
      const userMsg: Message = {
        id: String(Date.now()),
        role: "user",
        content,
      };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

      // Build conversation history for the API
      const apiMessages: MessageParam[] = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const assistantId = String(Date.now() + 1);

      // Add empty assistant message that we'll stream into
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        abortRef.current = new AbortController();

        const stream = anthropic.messages.stream(
          {
            model: CLAUDE_MODEL,
            max_tokens: 2048,
            system: SYSTEM_PROMPT,
            messages: apiMessages,
          },
          { signal: abortRef.current.signal }
        );

        stream.on("text", (text) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: msg.content + text }
                : msg
            )
          );
        });

        await stream.finalMessage();
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;

        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";

        // Remove the empty assistant message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantId));
        setError(`Erreur de l'API Claude : ${errorMessage}`);
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [input, isLoading, messages]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="px-6 py-3.5 border-b border-border/20 flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <h2 className="text-sm font-medium text-foreground">Assistant IA</h2>
        <div className="ml-auto flex items-center gap-1.5">
          <div
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              isLoading ? "bg-amber-400/80 animate-pulse" : "bg-emerald-400/80"
            )}
          />
          <span className="text-[11px] text-muted-foreground">
            {isLoading ? "Claude réfléchit…" : "Claude Sonnet"}
          </span>
        </div>
      </div>

      {/* Messages or empty state */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center px-8 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-5">
              <Sparkles className="w-6 h-6 text-primary/70" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Comment puis-je t'aider ?
            </h3>
            <p className="text-sm text-muted-foreground text-center leading-relaxed mb-8">
              Ajoute des sources à gauche, puis pose-moi des questions pour
              analyser, résumer ou créer du contenu.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="px-3 py-2.5 rounded-xl border border-border/40 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 hover:border-border/60 transition-all text-left leading-snug"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 animate-fade-in",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-accent/50 text-foreground rounded-bl-md"
                  )}
                >
                  {msg.content ||
                    (isLoading && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="text-xs">Réflexion en cours…</span>
                      </div>
                    ))}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-accent/60 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border/20">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && sendMessage()
              }
              placeholder="Pose une question sur tes sources..."
              disabled={isLoading}
              className="w-full bg-accent/30 border border-border/30 rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all disabled:opacity-50"
            />
          </div>
          <Button
            size="icon"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="shrink-0 h-[46px] w-[46px] rounded-xl glow-sm disabled:opacity-30"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
          L'IA peut faire des erreurs. Vérifie les informations importantes.
        </p>
      </div>
    </div>
  );
};

export default ChatPanel;
