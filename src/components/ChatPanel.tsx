import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, Bot, User, Loader2, Trash2, Sparkles, Brain, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { callClaude, streamClaude } from "@/lib/anthropic";
import { sanitizeInput, createRateLimiter } from "@/lib/security";
import { assertOnline, friendlyError } from "@/lib/resilience";
import { getUserStyleMemory } from "@/lib/user-memory";
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

function cleanAIResponse(text: string): string {
  return text
    // Remove all markdown formatting artifacts
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
    // Remove AI filler phrases often seen at start/end
    .replace(/^(Certainly|Sure|I can help with that|Of course|Here is|Sure!)\.?\s+/i, "")
    .replace(/\s*(Hope this helps|Let me know if you need more|Let me know if you want to adjust any of these)\.?\s*$/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
  
  return `You are NOT an AI. You are a world-class human content strategist and mentor.
Your voice is direct, high-status, and human. 

CRITICAL DIRECTIVES:
1. NEVER use markdown bolding (**), italics (*), or headers (###). Humans writing in chats don't do that.
2. NEVER use AI filler (Certainly, Delve, Tapestry, Landscape). 
3. Speak in plain text. Use line breaks for white space.
4. If you write content, it MUST look exactly like a viral post: hook-heavy, line-break-optimized, concrete, and zero fluff.
5. Reference the user as ${userName}. You know their niche is "${niche}".

${styleMemory ? `STRICT STYLE TO FOLLOW:\n${styleMemory}` : ""}

${buildAntiAiRules("strict")}

GOAL: Help the user generate content that feels 100% human and 100% viral. If they ask to rewrite something, strip away all "AI patterns".`;
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

      const system = buildCoachPrompt(profile, sources, lastGeneratedContent, styleMemory);
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
            lastMsg.content = fullContent;
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
