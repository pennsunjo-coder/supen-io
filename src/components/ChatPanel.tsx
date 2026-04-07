import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, Bot, User, Loader2, Trash2, Sparkles, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { anthropic, CLAUDE_MODEL, SYSTEM_PROMPT } from "@/lib/anthropic";
import { sanitizeInput, createRateLimiter } from "@/lib/security";
import { assertOnline, friendlyError } from "@/lib/resilience";
import { getUserStyleMemory } from "@/lib/user-memory";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import type { Source } from "@/types/database";
import type { ConversationMessage } from "@/types/database";
import type { UserProfile } from "@/hooks/use-profile";

const MAX_MESSAGE_LENGTH = 4000;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_PERSISTED_MESSAGES = 10;

// ─── Contextual suggestions ───

function getSuggestions(profile: UserProfile | null, lastContent?: string): string[] {
  const niche = profile?.niche || "";
  const platforms = profile?.platforms || [];
  const suggestions: string[] = [];

  if (lastContent) {
    suggestions.push("Analyse mon dernier contenu genere");
    suggestions.push("Comment ameliorer mon accroche ?");
  }

  if (niche.includes("Marketing")) {
    suggestions.push("3 hooks viraux pour le marketing digital");
    suggestions.push("Comment augmenter mon engagement ?");
  } else if (niche.includes("Tech") || niche.includes("IA")) {
    suggestions.push("Quels formats marchent le mieux en Tech ?");
    suggestions.push("Comment vulgariser un concept technique ?");
  } else if (niche.includes("Business") || niche.includes("Entrepreneur")) {
    suggestions.push("Partager mon expertise sans paraitre pretentieux");
    suggestions.push("Les meilleurs hooks pour LinkedIn");
  } else if (niche.includes("Finance")) {
    suggestions.push("Comment rendre la finance accessible ?");
    suggestions.push("Hooks pour du contenu finance");
  } else {
    suggestions.push(`Meilleures pratiques pour ${platforms[0] || "Instagram"}`);
    suggestions.push("Comment trouver des idees de contenu ?");
  }

  if (!lastContent) {
    suggestions.push("Resume mes sources");
    suggestions.push("Genere des hooks viraux");
  }

  return suggestions.slice(0, 4);
}

// ─── Enriched system prompt ───

function buildCoachPrompt(
  profile: UserProfile | null,
  sources: Source[],
  lastContent?: string,
  styleMemory?: string,
): string {
  const firstName = profile?.first_name || "ce createur";
  const niche = profile?.niche || "Non renseignee";
  const platforms = profile?.platforms?.join(", ") || "Non renseignees";

  let prompt = `Tu es le Coach IA personnel de ${firstName}.
${SYSTEM_PROMPT}

## PROFIL DE L'UTILISATEUR
Prenom : ${firstName}
Niche : ${niche}
Plateformes : ${platforms}

## TON ROLE
Tu es un coach bienveillant, direct et expert.
Tu connais les tendances, les algorithmes et ce qui performe.
Tu proposes des ameliorations concretes et actionnables.
Tu t'adaptes au niveau et au style de l'utilisateur.

## INSTRUCTIONS SPECIFIQUES
1. Reponds TOUJOURS en francais
2. Sois direct et concis — max 150 mots par reponse
3. Propose des exemples concrets adaptes a la niche ${niche}
4. Si tu vois le dernier contenu genere, analyse-le et propose des ameliorations
5. Pose UNE question de suivi pertinente a la fin de chaque reponse
6. Adapte tes conseils aux plateformes : ${platforms}`;

  if (sources.length > 0) {
    prompt += `\n\n## SOURCES DISPONIBLES (${sources.length})`;
    for (const source of sources.slice(0, 5)) {
      const typeLabel = source.type === "url" ? "Lien" : source.type === "pdf" ? "PDF" : "Note";
      prompt += `\n### [${typeLabel}] ${source.title}\n${(source.content || "").slice(0, 2000)}\n`;
    }
    prompt += "\nUtilise ces sources pour repondre. Cite-les quand c'est pertinent.";
  }

  if (lastContent) {
    prompt += `\n\n## DERNIER CONTENU GENERE\n${lastContent.slice(0, 1500)}\n\nTu peux l'aider a l'ameliorer, le reformuler, trouver un meilleur hook, ou adapter le ton.`;
  }

  if (styleMemory) {
    prompt += `\n\n${styleMemory}`;
  }

  return prompt;
}

// ─── Component ───

