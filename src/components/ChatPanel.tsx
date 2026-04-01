import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, Sparkles, Bot, User, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { anthropic, CLAUDE_MODEL, SYSTEM_PROMPT } from "@/lib/anthropic";
import { sanitizeInput, createRateLimiter } from "@/lib/security";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import type { Source } from "@/types/database";
import type { ConversationMessage } from "@/types/database";

const MAX_MESSAGE_LENGTH = 4000;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

const suggestedPrompts = [
  "Résume mes sources",
  "Trouve les idées clés",
  "Génère un post LinkedIn",
  "Compare les points de vue",
];

interface ChatPanelProps {
  sources: Source[];
  messages: ConversationMessage[];
  onMessagesChange: (
    updater: (prev: ConversationMessage[]) => ConversationMessage[]
  ) => void;
  conversationLoading: boolean;
  onClearConversation: () => void;
}

function buildSystemPrompt(sources: Source[]): string {
  if (sources.length === 0) return SYSTEM_PROMPT;

  let context = "\n\n## Sources de recherche de l'utilisateur\n\n";

  for (const source of sources) {
    const typeLabel =
      source.type === "url" ? "Lien" : source.type === "pdf" ? "PDF" : "Note";
    context += `### [${typeLabel}] ${source.title}\n`;
    if (source.content) {
      context += `${source.content.slice(0, 3000)}\n`;
    }
    context += "\n";
  }

  context +=
    "Utilise ces sources pour répondre aux questions. Cite les sources quand c'est pertinent.";

  return SYSTEM_PROMPT + context;
}

const ChatPanel = ({
  sources,
  messages,
  onMessagesChange,
  conversationLoading,
  onClearConversation,
}: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const rateLimiter = useMemo(
    () => createRateLimiter(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS),
    []
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const raw = text || input.trim();
      if (!raw || isLoading) return;

      const content = sanitizeInput(raw, MAX_MESSAGE_LENGTH);
      if (!content) return;

      if (!rateLimiter.canProceed()) {
        const wait = Math.ceil(rateLimiter.getRemainingTime() / 1000);
        setError(
          `Limite atteinte : ${RATE_LIMIT_MAX} messages par minute. Réessaie dans ${wait}s.`
        );
        return;
      }

      setError(null);
      setInput("");
      setIsLoading(true);
      setStreamingContent("");

      // Ajouter le message utilisateur
      const userMessage: ConversationMessage = { role: "user", content };
      const updatedMessages = [...messages, userMessage];
      onMessagesChange(() => updatedMessages);

      // Construire l'historique pour l'API
      const apiMessages: MessageParam[] = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      try {
        abortRef.current = new AbortController();

        const stream = anthropic.messages.stream(
          {
            model: CLAUDE_MODEL,
            max_tokens: 2048,
            system: buildSystemPrompt(sources),
            messages: apiMessages,
          },
          { signal: abortRef.current.signal }
        );

        let fullResponse = "";

        stream.on("text", (text) => {
          fullResponse += text;
          setStreamingContent(fullResponse);
        });

        await stream.finalMessage();

        // Sauvegarder le message complet de l'assistant
        setStreamingContent("");
        const assistantMessage: ConversationMessage = {
          role: "assistant",
          content: fullResponse,
        };
        onMessagesChange((prev) => [...prev, assistantMessage]);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;

        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        setStreamingContent("");
        setError(`Erreur de l'API Claude : ${errorMessage}`);
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [input, isLoading, messages, sources, rateLimiter, onMessagesChange]
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const isEmpty = messages.length === 0 && !streamingContent;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="px-6 py-3.5 border-b border-border/20 flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <h2 className="text-sm font-medium text-foreground">Assistant IA</h2>
        <div className="ml-auto flex items-center gap-3">
          {messages.length > 0 && (
            <button
              onClick={onClearConversation}
              className="flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-destructive transition-colors"
              title="Nouvelle conversation"
            >
              <Trash2 className="w-3 h-3" />
              Effacer
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isLoading
                  ? "bg-amber-400/80 animate-pulse"
                  : "bg-emerald-400/80"
              )}
            />
            <span className="text-[11px] text-muted-foreground">
              {isLoading ? "Claude réfléchit…" : "Claude Sonnet"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages or empty state */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {conversationLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center px-8 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-5">
              <Sparkles className="w-6 h-6 text-primary/70" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Comment puis-je t'aider ?
            </h3>
            <p className="text-sm text-muted-foreground text-center leading-relaxed mb-2">
              Pose-moi des questions pour analyser, résumer ou créer du contenu.
            </p>
            {sources.length > 0 && (
              <p className="text-xs text-primary/70 mb-6">
                {sources.length} source{sources.length > 1 ? "s" : ""} active
                {sources.length > 1 ? "s" : ""}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 w-full mt-2">
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
            {messages.map((msg, index) => (
              <div
                key={index}
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
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-accent/60 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Streaming message */}
            {isLoading && (
              <div className="flex gap-3 animate-fade-in justify-start">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="max-w-[75%] rounded-2xl rounded-bl-md px-4 py-3 bg-accent/50 text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {streamingContent || (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-xs">Réflexion en cours…</span>
                    </div>
                  )}
                </div>
              </div>
            )}
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
              maxLength={MAX_MESSAGE_LENGTH}
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
