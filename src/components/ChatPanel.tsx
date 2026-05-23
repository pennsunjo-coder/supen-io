import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, Bot, User, Loader2, Trash2, Sparkles, Brain, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { callClaude, streamClaude } from "@/lib/anthropic";
import { sanitizeInput, createRateLimiter } from "@/lib/security";
import { assertOnline, friendlyError } from "@/lib/resilience";
import { getUserStyleMemory } from "@/lib/user-memory";
import { searchUserSources } from "@/lib/embeddings";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { buildAntiAiRules } from "@/lib/anti-ai-rules";
import type { Source } from "@/types/database";
import type { ConversationMessage } from "@/types/database";
import type { UserProfile } from "@/hooks/use-profile";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { withTimeout } from "@/lib/resilience";

const MAX_MESSAGE_LENGTH = 4000;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_PERSISTED_MESSAGES = 10;

// Reflow bullet lists into flowing prose. Numbered lists are left intact
// because they are a legitimate format for the viral posts the coach writes.
function collapseBulletLists(text: string): string {
  const isBullet = (l: string) => /^\s*[-*+•▪◦‣]\s+\S/.test(l);
  const strip = (l: string) => l.replace(/^\s*[-*+•▪◦‣]\s+/, "").trim();
  const lines = text.split("\n");
  const out: string[] = [];
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length === 0) return;
    const sentences = buffer
      .map(strip)
      .filter(Boolean)
      .map((s) => (/[.!?:]$/.test(s) ? s : `${s}.`));
    out.push(sentences.join(" "));
    buffer = [];
  };

  for (const line of lines) {
    if (isBullet(line)) buffer.push(line);
    else { flush(); out.push(line); }
  }
  flush();
  return out.join("\n");
}

function cleanAIResponse(text: string): string {
  let t = text;
  t = t.replace(/```[\s\S]*?```/g, "");                                 // code blocks
  t = t.replace(/`([^`]+)`/g, "$1");                                    // inline code
  t = t.replace(/^#{1,6}\s+/gm, "");                                    // headings
  t = t.replace(/^\s*>\s?/gm, "");                                      // blockquotes
  t = collapseBulletLists(t);                                           // bullet lists → prose (before stripping bullets)
  t = t.replace(/\*+/g, "");                                            // bold / italic / stray asterisks
  t = t.replace(/(^|[\s(])_{1,3}([^_]+?)_{1,3}(?=[\s).,!?:;]|$)/g, "$1$2"); // _italic_ / __bold__ (snake_case safe)
  t = t.replace(/^\s*(?:-{3,}|_{3,}|={3,})\s*$/gm, "");                 // horizontal rules
  // Remove AI filler phrases often seen at start/end
  t = t.replace(/^(Certainly|Sure|I can help with that|Of course|Here is|Sure!)\.?\s+/i, "");
  t = t.replace(/\s*(Hope this helps|Let me know if you need more|Let me know if you want to adjust any of these)\.?\s*$/i, "");
  t = t.replace(/\n{3,}/g, "\n\n");                                     // collapse blank lines
  return t.trim();
}

function getSuggestions(profile: UserProfile | null, lastContent?: string): string[] {
  if (lastContent) {
    return [
      "Improve this post hook",
      "Make it more punchy",
      "Turn this into a series",
      "Suggest a CTA",
    ];
  }
  return [
    "Content ideas for my niche",
    "How to go viral on LinkedIn?",
    "Review my latest post",
    "Strategy for growth",
  ];
}

function buildCoachPrompt(profile: UserProfile | null, sources: Source[], lastContent?: string, styleMemory?: string): string {
  const userName = profile?.first_name || "Creator";
  const niche = profile?.niche || "Content Creation";
  
  return `You are a world-class human content strategist mentoring ${userName} one on one. Their niche is "${niche}". You are NOT an AI and you never sound like one. You talk like a sharp creator friend texting back: direct, warm, specific, sometimes blunt.

How you write:
Plain text only. No asterisks, no bold, no italics, no headings, no bullet points. If you have several points, fold them into normal sentences. Use line breaks for white space, never markdown.
Keep it short. Usually two to four sentences. Lead with the actual answer, no warm up, no repeating the question back.
Be concrete. A real example, a real number, or a line they could paste straight into a post. Skip advice everyone already knows.
Have an opinion. Pick the one or two things that matter most instead of listing ten.
End with a short question only when it genuinely moves things forward.
When ${userName} asks you to write or rewrite a post, make it look exactly like a viral post: hook in line one, short lines, concrete, zero fluff, no markdown.

${styleMemory ? `STYLE TO MATCH (the user's own voice):\n${styleMemory}\n` : ""}
${buildAntiAiRules("strict")}

This is the voice. Study how these sound, then write like this.

User: My posts get no engagement, what am I doing wrong?
Coach: Probably not the writing. Nobody knows why they should care by the end of your first line, because you ease in. Open with the most useful or most surprising thing you have, then earn the rest. Paste your last hook here and I'll cut it down with you.

User: How often should I post on LinkedIn?
Coach: Three or four times a week beats daily if daily means filler. Consistency only pays off when each post is worth showing up for. Pick a rhythm you can hold for two months, then judge the numbers.

User: Give me content ideas for my account.
Coach: What does your audience get wrong every single week? Build around that. "Stop counting calories, count protein" travels way further than another five tips post. What mistake do you see most?

