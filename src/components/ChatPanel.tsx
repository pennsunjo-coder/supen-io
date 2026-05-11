import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, Bot, User, Loader2, Trash2, Sparkles, Brain, X } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";

const MAX_MESSAGE_LENGTH = 4000;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_PERSISTED_MESSAGES = 10;

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
  return `You are an elite content strategist. Be direct, punchy, and ultra-professional. No markdown, no fluff. Reference the user as ${userName}. ${buildAntiAiRules("standard")}`;
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
      const system = buildCoachPrompt(profile, sources, lastGeneratedContent);
      const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const response = await callClaude(system, apiMessages);
      const cleaned = cleanAIResponse(response);
      onMessagesChange((prev: any) => [...prev, { role: "assistant", content: cleaned }]);
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, profile, sources, lastGeneratedContent]);

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="px-6 py-8 border-b border-white/5 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xs font-black tracking-[0.2em] uppercase text-primary mb-2">Creative Coach</h2>
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isLoading ? "bg-amber-400 animate-pulse" : "bg-primary")} />
            <span className="text-sm font-bold text-white">{isLoading ? "Analyzing..." : "Ready to strategist"}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClearConversation} className="h-10 w-10 rounded-xl hover:bg-white/5 text-muted-foreground/30 hover:text-red-400">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-6 py-8 space-y-8">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto">
            <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-8 shadow-inner border border-primary/20">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-black mb-3">Your Digital Strategist</h3>
            <p className="text-sm text-muted-foreground font-medium mb-10 leading-relaxed">I'm here to sharpen your hooks and polish your ideas. What's on your mind?</p>
            
            <div className="grid grid-cols-1 gap-2 w-full">
              {getSuggestions(profile).map(s => (
                <button key={s} onClick={() => sendMessage(s)} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-xs font-bold text-muted-foreground hover:text-white hover:border-primary/40 hover:bg-white/[0.06] transition-all text-left">
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
                "max-w-[85%] p-5 text-sm leading-relaxed",
                msg.role === "user" 
                  ? "bg-primary text-white rounded-[2rem] rounded-tr-none font-bold shadow-xl shadow-primary/20" 
                  : "bg-white/[0.05] border border-white/5 text-white rounded-[2rem] rounded-tl-none"
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
      <div className="p-6 border-t border-white/5">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Write a message..."
            rows={1}
            disabled={isLoading}
            className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] pl-6 pr-16 py-5 text-sm outline-none focus:border-primary focus:bg-white/[0.06] transition-all resize-none shadow-2xl"
          />
          <Button 
            onClick={() => sendMessage()} 
            disabled={!input.trim() || isLoading}
            className="absolute right-2.5 top-2.5 h-10 w-10 rounded-full bg-primary shadow-xl"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[9px] text-center text-muted-foreground/30 mt-4 font-black uppercase tracking-[0.2em]">Press Enter to send</p>
      </div>
    </div>
  );
};

export default ChatPanel;
