import { useNavigate, Link } from "react-router-dom";
import threadsLogo from "@/assets/threads-logo.png";
import { Button } from "@/components/ui/button";
import {
  Zap, ArrowRight, Sparkles, BookOpen, Wand2, Shield,
  Youtube, FileText, Globe, MessageSquare, Check, Star,
  ChevronDown, Twitter, Instagram, Linkedin, Mail,
  Layers, Target, PenTool, BarChart3, Users, Sun, Moon, Gift,
  X as XIcon, Brain, TrendingUp, Clock, CreditCard, CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { LogoFull } from "@/components/Logo";
import { WaitlistPopup } from "@/components/WaitlistPopup";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ROTATING_WORDS = ["Viral", "Compelling", "Human", "Irresistible"];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const }
  })
};

const features = [
  { icon: Sparkles, title: "5 variations instantly", desc: "One topic, five angles. Pick the best one and post." },
  { icon: Globe, title: "Platform-optimized", desc: "LinkedIn, Instagram, X, TikTok. Each format nailed." },
  { icon: Shield, title: "AI that sounds human", desc: "No AI smell. Real voice. Real engagement." },
  { icon: Layers, title: "Infographic generator", desc: "Turn any post into a shareable visual in seconds." },
  { icon: Brain, title: "Style memory", desc: "AI learns your voice. Gets better every generation." },
  { icon: CalendarDays, title: "Content calendar", desc: "Plan, schedule, and never miss a posting day." },
];

const testimonials = [
  { name: "Nadia Okonkwo", role: "Consultant · London, UK", image: "https://randomuser.me/api/portraits/women/23.jpg", text: "Supenli.ai transformed the way I create. I focus on ideas, the AI handles the rest. My LinkedIn engagement tripled." },
  { name: "Marcus Johnson", role: "Content Strategist · New York, USA", image: "https://randomuser.me/api/portraits/men/32.jpg", text: "I generate 5 variations in 30 seconds. Before, I used to spend 2 hours on a single LinkedIn post. Game over for writer's block." },
  { name: "Elena Torres", role: "Digital Marketer · Washington, USA", image: "https://randomuser.me/api/portraits/women/68.jpg", text: "The Anti-AI mode is mind-blowing. Even my most demanding clients detect nothing. My content finally sounds human." },
];

const resultsData = [
  { src: "/results/Screenshot_2026-04-02_003014.png", stat: "2.7K likes · 649 shares", platform: "Facebook", tier: "green" },
  { src: "/results/Screenshot_2026-04-02_003201.png", stat: "3.2K likes · 5K shares", platform: "Facebook", tier: "green" },
  { src: "/results/Screenshot_2026-04-02_003257.png", stat: "260K likes · 230K shares", platform: "Facebook", tier: "gold" },
  { src: "/results/Screenshot_2026-04-02_003356.png", stat: "7.2K likes · 7.1K shares", platform: "Facebook", tier: "green" },
  { src: "/results/Screenshot_2026-04-02_003931.png", stat: "1.1K likes · 230 shares", platform: "Facebook", tier: "cyan" },
  { src: "/results/Screenshot_2026-04-02_004452.png", stat: "630 reactions · 44 reposts", platform: "LinkedIn", tier: "cyan" },
  { src: "/results/Screenshot_2026-04-02_004606.png", stat: "624 reactions · 63 reposts", platform: "LinkedIn", tier: "cyan" },
  { src: "/results/Screenshot_2026-04-02_004655.png", stat: "697 reactions · 93 reposts", platform: "LinkedIn", tier: "cyan" },
  { src: "/results/Screenshot_2026-04-02_004737.png", stat: "8,810 reactions · 1,350 reposts", platform: "LinkedIn", tier: "cyan" },
  { src: "/results/Screenshot_2026-04-02_005007.png", stat: "850M+ views · 30K likes", platform: "X (Twitter)", tier: "gold" },
  { src: "/results/Screenshot_2026-04-02_005138.png", stat: "1.6M views · 9.8K likes", platform: "X (Twitter)", tier: "gold" },
  { src: "/results/Screenshot_2026-04-02_005256.png", stat: "257K views · 2.2K likes", platform: "X (Twitter)", tier: "green" },
];
const tierColors = { gold: "bg-amber-500/90", green: "bg-emerald-500/90", cyan: "bg-primary/90" };