interface ChatPanelProps {
  sources: Source[];
  messages: ConversationMessage[];
  onMessagesChange: (updater: (prev: ConversationMessage[]) => ConversationMessage[]) => void;
  conversationLoading: boolean;
  onClearConversation: () => void;
  lastGeneratedContent?: string;
  profile?: UserProfile | null;
}

const ChatPanel = ({ sources, messages, onMessagesChange, conversationLoading, onClearConversation, lastGeneratedContent, profile }: ChatPanelProps) => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [styleMemory, setStyleMemory] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const rateLimiter = useMemo(() => createRateLimiter(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS), []);

  // Load style memory on mount
  useEffect(() => {
    if (user?.id && profile?.platforms?.[0]) {
      getUserStyleMemory(user.id, profile.platforms[0])
        .then(setStyleMemory)
        .catch(() => {});
    }
  }, [user?.id, profile?.platforms]);

  // Load persisted conversation on mount
  useEffect(() => {
    if (!user?.id || messages.length > 0) return;
    supabase
      .from("coach_conversations")
      .select("messages")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          onMessagesChange(() => data.messages as ConversationMessage[]);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Persist conversation after each exchange
  useEffect(() => {
    if (!user?.id || messages.length === 0) return;
    const trimmed = messages.slice(-MAX_PERSISTED_MESSAGES);
    supabase
      .from("coach_conversations")
      .upsert(
        { user_id: user.id, messages: trimmed, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      )
      .then(() => {})
      .catch(() => {});
  }, [user?.id, messages]);

  // Auto-scroll
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
      setError(`Limite : ${RATE_LIMIT_MAX} msg/min. Reessaie dans ${wait}s.`);
      return;
    }

    try { assertOnline(); } catch (e) {
      setError(e instanceof Error ? e.message : "Pas de connexion internet.");
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
      const systemPrompt = buildCoachPrompt(profile || null, sources, lastGeneratedContent, styleMemory);
      const stream = anthropic.messages.stream(
        { model: CLAUDE_MODEL, max_tokens: 2048, system: systemPrompt, messages: apiMessages },
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
      setError(friendlyError(err));
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading, messages, sources, lastGeneratedContent, profile, styleMemory, rateLimiter, onMessagesChange]);

  useEffect(() => { return () => { abortRef.current?.abort(); }; }, []);

  const isEmpty = messages.length === 0 && !streamingContent;
  const suggestions = useMemo(() => getSuggestions(profile || null, lastGeneratedContent), [profile, lastGeneratedContent]);
  const isPersonalized = !!(profile?.niche && profile?.platforms?.length);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2 shrink-0">
        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-primary" />
        </div>
        <div className="flex items-center gap-1.5">
          <h2 className="text-xs font-semibold">Coach IA</h2>
          {profile?.niche && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/70">
              {profile.niche.split(" ")[0]}
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {messages.length > 0 && (
            <button onClick={() => {
              onClearConversation();
              if (user?.id) {
                supabase.from("coach_conversations").delete().eq("user_id", user.id).then(() => {});
              }
            }} className="text-[10px] text-muted-foreground/50 hover:text-destructive transition-colors flex items-center gap-1">
              <Trash2 className="w-2.5 h-2.5" /> Effacer
            </button>
          )}
          <div className="flex items-center gap-1">
            {isPersonalized && (
              <Brain className="w-2.5 h-2.5 text-primary/50" />
            )}
            <div className={cn("w-1.5 h-1.5 rounded-full", isLoading ? "bg-amber-400/80 animate-pulse" : "bg-emerald-400/80")} />
            <span className="text-[10px] text-muted-foreground">{isLoading ? "Reflexion..." : "En ligne"}</span>
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
            <p className="text-xs font-medium text-foreground mb-0.5">
              {profile?.first_name ? `Salut ${profile.first_name}` : "Coach IA"}
            </p>
            <p className="text-[11px] text-muted-foreground text-center mb-4 leading-relaxed">
              {profile?.niche
                ? `Expert ${profile.niche}. Pose-moi une question ou demande un feedback.`
                : "Pose-moi une question sur tes sources, demande des hooks viraux, ou un feedback."}
            </p>
            {sources.length > 0 && (
              <p className="text-[10px] text-primary/70 mb-3">{sources.length} source{sources.length > 1 ? "s" : ""} chargee{sources.length > 1 ? "s" : ""}</p>
            )}
            <div className="grid grid-cols-1 gap-1.5 w-full">
              {suggestions.map((prompt) => (
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
                      <span className="text-[10px]">Reflexion...</span>
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
            placeholder="Demande au coach..."
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
