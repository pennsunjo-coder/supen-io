import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, Bot, User, Loader2, Trash2, Sparkles, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { callClaude } from "@/lib/anthropic";
import { sanitizeInput, createRateLimiter } from "@/lib/security";
import { assertOnline, friendlyError } from "@/lib/resilience";
import { getUserStyleMemory } from "@/lib/user-memory";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { buildAntiAiRules } from "@/lib/anti-ai-rules";
import type { Source } from "@/types/database";
import type { ConversationMessage } from "@/types/database";
import type { UserProfile } from "@/hooks/use-profile";

const MAX_MESSAGE_LENGTH = 4000;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_PERSISTED_MESSAGES = 10;

// ─── Strip all markdown formatting from AI responses ───

function cleanAIResponse(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^---+$/gm, "")
    .replace(/^===+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── Contextual suggestions based on platform ───

function getSuggestions(profile: UserProfile | null, lastContent?: string): string[] {
  if (lastContent) {
    return [
      "How can I improve this post?",
      "Rewrite the hook to be more punchy",
      "How do I turn this into a series?",
      "What's the best CTA for this?",
    ];
  }

  const platform = profile?.platforms?.[0]?.toLowerCase() || "";

  if (platform.includes("linkedin")) {
    return [
      "How do I make my LinkedIn hook stronger?",
      "Story post or framework post — which wins?",
      "How often should I post on LinkedIn?",
      "Give me 5 hooks for my next LinkedIn post",
    ];
  }
  if (platform.includes("tiktok") || platform.includes("instagram")) {
    return [
      "How do I hook viewers in 3 seconds?",
      "What CTA converts best for Reels?",
      "How to go from 1K to 10K followers?",
      "Give me a Reel script on my topic",
    ];
  }
  if (platform.includes("twitter") || platform.includes("x")) {
    return [
      "How do I write threads that go viral?",
      "Best time to post on X?",
      "How to get more replies on my tweets?",
      "Give me a thread structure for my niche",
    ];
  }

  return [
    "What platform should I focus on first?",
    "How do I find my content niche?",
    "Give me 5 hooks for my next post",
    "Why is my content not going viral?",
  ];
}

// ─── Enriched system prompt ───

function buildCoachPrompt(
  profile: UserProfile | null,
  sources: Source[],
  lastContent?: string,
  styleMemory?: string,
): string {
  const userName = profile?.first_name || "";
  const userNiche = profile?.niche || "";
  const userPlatforms = profile?.platforms?.join(", ") || "";

  let prompt = `You are an elite content strategist and personal coach for ${userName || 'this creator'}.

Your personality:
- Warm, direct, and energetic — like a mentor who genuinely cares
- You speak naturally, like a human expert, not a chatbot
- No bullet points unless absolutely necessary
- No asterisks, no markdown formatting in responses
- No generic advice — everything is specific to the user
- Short punchy sentences. Maximum 3-4 sentences per paragraph.
- You remember the user's niche and reference it naturally

Your expertise:
- Viral content strategy for LinkedIn, Instagram, TikTok, X, YouTube, Facebook
- Hook writing, storytelling, content angles
- Monetization and audience growth
- AI tools for content creation

What you do:
- Proactively suggest content ideas based on their niche
- Challenge their thinking with smart questions
- Give specific, actionable advice they can use today
- Reference current trends and what's working right now
- Never give vague or generic answers

What you NEVER do:
- Use bullet points or numbered lists as your main response format
- Start with "Great question!" or "Certainly!" or "Of course!"
- Give the same generic advice everyone else gives
- Use asterisks or markdown formatting
- Be repetitive or pad your answers

User's niche: ${userNiche || 'content creation and digital entrepreneurship'}
User's platforms: ${userPlatforms || 'LinkedIn, Instagram'}

When the user asks for content ideas, give 3 specific, creative ideas in conversational prose — not a bulleted list.

Keep responses under 150 words. If they ask for strategy, give a concrete 30-day plan. If they ask for feedback, be brutally honest. If they want to generate content, direct them to the Studio.

${buildAntiAiRules("standard")}`;

  if (sources.length > 0) {
    prompt += `\n\nSOURCES AVAILABLE (${sources.length}):`;
    for (const source of sources.slice(0, 5)) {
      const typeLabel = source.type === "pdf" ? "PDF" : source.type === "note" ? "Note" : "Source";
      prompt += `\n[${typeLabel}] ${source.title}: ${(source.content || "").slice(0, 1500)}`;
    }
    prompt += "\nUse these sources when relevant. Don't list them — weave them into your answer.";
  }

  if (lastContent) {
    prompt += `\n\nLATEST POST BY THE USER:\n${lastContent.slice(0, 1500)}\n\nGive specific feedback. What works, what doesn't, how to fix it. No fluff.`;
  }

  if (styleMemory) {
    prompt += `\n\n${styleMemory}`;
  }

  return prompt;
}

// ─── Welcome message builder ───

function buildWelcomeMessage(profile: UserProfile | null): string {
  const name = profile?.first_name || "";
  const niche = profile?.niche || "content creation";
  const platform = profile?.platforms?.[0] || "social media";

  const nicheIdeas: Record<string, string[]> = {
    "business": [
      "a 'founder mistake' story post — raw, honest, with a counterintuitive lesson",
      "a '3 things I'd tell my day-1 self' framework post with specifics from your journey",
      "a contrarian take on a popular business advice (like 'hustle culture is dead')",
    ],
    "tech": [
      "a 'before vs after AI' comparison that shows a real workflow transformation",
      "a hot take on the latest tech trend — why everyone's wrong about it",
      "a behind-the-scenes look at how you use AI tools daily (with specific results)",
    ],
    "marketing": [
      "a case study post breaking down a viral campaign and why it worked",
      "a 'what I'd do with $0 budget' strategy post for a specific platform",
      "a myth-busting post about a common marketing belief that's actually wrong",
    ],
    "health": [
      "a personal transformation story with specific numbers and timeline",
      "a 'what science actually says' post debunking a popular wellness myth",
      "a daily routine breakdown with one surprising habit that changed everything",
    ],
  };

  const nicheKey = Object.keys(nicheIdeas).find(k => niche.toLowerCase().includes(k));
  const ideas = nicheIdeas[nicheKey || ""] || [
    `a personal story post about your biggest lesson in ${niche}`,
    `a contrarian take on something everyone in ${niche} believes`,
    `a 'how I actually do it' behind-the-scenes post about your ${niche} process`,
  ];

  return `Hey${name ? ` ${name}` : ''}! I've been looking at what's working in ${niche} on ${platform} right now, and here are 3 content ideas that are crushing it:\n\n${ideas[0].charAt(0).toUpperCase() + ideas[0].slice(1)}. These get insane engagement because people crave authenticity.\n\n${ideas[1].charAt(0).toUpperCase() + ideas[1].slice(1)}. Contrarian angles are the #1 way to stop the scroll right now.\n\n${ideas[2].charAt(0).toUpperCase() + ideas[2].slice(1)}. Behind-the-scenes content builds trust faster than anything.\n\nWhich one resonates with you? I'll help you build it out.`;
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

  // Auto-send welcome message on first open (no persisted conversation)
  const welcomeSentRef = useRef(false);
  useEffect(() => {
    if (welcomeSentRef.current || conversationLoading || messages.length > 0) return;
    if (!profile?.niche) return; // wait for profile to load
    welcomeSentRef.current = true;
    const welcome = buildWelcomeMessage(profile);
    onMessagesChange(() => [{ role: "assistant" as const, content: welcome }]);
  }, [conversationLoading, messages.length, profile]);

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
      setError(`Limit: ${RATE_LIMIT_MAX} msg/min. Try again in ${wait}s.`);
      return;
    }

    try { assertOnline(); } catch (e) {
      setError(e instanceof Error ? e.message : "No internet connection.");
      return;
    }
    setError(null);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    const userMessage: ConversationMessage = { role: "user", content };
    const updatedMessages = [...messages, userMessage];
    onMessagesChange(() => updatedMessages);

    const apiMessages = updatedMessages.map((msg) => ({ role: msg.role as "user" | "assistant", content: msg.content }));

    try {
      const systemPrompt = buildCoachPrompt(profile || null, sources, lastGeneratedContent, styleMemory);
      const fullResponse = await callClaude(systemPrompt, apiMessages);
      const cleaned = cleanAIResponse(fullResponse);
      setStreamingContent("");
      onMessagesChange((prev) => [...prev, { role: "assistant", content: cleaned }]);
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
    <div className="flex flex-col h-full bg-sidebar-background">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border/40 flex items-center justify-between shrink-0 bg-sidebar-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-display font-black tracking-tight">AI Coach</h2>
            <div className="flex items-center gap-2">
              <div className={cn("w-1.5 h-1.5 rounded-full", isLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-500")} />
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{isLoading ? "Thinking..." : "Online"}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button onClick={() => {
              onClearConversation();
              if (user?.id) {
                supabase.from("coach_conversations").delete().eq("user_id", user.id).then(() => {});
              }
            }} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {isPersonalized && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20" title="Smart Context Enabled">
              <Brain className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 no-scrollbar">
        {conversationLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary/30" />
          </div>
        ) : isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center px-6 py-10">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 border border-primary/20 shadow-inner">
              <Sparkles className="w-10 h-10 text-primary/70" />
            </div>
            <h3 className="text-lg font-display font-black mb-2 text-center tracking-tight">
              {profile?.first_name ? `Let's work, ${profile.first_name}` : "Your AI Content Coach"}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-8 leading-relaxed font-medium">
              {profile?.niche
                ? `I'm your expert strategist for ${profile.niche}. How can we crush it today?`
                : "Ask me to refine your hooks, brainstorm ideas, or analyze your sources."}
            </p>
            
            <div className="flex flex-col gap-2.5 w-full">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1 ml-1">Suggestions</span>
              {suggestions.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="group flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-border/40 bg-card text-xs font-bold text-foreground/80 hover:text-primary hover:border-primary/40 hover:bg-primary/[0.02] transition-all text-left shadow-sm hover:shadow-md hover:scale-[1.01]"
                >
                  <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Sparkles className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                  </div>
                  <span className="truncate flex-1">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {messages.map((msg, index) => (
              <div key={index} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                <div className="flex items-center gap-2 mb-1.5 px-1">
                   <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                     {msg.role === "user" ? "You" : "Coach"}
                   </span>
                </div>
                <div className={cn(
                  "max-w-[90%] px-4 py-3.5 text-[14px] leading-relaxed whitespace-pre-wrap shadow-xl",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none shadow-primary/10 font-medium"
                    : "bg-card text-foreground rounded-2xl rounded-tl-none border border-border/60 shadow-black/[0.03]"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 mb-1.5 px-1">
                   <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">Coach is thinking...</span>
                </div>
                <div className="max-w-[90%] rounded-2xl rounded-tl-none px-5 py-4 bg-card text-foreground text-sm leading-relaxed border border-primary/20 shadow-2xl shadow-primary/5">
                  {streamingContent || (
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
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
        <div className="mx-4 mb-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20 text-[10px] font-bold text-destructive">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border/40 shrink-0 bg-sidebar-background/80 backdrop-blur-md">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask the coach anything..."
            maxLength={MAX_MESSAGE_LENGTH}
            disabled={isLoading}
            rows={1}
            className="w-full bg-card border border-border/60 rounded-2xl pl-4 pr-14 py-4 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/40 focus:bg-background transition-all disabled:opacity-50 resize-none overflow-hidden shadow-sm focus:shadow-xl"
          />
          <Button
            size="icon"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 h-10 w-10 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-20"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[9px] text-center text-muted-foreground/40 mt-3 font-bold uppercase tracking-[0.2em]">Press Enter to send</p>
      </div>
    </div>
  );
};

export default ChatPanel;