User: Can you make my caption sound more professional?
Coach: Careful, professional usually just means boring. Keep your voice, tighten it. Drop the caption here and I'll trim the dead words without flattening the personality.

GOAL: Help ${userName} create content that feels 100% human and 100% viral. If they ask to rewrite something, strip every AI pattern out of it.`;
}

const ChatPanel = ({ sources, messages, onMessagesChange, conversationLoading, onClearConversation, lastGeneratedContent, profile }: any) => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rateLimiter = useMemo(() => createRateLimiter(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS), []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = useCallback(async (text?: string) => {
    const content = sanitizeInput(text || input, MAX_MESSAGE_LENGTH);
    if (!content || isLoading) return;
    
    setInput("");
    setIsLoading(true);
    const userMsg: ConversationMessage = { role: "user", content };
    onMessagesChange((prev: any) => [...prev, userMsg]);

    try {
      assertOnline();
      let styleMemory = "";
      if (user) {
        styleMemory = await getUserStyleMemory(user.id, "LinkedIn");
      }

      // RAG: pull the most relevant chunks from the user's sources for this turn
      let sourceContext = "";
      const sourceIds: string[] = (sources || []).map((s: Source) => s.id).filter(Boolean);
      if (sourceIds.length > 0) {
        try {
          const ragResults = await searchUserSources(content, sourceIds, 6);
          if (ragResults.length > 0) {
            const seen = new Set<string>();
            sourceContext = ragResults
              .filter((r) => {
                const key = r.content?.slice(0, 80) ?? "";
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              })
              .map((r) => {
                const cleanTitle = r.title.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim();
                return `━━━ ${cleanTitle} ━━━\n${(r.content ?? "").slice(0, 2500)}`;
              })
              .join("\n\n");
          }
        } catch (e) {
          console.warn("[ChatPanel] RAG retrieval failed, continuing without source context:", e);
        }
      }

      const baseSystem = buildCoachPrompt(profile, sources, lastGeneratedContent, styleMemory);
      const system = sourceContext
        ? `${baseSystem}\n\n=== USER REFERENCE MATERIAL (ground every answer in these excerpts; cite the source title in plain text when you quote or paraphrase) ===\n${sourceContext}`
        : baseSystem;

      const history = messages.slice(-10);
      const apiMessages = [...history, userMsg].map(m => ({ role: m.role, content: m.content }));
      
      // Add empty assistant message placeholder
      onMessagesChange((prev: any) => [...prev, { role: "assistant", content: "" }]);
      
      let fullContent = "";
      const stream = streamClaude(system, apiMessages, { maxTokens: 1000, model: "gpt-4o" });
      
      for await (const chunk of stream) {
        fullContent += chunk;
        onMessagesChange((prev: any) => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            lastMsg.content = cleanAIResponse(fullContent);
          }
          return newMessages;
        });
      }
    } catch (err) {
      console.error("[ChatPanel] Error sending message:", err);
      toast.error(friendlyError(err));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, profile, sources, lastGeneratedContent, onMessagesChange, user]);

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border/40 flex items-center justify-between shrink-0 bg-card/20">
        <div>
          <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-primary mb-1">Creative Coach</h2>
          <div className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full", isLoading ? "bg-amber-400 animate-pulse" : "bg-primary")} />
            <span className="text-xs font-bold text-foreground">{isLoading ? "Analyzing..." : "Ready"}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClearConversation} className="h-8 w-8 rounded-lg hover:bg-card text-muted-foreground/30 hover:text-red-400 transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner border border-primary/20">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-black mb-2">Your Strategist</h3>
            <p className="text-[13px] text-muted-foreground font-medium mb-8 leading-relaxed">I'm here to sharpen your hooks and polish your ideas.</p>
            
            <div className="grid grid-cols-1 gap-2 w-full">
              {getSuggestions(profile).map(s => (
                <button key={s} onClick={() => sendMessage(s)} className="p-3 rounded-xl bg-card/40 border border-border/40 text-[11px] font-bold text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-card transition-all text-left">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg: any, i: number) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}
            >
              <div className={cn(
                "max-w-[90%] p-3 text-[13px] leading-relaxed",
                msg.role === "user" 
                  ? "bg-primary text-white rounded-2xl rounded-tr-none font-bold shadow-xl shadow-primary/20" 
                  : "bg-card/40 border border-border/40 text-foreground rounded-2xl rounded-tl-none"
              )}>
                {msg.content}
              </div>
            </motion.div>
          ))
        )}
        
        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="bg-white/[0.05] border border-white/5 p-5 rounded-[2rem] rounded-tl-none">
               <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border/40 bg-card/20">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Advice me..."
            rows={1}
            disabled={isLoading}
            className="w-full bg-card/40 border border-border/40 rounded-xl pl-4 pr-12 py-3 text-[13px] outline-none focus:border-primary focus:bg-card transition-all resize-none shadow-xl"
          />
          <Button 
            onClick={() => sendMessage()} 
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 top-1.5 h-7 w-7 rounded-lg bg-primary shadow-lg"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </div>
        <p className="text-[8px] text-center text-muted-foreground/30 mt-3 font-black uppercase tracking-[0.2em]">Enter to send</p>
      </div>
    </div>
  );
};

export default ChatPanel;
