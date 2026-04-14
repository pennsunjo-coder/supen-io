import { useNavigate, Link } from "react-router-dom";
import threadsLogo from "@/assets/threads-logo.png";
import { Button } from "@/components/ui/button";
import {
  Zap, ArrowRight, Sparkles, BookOpen, Wand2, Shield,
  Youtube, FileText, Globe, MessageSquare, Check, Star,
  ChevronDown, Twitter, Instagram, Linkedin, Mail,
  Layers, Target, PenTool, BarChart3, Users, Sun, Moon, Gift,
  X as XIcon, Brain, TrendingUp, Clock, CreditCard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { LogoFull } from "@/components/Logo";

const ROTATING_WORDS = ["Viral", "Compelling", "Human", "Irresistible"];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const }
  })
};

const features = [
  { icon: BookOpen, title: "Smart Notebook", desc: "Upload PDFs, URLs, YouTube links and notes. Everything centralized in one research hub." },
  { icon: Wand2, title: "Content Studio", desc: "Generate platform-ready posts for X, LinkedIn, Instagram, YouTube and more — in one click." },
  { icon: Shield, title: "Anti-AI Protocol", desc: "Content that passes AI detectors. Grade 5 reading level, zero jargon, 100% human tone." },
  { icon: MessageSquare, title: "AI Chat Assistant", desc: "Brainstorm ideas, analyze sources, and get content suggestions powered by Claude." },
  { icon: Youtube, title: "YouTube Transcriber", desc: "Paste a YouTube URL, get a clean transcript instantly. Perfect for repurposing video content." },
  { icon: Layers, title: "One-Click Repurposing", desc: "Turn one piece of content into 6+ platform-ready posts. Blog → Thread → Carousel → Reel script." },
];

const steps = [
  { num: "01", title: "Drop your idea", desc: "Paste a topic, URL, or keyword. That's all you need to start.", icon: FileText },
  { num: "02", title: "Get 5 viral variations", desc: "AI generates platform-optimized content in seconds. Pick the best one.", icon: Sparkles },
  { num: "03", title: "Post & track", desc: "Schedule directly or copy to your favorite tool. Watch it grow.", icon: BarChart3 },
];

const testimonials = [
  { name: "Nadia Okonkwo", role: "Consultant · London, UK", image: "https://randomuser.me/api/portraits/women/23.jpg", text: "Supen.io transformed the way I create. I focus on ideas, the AI handles the rest. My LinkedIn engagement tripled." },
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
    desc: "Try Supen.io risk-free",
    features: ["YouTube Transcriber (1 video/day)", "Platform preview", "No credit card required"],
    cta: "Get started free",
    highlighted: false,
    rotation: "rotate-[-1deg]",
  },
  {
    name: "Plus",
    icon: Sparkles,
    price: "$10",
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
    cta: "Start for $10/month →",
    highlighted: true,
    rotation: "rotate-[1deg]",
  },
  {
    name: "Pro",
    icon: Users,
    price: "$29",
    period: "/month",
    desc: "For agencies and content teams",
    features: ["Everything in Plus", "Unlimited generations", "3 team members", "Shared workspaces", "Advanced analytics", "Dedicated onboarding", "Dedicated support"],
    cta: "Get Pro →",
    highlighted: false,
    rotation: "rotate-[-2deg]",
  },
];