// Testimonials displayed as a simple 3-column row

const plans = [
  {
    name: "Free",
    icon: Gift,
    price: "$0",
    period: "/month",
    desc: "Try Supenli.ai risk-free",
    features: ["YouTube Transcriber (1 video/day)", "Platform preview", "No credit card required"],
    cta: "Get started free",
    highlighted: false,
    rotation: "rotate-[-1deg]",
  },
  {
    name: "Plus",
    icon: Sparkles,
    price: "$11",
    period: "/month",
    desc: "For solo creators who want to grow fast",
    features: [
      "100 generations per month",
      "All 6 platforms (IG, TikTok, FB, LinkedIn, YT, X)",
      "5 viral variations per generation",
      "Anti-AI humanization — undetectable content",
      "Unlimited content history",
      "Upload your documents (PDF, URL, notes)",
      "RAG — AI trained on YOUR content",
      "Image & infographic prompt generator",
    ],
    cta: "Start for $11/month →",
    highlighted: true,
    rotation: "rotate-[1deg]",
  },
  {
    name: "Pro",
    icon: Users,
    price: "$30",
    period: "/month",
    desc: "For agencies and content teams",
    features: ["Everything in Plus", "Unlimited generations", "3 team members", "Shared workspaces", "Advanced analytics", "Dedicated onboarding", "Dedicated support"],
    cta: "Get Pro →",
    highlighted: false,
    rotation: "rotate-[-2deg]",
  },
];

const faqs = [
  { q: "Does it really sound human?", a: "Yes. Supenli.ai uses advanced anti-AI protocols. No 'delve', no 'tapestry', no corporate jargon. Just clean, direct writing that sounds like you." },
  { q: "Which platforms are supported?", a: "LinkedIn, Instagram, X (Twitter), TikTok, Facebook, and YouTube. Each platform gets its own optimized format and tone." },
  { q: "How is this different from ChatGPT?", a: "ChatGPT gives you one generic answer. Supenli.ai gives you 5 variations with different angles, scores them for virality, and remembers your style over time." },
  { q: "Can I generate infographics too?", a: "Infographics are available for Facebook and LinkedIn posts only. For other platforms, you can generate custom images using your own prompt." },
  { q: "Is my content private?", a: "Your content belongs to you. We never train our models on your data. Everything is encrypted and stored securely." },
  { q: "What's the free plan?", a: "The free plan gives you access to content generation, the AI coach, and basic infographics. No credit card required to start." },
];

const PlatformX = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const PlatformInstagram = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const PlatformLinkedIn = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);
const PlatformYouTube = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);
const PlatformFacebook = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const PlatformThreads = () => (
  <img src={threadsLogo} alt="Threads" className="w-5 h-5 invert" />
);
const PlatformTikTok = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.7a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.13z"/></svg>
);

const platforms = [
  { name: "X / Twitter", icon: PlatformX },
  { name: "Instagram", icon: PlatformInstagram },
  { name: "LinkedIn", icon: PlatformLinkedIn },
  { name: "YouTube", icon: PlatformYouTube },
  { name: "Facebook", icon: PlatformFacebook },
  { name: "Threads", icon: PlatformThreads },
  { name: "TikTok", icon: PlatformTikTok },
  { name: "Newsletter", icon: null },
];

