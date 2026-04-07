import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, Bot, User, Loader2, Trash2, Sparkles } from "lucide-react";
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

const defaultPrompts = [
  "Resume mes sources",
  "Trouve les idees cles",
  "Genere des hooks viraux",
  "Aide-moi a structurer",
];

const contentPrompts = [
  "Ameliore l'accroche",
  "Rends-le plus percutant",
  "Adapte pour un autre reseau",
  "Suggere un CTA",
];

interface ChatPanelProps {
  sources: Source[];
  messages: ConversationMessage[];
  onMessagesChange: (updater: (prev: ConversationMessage[]) => ConversationMessage[]) => void;
  conversationLoading: boolean;
  onClearConversation: () => void;
  lastGeneratedContent?: string;
}

function buildSystemPrompt(sources: Source[], lastGenerated?: string): string {
  let prompt = SYSTEM_PROMPT;

  if (sources.length > 0) {
    let context = "\n\n## Sources de recherche de l'utilisateur\n\n";
    for (const source of sources) {
      const typeLabel = source.type === "url" ? "Lien" : source.type === "pdf" ? "PDF" : "Note";
      context += `### [${typeLabel}] ${source.title}\n`;
      if (source.content) context += `${source.content.slice(0, 3000)}\n`;
      context += "\n";
    }
    context += "Utilise ces sources pour répondre aux questions. Cite les sources quand c'est pertinent.";
    prompt += context;
  }

  if (lastGenerated) {
    prompt += `\n\n## Dernier contenu généré par l'utilisateur\nL'utilisateur vient de générer ce contenu dans le Content Studio :\n\n${lastGenerated.slice(0, 2000)}\n\nTu peux l'aider à l'améliorer, le reformuler, trouver un meilleur hook, ou adapter le ton.`;
  }

  return prompt;
}

const ChatPanel = ({ sources, messages, onMessagesChange, conversationLoading, onClearConversation, lastGeneratedContent }: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const rateLimiter = useMemo(() => createRateLimiter(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS), []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamingContent]);

  const sendMessage = useCallback(async (text?: string) => {
    const raw = text || input.trim();
    if (!raw || isLoading) return;
    const content = sanitizeInput(raw, MAX_MESSAGE_LENGTH);
    if (!content) return;
    if (!rateLimiter.canProceed()) {
      const wait = Math.ceil(rateLimiter.getRemainingTime() / 1000);
      setError(`Limit: ${RATE_LIMIT_MAX} msg/min. Retry in ${wait}s.`);
      return;
    }

    setError(null);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    const userMessage: ConversationMessage = { role: "user", content };
    const updatedMessages = [...messages, userMessage];
    onMessagesChange(() => updatedMessages);

    const apiMessages: MessageParam[] = updatedMessages.map((msg) => ({ role: msg.role, content: msg.content }));

    try {
      abortRef.current = new AbortController();
      const stream = anthropic.messages.stream(
        { model: CLAUDE_MODEL, max_tokens: 2048, system: buildSystemPrompt(sources, lastGeneratedContent), messages: apiMessages },
        { signal: abortRef.current.signal },
      );
      let fullResponse = "";
      stream.on("text", (t) => { fullResponse += t; setStreamingContent(fullResponse); });
      await stream.finalMessage();
      setStreamingContent("");
      onMessagesChange((prev) => [...prev, { role: "assistant", content: fullResponse }]);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setStreamingContent("");
      setError(`Error: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading, messages, sources, lastGeneratedContent, rateLimiter, onMessagesChange]);

  useEffect(() => { return () => { abortRef.current?.abort(); }; }, []);

  const isEmpty = messages.length === 0 && !streamingContent;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2 shrink-0">
        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-primary" />
        </div>
        <h2 className="text-base font-semibold">Coach IA</h2>
        <div className="ml-auto flex items-center gap-2">
          {messages.length > 0 && (
            <button onClick={onClearConversation} className="text-[10px] text-muted-foreground/50 hover:text-destructive transition-colors flex items-center gap-1">
              <Trash2 className="w-2.5 h-2.5" /> Clear
            </button>
          )}
          <div className="flex items-center gap-1">
            <div className={cn("w-1.5 h-1.5 rounded-full", isLoading ? "bg-amber-400/80 animate-pulse" : "bg-emerald-400/80")} />
            <span className="text-[10px] text-muted-foreground">{isLoading ? "Thinking..." : "Online"}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {conversationLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mb-3">
              <Sparkles className="w-4 h-4 text-primary/70" />
            </div>
            <p className="text-xs font-medium text-foreground mb-1">Coach IA</p>
            <p className="text-[11px] text-muted-foreground text-center mb-4 leading-relaxed">
              Pose-moi une question sur tes sources, demande des hooks viraux, ou un feedback sur ton contenu.
            </p>
            {sources.length > 0 && (
              <p className="text-[10px] text-primary/70 mb-3">{sources.length} source{sources.length > 1 ? "s" : ""}</p>
            )}
            <div className="grid grid-cols-1 gap-1.5 w-full">
              {(lastGeneratedContent ? contentPrompts : defaultPrompts).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="px-3 py-2 rounded-lg border border-border/30 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent/40 hover:border-border/50 transition-all text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {messages.map((msg, index) => (
              <div key={index} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap",
                  msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-accent/50 text-foreground rounded-bl-sm",
                )}>
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-5 h-5 rounded-md bg-accent/60 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="max-w-[85%] rounded-xl rounded-bl-sm px-3 py-2 bg-accent/50 text-foreground text-[13px] leading-relaxed whitespace-pre-wrap">
                  {streamingContent || (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-[10px]">Thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-3 mb-2 px-2.5 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-[10px] text-destructive">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border/20 shrink-0">
        <div className="flex gap-1.5 items-end">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask the coach..."
            maxLength={MAX_MESSAGE_LENGTH}
            disabled={isLoading}
            className="flex-1 bg-accent/30 border border-border/30 rounded-lg px-3 py-2 text-[13px] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="shrink-0 h-[34px] w-[34px] rounded-lg glow-sm disabled:opacity-30"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