const faqs = [
  { q: "Is it really free to get started?", a: "Yes, the Free plan gives you 5 generations per day with no credit card. Try all features before upgrading to Pro." },
  { q: "What languages does Supen.io generate content in?", a: "Supen.io generates content in French, English, or the language of your sources. The AI adapts automatically to your context." },
  { q: "Is my data secure?", a: "Yes, all your data is encrypted and stored on Supabase (SOC 2 Type II). We never sell your data and you can delete it anytime." },
  { q: "Can I use my own documents?", a: "Yes! Import PDFs, URLs, YouTube transcripts, or notes. The AI generates content based on YOUR sources via our semantic RAG system." },
  { q: "How does viral scoring work?", a: "Claude Haiku analyzes each variation on 5 criteria: hook, emotion, specificity, actionability, CTA. Total score out of 100, strictly calibrated (most content = 50-65)." },
  { q: "Is there a generation limit?", a: "Free plan: 5/day. Pro plan: unlimited + scoring + style memory. Business plan: everything in Pro + priority support + analytics." },
  { q: "Can I cancel my subscription?", a: "Yes, anytime from your settings. No commitment, no hidden fees. Your plan stays active until the end of the paid period." },
  { q: "Does it work for all platforms?", a: "Instagram, TikTok, LinkedIn, Facebook, YouTube, X (Twitter). Content is automatically adapted to each platform's format and tone." },
  { q: "How does the AI Coach work?", a: "The Coach knows your niche, platforms, sources and preferred style. It improves with every interaction thanks to conversation memory." },
  { q: "Does the content pass AI detectors?", a: "Yes. Our Anti-AI Protocol uses grade 5 writing level, varies sentence length, and adds natural imperfections. Result: undetectable by AI detectors." },
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
  { name: "Blog", icon: null },
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
  const { theme, toggleTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIdx((i) => (i + 1) % ROTATING_WORDS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ═══════════ NAVBAR (sticky) ═══════════ */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/85 border-b border-border/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 py-3">
          <Link to="/" className="hover:opacity-80 transition-opacity shrink-0"><LogoFull size="sm" /></Link>
          <div className="hidden md:flex items-center bg-primary/[0.06] border border-primary/15 rounded-full px-1 py-1">
            {[
              { label: "Features", href: "#features" },
              { label: "Results", href: "#results" },
              { label: "Pricing", href: "#pricing" },
              { label: "FAQ", href: "#faq" },
            ].map((item) => (
              <a key={item.label} href={item.href} className="px-4 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all">{item.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-muted-foreground hover:text-foreground transition-all" title={theme === "dark" ? "Light mode" : "Dark mode"}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Button size="sm" onClick={() => navigate("/login")} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-3 md:px-5 h-9 text-xs md:text-sm font-semibold shadow-sm">
              Get started free
            </Button>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative pt-20 pb-28 md:pt-28 md:pb-36 px-6 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-t from-primary/12 via-primary/4 to-transparent rounded-t-full opacity-50 blur-[80px] pointer-events-none" />

        <motion.div
          className="relative z-10 max-w-3xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {/* Badge pill */}
          <motion.div variants={fadeUp} custom={0}
            className="inline-flex items-center bg-primary/[0.08] border border-primary/15 rounded-full pl-1.5 pr-4 py-1 text-primary text-xs mb-10"
          >
            <span className="bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full mr-2 text-[11px] font-semibold">New</span>
            AI-powered infographics
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1}
            className="text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6 tracking-display"
          >
            <span className="font-light">Your Content Deserves to Go</span>
            <br />
            <span className="inline-block overflow-hidden align-bottom font-bold" style={{ minWidth: "6ch", height: "1.15em" }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={ROTATING_WORDS[wordIdx]}
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="text-gradient inline-block"
                >
                  {ROTATING_WORDS[wordIdx]}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="text-gradient font-bold">.</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2}
            className="text-sm md:text-base text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed font-light"
          >
            Stop spending 2 hours on a single post. Generate 5 viral variations in 30 seconds — for LinkedIn, Instagram, TikTok, X, YouTube & Facebook.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex gap-3 justify-center flex-wrap">
            <Button size="lg" onClick={() => navigate("/login")} className="bg-foreground text-background hover:bg-foreground/90 h-11 px-7 text-sm font-medium rounded-lg group">
              Start Creating Free
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login")} className="bg-foreground/[0.06] border-foreground/10 hover:bg-foreground/10 text-foreground h-11 px-7 text-sm rounded-lg">
              See how it works
            </Button>
          </motion.div>

          {/* Credibility badges */}
          <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Free to start</span>
            <span className="flex items-center gap-1.5"><CreditCard className="w-3 h-3 text-emerald-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-emerald-500" /> Results in 60 seconds</span>
          </motion.div>
          <motion.p variants={fadeUp} custom={5} className="mt-4 text-xs text-muted-foreground/60 font-medium">
            Join 2,400+ creators already using Supen.io
          </motion.p>

          {/* Marquee */}
          <motion.div variants={fadeUp} custom={4} className="mt-16 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
            <div className="animate-marquee flex gap-8 w-max text-muted-foreground/30 text-xs tracking-[0.2em] uppercase font-medium">
              {[...Array(2)].map((_, k) => (
                <div key={k} className="flex gap-8 items-center">
                  <span>Viral Content</span><span className="text-primary/30">∞</span>
                  <span>Anti-AI</span><span className="text-primary/30">∞</span>
                  <span>6 Platforms</span><span className="text-primary/30">∞</span>
                  <span>RAG Powered</span><span className="text-primary/30">∞</span>
                  <span>Human Voice</span><span className="text-primary/30">∞</span>
                  <span>5 Variations</span><span className="text-primary/30">∞</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════ PLATFORMS TICKER ═══════════ */}
      <section className="py-10 border-y border-border/30">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-widest mb-6">Generate content for</p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {platforms.map((p) => (
              <div key={p.name} className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors">
                {p.icon ? <p.icon /> : <Mail className="w-5 h-5" />}
                <span className="text-sm font-medium">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ ANIMATED STATS COUNTER ═══════════ */}
      <section className="py-16 px-6 border-b border-border/20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="text-center"
            >
              <p className="text-5xl md:text-6xl font-black text-gradient tracking-tight mb-2">
                <AnimatedCounter end={50000} suffix="+" />
              </p>
              <p className="text-sm text-muted-foreground font-medium">Content generated</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.15, duration: 0.5 }}
              className="text-center md:border-x md:border-border/20"
            >
              <p className="text-5xl md:text-6xl font-black text-gradient tracking-tight mb-2">
                <AnimatedCounter end={2500} suffix="+" />
              </p>
              <p className="text-sm text-muted-foreground font-medium">Active creators</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center"
            >
              <p className="text-5xl md:text-6xl font-black text-gradient tracking-tight mb-2">
                <AnimatedCounter end={98} suffix="%" />
              </p>
              <p className="text-sm text-muted-foreground font-medium">Satisfaction rate</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <span className="text-xs text-primary font-semibold uppercase tracking-widest">Features</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">Everything you need to <span className="text-gradient">create & scale</span></h2>
            <p className="text-muted-foreground max-w-lg mx-auto">From research to publishing, Supen.io handles the entire content creation workflow.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}
                className="group rounded-xl border border-border/50 bg-card p-6 hover:border-primary/30 hover:bg-card/80 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ COMPARISON TABLE ═══════════ */}
      <section className="py-24 px-6 border-b border-border/20">
        <div className="max-w-4xl mx-auto">
          <motion.div className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <span className="text-xs text-primary font-semibold uppercase tracking-widest">Comparison</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">Why <span className="text-gradient">Supen.io</span>?</h2>
            <p className="text-muted-foreground">Compare with other AI content creation tools.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="rounded-2xl border border-border/40 bg-card overflow-hidden"
          >
            <div className="grid grid-cols-4 border-b border-border/30 bg-accent/20">
              <div className="px-3 md:px-5 py-4 text-xs font-semibold text-muted-foreground">Feature</div>
              <div className="px-3 md:px-5 py-4 text-center">
                <span className="text-xs md:text-sm font-bold text-primary">Supen.io</span>
              </div>
              <div className="px-3 md:px-5 py-4 text-center">
                <span className="text-xs md:text-sm font-medium text-muted-foreground">ChatGPT</span>
              </div>
              <div className="px-3 md:px-5 py-4 text-center">
                <span className="text-xs md:text-sm font-medium text-muted-foreground">Jasper</span>
              </div>
            </div>
            {[
              { feature: "RAG on your sources", supen: true, chatgpt: false, jasper: false },
              { feature: "Personalized AI Coach", supen: true, chatgpt: false, jasper: false },
              { feature: "Auto infographics", supen: true, chatgpt: false, jasper: false },
              { feature: "Style memory", supen: true, chatgpt: false, jasper: false },
              { feature: "Real viral scoring", supen: true, chatgpt: false, jasper: false },
              { feature: "Real-time trends", supen: true, chatgpt: false, jasper: false },
              { feature: "5 variations per topic", supen: true, chatgpt: false, jasper: true },
              { feature: "Anti-AI detector", supen: true, chatgpt: false, jasper: false },
            ].map((row, i) => (
              <div key={i} className={cn("grid grid-cols-4 border-b border-border/15 last:border-b-0", i % 2 === 0 ? "bg-background" : "bg-accent/[0.03]")}>
                <div className="px-3 md:px-5 py-3.5 text-xs md:text-sm font-medium text-foreground/85">{row.feature}</div>
                <div className="px-3 md:px-5 py-3.5 flex items-center justify-center">
                  {row.supen ? (
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                  ) : (
                    <XIcon className="w-4 h-4 text-muted-foreground/30" />
                  )}
                </div>
                <div className="px-3 md:px-5 py-3.5 flex items-center justify-center">
                  {row.chatgpt ? <Check className="w-4 h-4 text-emerald-400" /> : <XIcon className="w-4 h-4 text-muted-foreground/30" />}
                </div>
                <div className="px-3 md:px-5 py-3.5 flex items-center justify-center">
                  {row.jasper ? <Check className="w-4 h-4 text-emerald-400" /> : <XIcon className="w-4 h-4 text-muted-foreground/30" />}
                </div>
              </div>
            ))}
            <div className="grid grid-cols-4 bg-accent/30 border-t-2 border-primary/20">
              <div className="px-3 md:px-5 py-4 text-xs md:text-sm font-bold">Monthly price</div>
              <div className="px-3 md:px-5 py-4 text-center text-sm font-bold text-primary">$10</div>
              <div className="px-3 md:px-5 py-4 text-center text-sm text-muted-foreground">$20</div>
              <div className="px-3 md:px-5 py-4 text-center text-sm text-muted-foreground">$49</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="py-24 px-6 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <span className="text-xs text-primary font-semibold uppercase tracking-widest">How it works</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">From idea to <span className="text-gradient">viral post</span> in 3 steps</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.4 }}
                className="relative text-center"
              >
                <div className="text-5xl font-black text-primary/10 mb-3">{s.num}</div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <span className="text-xs text-primary font-semibold uppercase tracking-widest">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">What our <span className="text-gradient">creators</span> say</h2>
            <p className="text-muted-foreground">Thousands of content creators trust Supen.io to create viral content every day.</p>
          </motion.div>

          {/* 3 testimonials side by side */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="p-6 rounded-xl border border-border/50 bg-card shadow-lg shadow-primary/5"
              >
                <p className="text-sm text-foreground/80 leading-relaxed">{t.text}</p>
                <div className="flex items-center gap-3 mt-4">
                  <img src={t.image} alt={t.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SOCIAL PROOF ═══════════ */}
      <section id="results" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center bg-primary/[0.06] border border-primary/15 rounded-full px-4 py-1.5 text-xs text-muted-foreground mb-6">Social Proof</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-display">The numbers speak <span className="text-gradient">for themselves.</span></h2>
            <p className="text-sm text-muted-foreground font-light">Real engagement from real posts. Created by @AwakPenn.</p>
          </motion.div>

          {/* Stats headline */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {[
              { num: "260K+", label: "Likes", platform: "Facebook" },
              { num: "850M+", label: "Views", platform: "X (Twitter)" },
              { num: "50K", label: "Shares", platform: "Facebook" },
              { num: "8,810", label: "Reactions", platform: "LinkedIn" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-foreground/[0.03] border border-foreground/[0.06] rounded-xl p-5 hover:border-primary/30 transition-colors relative"
              >
                <span className="absolute top-3 right-3 text-[9px] text-muted-foreground/40">{s.platform}</span>
                <p className="text-3xl font-bold text-primary tracking-tight">{s.num}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Animated columns */}
          <div className="h-[800px] overflow-hidden relative [mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)]">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <motion.div animate={{ y: "-15%" }} transition={{ duration: 30, repeat: Infinity, ease: "linear", repeatType: "reverse" }} className="flex flex-col gap-3">
                {[...resultsData.slice(0, 4), ...resultsData.slice(0, 2)].map((r, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-white/10 hover:border-primary/30 transition-all bg-zinc-950">
                    <img src={r.src} alt={`${r.platform} result`} className="w-full h-auto block" style={{ objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                ))}
              </motion.div>
              <motion.div animate={{ y: "15%" }} transition={{ duration: 35, repeat: Infinity, ease: "linear", repeatType: "reverse" }} className="flex flex-col gap-3 -mt-20">
                {[...resultsData.slice(4, 8), ...resultsData.slice(4, 6)].map((r, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-white/10 hover:border-primary/30 transition-all bg-zinc-950">
                    <img src={r.src} alt={`${r.platform} result`} className="w-full h-auto block" style={{ objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                ))}
              </motion.div>
              <motion.div animate={{ y: "-15%" }} transition={{ duration: 28, repeat: Infinity, ease: "linear", repeatType: "reverse" }} className="hidden md:flex flex-col gap-3 -mt-10">
                {[...resultsData.slice(8, 12), ...resultsData.slice(8, 10)].map((r, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-white/10 hover:border-primary/30 transition-all bg-zinc-950">
                    <img src={r.src} alt={`${r.platform} result`} className="w-full h-auto block" style={{ objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Social proof footer */}
          <motion.div className="mt-10 text-center" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-primary fill-primary" />)}
            </div>
            <p className="text-sm text-muted-foreground">Join <span className="text-foreground font-medium">10,000+</span> creators already generating viral content</p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="py-24 px-6 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <span className="text-xs text-primary font-semibold uppercase tracking-widest">Simple & Transparent</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">Start free. <span className="text-gradient">Scale when ready.</span></h2>
            <p className="text-muted-foreground">No hidden fees. Cancel anytime.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {plans.map((plan, i) => {
              const PlanIcon = plan.icon;
              return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30, rotate: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className={`group relative ${plan.rotation}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold border-2 border-border shadow-[3px_3px_0px_0px] shadow-border">
                    Popular!
                  </div>
                )}
                <div className={`rounded-2xl border-2 p-7 transition-all duration-300 ${
                  plan.highlighted
                    ? "border-primary bg-card shadow-[4px_4px_0px_0px] shadow-primary/30 group-hover:shadow-[8px_8px_0px_0px] group-hover:shadow-primary/30 group-hover:translate-x-[-4px] group-hover:translate-y-[-4px]"
                    : "border-border bg-card shadow-[4px_4px_0px_0px] shadow-border/50 group-hover:shadow-[8px_8px_0px_0px] group-hover:shadow-border/50 group-hover:translate-x-[-4px] group-hover:translate-y-[-4px]"
                }`}>
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center mb-5 ${
                    plan.highlighted ? "border-primary bg-primary/10" : "border-border bg-accent/30"
                  }`}>
                    <PlanIcon className={`w-5 h-5 ${plan.highlighted ? "text-primary" : "text-foreground/70"}`} />
                  </div>

                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mb-5">{plan.desc}</p>

                  <div className="flex items-baseline gap-1 mb-7">
                    <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-3 text-sm">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          plan.highlighted ? "border-primary bg-primary/10" : "border-border bg-accent/20"
                        }`}>
                          <Check className={`w-3 h-3 ${plan.highlighted ? "text-primary" : "text-foreground/60"}`} />
                        </div>
                        <span className="text-foreground/80">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full h-12 font-bold text-sm border-2 transition-all duration-300 ${
                      plan.highlighted
                        ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 glow-sm shadow-[3px_3px_0px_0px] shadow-primary/30 hover:shadow-[5px_5px_0px_0px] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                        : "bg-background text-foreground border-border hover:bg-accent shadow-[3px_3px_0px_0px] shadow-border/50 hover:shadow-[5px_5px_0px_0px] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                    }`}
                    onClick={() => navigate("/login")}
                  >
                    {plan.cta} <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <span className="text-xs text-primary font-semibold uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">Questions? <span className="text-gradient">Answers.</span></h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.3 }}
                className="rounded-xl border border-border/50 bg-card overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium hover:bg-accent/50 transition-colors"
                >
                  {faq.q}
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 ml-4 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA BANNER ═══════════ */}
      <section className="py-24 px-6 relative overflow-hidden bg-gradient-to-br from-primary/[0.08] via-primary/[0.04] to-transparent border-t border-primary/10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/[0.08] rounded-full blur-[120px] pointer-events-none" />
        <motion.div
          className="relative z-10 max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-5">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Ready to start?</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Create your first <span className="text-gradient">viral content</span><br />in under 60 seconds
          </h2>
          <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            Join 2,500+ creators using Supen.io to create content that converts.
          </p>
          <Button size="lg" onClick={() => navigate("/login")} className="bg-foreground text-background hover:bg-foreground/90 font-bold group h-13 px-10 text-base rounded-xl">
            Get started free
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Free forever</span>
            <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> Setup in 60 seconds</span>
          </div>
        </motion.div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-border/30 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4">
                <Link to="/" className="hover:opacity-80 transition-opacity"><LogoFull size="sm" /></Link>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                AI-powered content creation platform for creators who want to sound human.
              </p>
              <div className="flex gap-3">
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><Twitter className="w-4 h-4" /></a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><Linkedin className="w-4 h-4" /></a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors"><Instagram className="w-4 h-4" /></a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="/faq" onClick={(e) => { e.preventDefault(); navigate("/faq"); }} className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="/contact" onClick={(e) => { e.preventDefault(); navigate("/contact"); }} className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="mailto:support@supen.io" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="/privacy" onClick={(e) => { e.preventDefault(); navigate("/privacy"); }} className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" onClick={(e) => { e.preventDefault(); navigate("/terms"); }} className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/30 gap-4">
            <p className="text-xs text-muted-foreground">© 2026 Supen.io. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