// Animated counter that counts up when scrolled into view
function AnimatedCounter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [value, setValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useState<HTMLSpanElement | null>(null);
  const [el, setEl] = useState<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!el || hasAnimated) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.floor(end * eased));
            if (progress < 1) requestAnimationFrame(tick);
            else setValue(end);
          };
          tick();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [el, end, duration, hasAnimated]);

  const formatted = value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k` : value.toLocaleString("en-US");

  return <span ref={setEl}>{formatted}{suffix}</span>;
}

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [wordIdx, setWordIdx] = useState(0);
  const [showWaitlist, setShowWaitlist] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIdx((i) => (i + 1) % ROTATING_WORDS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30 selection:text-primary font-sans relative overflow-x-hidden">
      {/* Premium Atmospheric Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(36,168,155,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(36,168,155,0.02),transparent_70%)]" />
      </div>

      {/* ═══════════ NAVBAR (sticky) ═══════════ */}
      <nav className="sticky top-0 z-50 transition-all duration-300">
        <div className="absolute inset-0 bg-background/60 backdrop-blur-xl border-b border-white/[0.05]" />
        <div className="relative max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="hover:opacity-80 transition-all active:scale-95 shrink-0" onDoubleClick={() => navigate("/login")}>
            <LogoFull size="sm" />
          </Link>
          
          <div className="hidden md:flex items-center gap-1 p-1 bg-white/[0.02] border border-white/[0.05] rounded-full backdrop-blur-md">
            {[
              { label: "Features", href: "#features" },
              { label: "Results", href: "#results" },
              { label: "Pricing", href: "#pricing" },
              { label: "FAQ", href: "#faq" },
            ].map((item) => (
              <a 
                key={item.label} 
                href={item.href} 
                className="px-5 py-2 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-all duration-200"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className="flex w-10 h-10 rounded-full items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.05] border border-transparent hover:border-white/[0.05] transition-all"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Button 
              size="sm" 
              onClick={() => navigate("/login")} 
              className="bg-primary text-primary-foreground hover:brightness-110 active:scale-95 rounded-full px-6 h-10 text-sm font-bold shadow-lg shadow-primary/25 transition-all"
            >
              Get started free
            </Button>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative pt-24 pb-32 md:pt-32 md:pb-40 px-6 overflow-hidden">
        {/* Refined Decorative Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 blur-[150px] rounded-full pointer-events-none opacity-40 animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none opacity-30" />
        
        <motion.div
          className="relative z-10 max-w-5xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {/* Badge pill */}
          <motion.div variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md mb-10"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-foreground/70">
              <span className="text-primary mr-1">New:</span> AI-powered infographics
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1}
            className="font-display text-4xl md:text-6xl lg:text-7xl leading-[1.1] mb-6 tracking-display font-extrabold"
          >
            <span className="block text-foreground/90">Your Content</span>
            <span className="block">Deserves to Go</span>
            <span className="relative inline-block mt-2">
              <AnimatePresence mode="wait">
                <motion.span
                  key={ROTATING_WORDS[wordIdx]}
                  initial={{ y: "30%", opacity: 0, filter: "blur(8px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: "-30%", opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  className="text-primary inline-block italic"
                >
                  {ROTATING_WORDS[wordIdx]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2}
            className="text-sm md:text-base text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed font-medium opacity-60"
          >
            Stop spending 2 hours on a single post. Generate 5 viral variations in 30 seconds — for LinkedIn, Instagram, TikTok, X, YouTube & Facebook.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={() => navigate("/login")} className="bg-foreground text-background hover:scale-[1.02] active:scale-95 h-12 px-8 text-sm font-bold rounded-full group transition-all shadow-xl">
              Start Creating Free
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <div className="flex -space-x-2.5 items-center">
              {[23, 32, 68, 44].map((i) => (
                <img key={i} src={`https://randomuser.me/api/portraits/men/${i}.jpg`} className="w-9 h-9 rounded-full border-2 border-background object-cover" alt="User" />
              ))}
              <div className="flex flex-col items-start ml-4 text-left">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 text-primary fill-primary" />)}
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">2,400+ creators</span>
              </div>
            </div>
          </motion.div>

          {/* Marquee */}
          <motion.div variants={fadeUp} custom={4} className="mt-32 relative group opacity-60">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10 pointer-events-none" />
            <div className="overflow-hidden py-4 border-y border-white/[0.03]">
              <div className="animate-marquee flex gap-12 w-max text-foreground/20 text-[10px] font-black tracking-[0.4em] uppercase items-center">
                {[...Array(3)].map((_, k) => (
                  <div key={k} className="flex gap-12 items-center">
                    <span>Viral Content</span><span className="text-primary/30">•</span>
                    <span>Anti-AI Protocol</span><span className="text-primary/30">•</span>
                    <span>6 Platforms</span><span className="text-primary/30">•</span>
                    <span>RAG Powered</span><span className="text-primary/30">•</span>
                    <span>Human Voice</span><span className="text-primary/30">•</span>
                    <span>5 Variations</span><span className="text-primary/30">•</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════ PLATFORMS ═══════════ */}
      <section className="py-16 relative bg-white/[0.005] border-y border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[10px] font-black text-primary/60 uppercase tracking-[0.4em] mb-10">Universal Compatibility</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-8 items-center justify-items-center opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            {platforms.map((p) => (
              <div key={p.name} className="flex flex-col items-center gap-2.5 group cursor-default">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.05] group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-300 text-muted-foreground group-hover:text-primary">
                  {p.icon ? <p.icon /> : <Mail className="w-4 h-4" />}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { end: 50000, suffix: "+", label: "Content generated" },
              { end: 2500, suffix: "+", label: "Active creators" },
              { end: 98, suffix: "%", label: "Satisfaction rate" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative p-8 glass-card text-center group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="font-display text-6xl font-black text-primary tracking-tighter mb-3">
                  <AnimatedCounter end={stat.end} suffix={stat.suffix} />
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground/80 transition-colors">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section id="features" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-[0.3em] mb-4">Capabilities</span>
            <h2 className="font-display text-3xl md:text-5xl font-black mb-4 tracking-display">Everything you need to <span className="italic text-primary">go viral</span></h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm font-medium opacity-60">From research to publishing, Supenli.ai handles the entire content creation workflow.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }}
                className="group relative p-6 rounded-2xl bg-card/20 border border-border/40 hover:bg-card/40 transition-all duration-500 overflow-hidden"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <f.icon className="w-4 h-4" />
                </div>
                <h3 className="font-display text-base font-bold mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-medium text-xs group-hover:text-foreground/80 transition-colors">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ COMPARISON ═══════════ */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 block">Market Standard</span>
            <h2 className="font-display text-4xl md:text-5xl font-black mb-6 tracking-display">Why <span className="text-primary">Supenli.ai</span>?</h2>
            <p className="text-muted-foreground text-base font-medium opacity-60">Compare with other AI content creation tools.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="rounded-3xl border border-border/40 bg-card/10 backdrop-blur-xl overflow-hidden shadow-2xl"
          >
            <div className="grid grid-cols-5 border-b border-border/40 bg-card/40">
              <div className="px-6 py-4 text-[8px] font-black uppercase tracking-widest text-muted-foreground">Feature</div>
              {["Supenli.ai", "ChatGPT", "Jasper", "Claude"].map((name, i) => (
                <div key={name} className="px-6 py-4 text-center">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${i === 0 ? "text-primary" : "text-muted-foreground/40"}`}>{name}</span>
                </div>
              ))}
            </div>
            {[
              { feature: "RAG on your sources", supen: true, chatgpt: false, jasper: false, claude: false },
              { feature: "Personalized AI Coach", supen: true, chatgpt: false, jasper: false, claude: false },
              { feature: "Auto infographics", supen: true, chatgpt: false, jasper: false, claude: false },
              { feature: "Style memory", supen: true, chatgpt: false, jasper: false, claude: false },
              { feature: "Real viral scoring", supen: true, chatgpt: false, jasper: false, claude: false },
              { feature: "Real-time trends", supen: true, chatgpt: false, jasper: false, claude: false },
              { feature: "5 variations per topic", supen: true, chatgpt: false, jasper: true, claude: false },
              { feature: "Anti-AI detector", supen: true, chatgpt: false, jasper: false, claude: false },
            ].map((row, i) => (
              <div key={i} className={cn("grid grid-cols-5 border-b border-border/20 last:border-b-0", i % 2 === 0 ? "bg-transparent" : "bg-muted/10")}>
                <div className="px-6 py-3 text-[10px] font-bold text-foreground/70">{row.feature}</div>
                <div className="px-6 py-3 flex items-center justify-center">
                  {row.supen ? <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-primary" /></div> : <XIcon className="w-2.5 h-2.5 text-muted-foreground/10" />}
                </div>
                <div className="px-6 py-3 flex items-center justify-center">
                  {row.chatgpt ? <Check className="w-3 h-3 text-emerald-500/50" /> : <XIcon className="w-2.5 h-2.5 text-muted-foreground/10" />}
                </div>
                <div className="px-6 py-3 flex items-center justify-center">
                  {row.jasper ? <Check className="w-3 h-3 text-emerald-500/50" /> : <XIcon className="w-2.5 h-2.5 text-muted-foreground/10" />}
                </div>
                <div className="px-6 py-3 flex items-center justify-center">
                  {row.claude ? <Check className="w-3 h-3 text-emerald-500/50" /> : <XIcon className="w-2.5 h-2.5 text-muted-foreground/10" />}
                </div>
              </div>
            ))}
            <div className="grid grid-cols-5 bg-primary/10 border-t border-primary/20">
              <div className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Monthly price</div>
              <div className="px-6 py-4 text-center text-sm font-black text-primary">$11</div>
              <div className="px-6 py-4 text-center text-xs font-bold text-muted-foreground/40">$20</div>
              <div className="px-6 py-4 text-center text-xs font-bold text-muted-foreground/40">$49</div>
              <div className="px-6 py-4 text-center text-xs font-bold text-muted-foreground/40">$20</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 block">Success Stories</span>
            <h2 className="font-display text-4xl md:text-5xl font-black mb-6 tracking-display">What our <span className="text-primary">creators</span> say</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                className="p-8 glass-card relative group hover:bg-white/[0.04] transition-all duration-500"
              >
                <MessageSquare className="absolute top-6 right-6 w-6 h-6 text-primary/5" />
                <p className="text-base text-foreground/70 leading-relaxed font-medium mb-8">"{t.text}"</p>
                <div className="flex items-center gap-3.5 border-t border-white/[0.05] pt-6">
                  <img src={t.image} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-primary/20" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ RESULTS ═══════════ */}
      <section id="results" className="py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <div className="inline-block px-4 py-1 rounded-full bg-primary/10 text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-6">Battle Tested</div>
            <h2 className="font-display text-4xl md:text-7xl font-black mb-6 tracking-display">The numbers speak <span className="italic text-primary">for themselves.</span></h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
            {[
              { num: "260K+", label: "Likes", icon: Star },
              { num: "850M+", label: "Views", icon: Youtube },
              { num: "50K", label: "Shares", icon: Globe },
              { num: "8,810", label: "Reactions", icon: Sparkles },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="glass-card p-6 flex flex-col items-center text-center group hover:bg-primary/10 transition-all duration-500"
              >
                <div className="w-9 h-9 rounded-lg bg-white/[0.02] flex items-center justify-center mb-4 text-muted-foreground group-hover:text-primary transition-colors">
                  <s.icon className="w-4 h-4" />
                </div>
                <p className="font-display text-3xl font-black text-foreground mb-1 tracking-tighter">{s.num}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="h-[800px] overflow-hidden relative rounded-3xl border border-white/[0.05]">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10 pointer-events-none" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6">
              {[0, 1, 2].map((col) => (
                <motion.div 
                  key={col}
                  animate={{ y: col % 2 === 0 ? ["0%", "-50%"] : ["-50%", "0%"] }} 
                  transition={{ duration: 45 + col * 5, repeat: Infinity, ease: "linear" }} 
                  className="flex flex-col gap-6"
                >
                  {[...resultsData, ...resultsData].map((r, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden border border-white/[0.08] hover:border-primary/40 transition-all duration-500 bg-black/20 group">
                      <img src={r.src} alt={`${r.platform} result`} className="w-full h-auto block opacity-80 group-hover:opacity-100 transition-opacity" style={{ objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }} />
                      <div className="p-4 bg-white/[0.02] flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{r.platform}</span>
                        <span className="text-[9px] font-bold text-primary">{r.stat}</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto relative">
          <motion.div className="text-center mb-24"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block">Fair Pricing</span>
            <h2 className="font-display text-5xl md:text-6xl font-black mb-6 tracking-display">Start free. <span className="text-primary">Scale fast.</span></h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan, i) => {
              const PlanIcon = plan.icon;
              return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={cn(
                  "p-8 rounded-3xl border transition-all duration-500 flex flex-col",
                  plan.highlighted ? "border-primary bg-card shadow-2xl shadow-primary/10 scale-105" : "bg-card/20 border-border/40"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-8 transition-all",
                  plan.highlighted ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted text-muted-foreground"
                )}>
                  <PlanIcon className="w-6 h-6" />
                </div>

                <h3 className="font-display text-xl font-black mb-1.5">{plan.name}</h3>
                <p className="text-xs font-medium text-muted-foreground/60 mb-6">{plan.desc}</p>

                <div className="flex items-baseline gap-2 mb-8">
                  <span className="font-display text-4xl font-black tracking-tighter">{plan.price}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{plan.period}</span>
                </div>

                <div className="space-y-3 mb-10 flex-1">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-3">
                      <Check className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", plan.highlighted ? "text-primary" : "text-muted-foreground/30")} />
                      <span className="text-xs font-bold text-foreground/70 leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => navigate("/login")}
                  className={cn(
                    "w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                    plan.highlighted 
                      ? "bg-primary text-primary-foreground hover:brightness-110 shadow-lg" 
                      : "bg-muted text-foreground hover:bg-muted/80"
                  )}
                >
                  {plan.cta}
                </Button>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-4 block">Knowledge Base</span>
            <h2 className="font-display text-4xl md:text-6xl font-black mb-6 tracking-display">Questions? <span className="italic text-primary">Answers.</span></h2>
          </motion.div>

          <div className="grid gap-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.3 }}
                className="glass-card overflow-hidden group border-white/[0.04]"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-7 text-left group-hover:bg-white/[0.01] transition-all"
                >
                  <span className="text-base font-bold tracking-tight text-foreground/80">{faq.q}</span>
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500",
                    openFaq === i ? "bg-primary rotate-180" : "bg-white/[0.03] border border-white/[0.05]"
                  )}>
                    <ChevronDown className={cn("w-3.5 h-3.5", openFaq === i ? "text-primary-foreground" : "text-muted-foreground")} />
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-7 pb-7 text-muted-foreground text-sm font-medium leading-relaxed max-w-2xl">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="py-40 px-6 relative overflow-hidden bg-white/[0.01]">
        <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none" />
        <motion.div
          className="relative z-10 max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 mb-10">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Ready to dominate?</span>
          </div>
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-black mb-6 tracking-display leading-[1.1]">
            Create your first <br /><span className="text-primary italic">viral content</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-12 max-w-lg mx-auto font-medium opacity-60">
            Join 2,500+ creators using Supenli.ai to create content that converts.
          </p>
          <Button size="lg" onClick={() => navigate("/login")} className="bg-foreground text-background hover:scale-105 active:scale-95 font-black uppercase tracking-[0.2em] h-14 px-10 text-sm rounded-full transition-all shadow-2xl shadow-white/5">
            Get started free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-white/[0.05] py-20 px-6 relative bg-white/[0.005]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-20">
            <div className="col-span-2">
              <div className="mb-8">
                <Link to="/" className="hover:opacity-80 transition-all inline-block active:scale-95">
                  <LogoFull size="md" />
                </Link>
              </div>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-xs mb-8 opacity-60">
                AI-powered content creation platform for creators who want to sound human. Build your legacy, one viral post at a time.
              </p>
              <div className="flex gap-4">
                {[Twitter, Linkedin, Instagram].map((Icon, idx) => (
                  <a key={idx} href="#" className="w-9 h-9 rounded-full border border-white/[0.05] flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all duration-300">
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>

            {["Product", "Resources", "Legal"].map((title) => (
              <div key={title}>
                <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground mb-8 opacity-40">{title}</h4>
                <ul className="space-y-4">
                  {(title === "Product" ? ["Features", "Pricing", "FAQ"] : title === "Resources" ? ["Contact", "Support"] : ["Privacy", "Terms"]).map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-12 border-t border-white/[0.03] gap-8">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">© 2026 Supenli.ai. Built for virality.</p>
            <div className="flex gap-8">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/20">Secure Platform</span>
            </div>
          </div>
        </div>
      </footer>

      <WaitlistPopup isOpen={showWaitlist} onClose={() => setShowWaitlist(false)} />
    </div>
  );
};

export default Index;
