import { useNavigate } from "react-router-dom";
import threadsLogo from "@/assets/threads-logo.png";
import { Button } from "@/components/ui/button";
import {
  Zap, ArrowRight, Sparkles, BookOpen, Wand2, Shield,
  Youtube, FileText, Globe, MessageSquare, Check, Star,
  ChevronDown, Twitter, Instagram, Linkedin, Mail,
  Layers, Target, PenTool, BarChart3, Users, Sun, Moon, Gift
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
  { num: "01", title: "Upload Your Sources", desc: "Drop in files, URLs, videos, or notes. Supen.io organizes everything automatically.", icon: FileText },
  { num: "02", title: "Chat & Brainstorm", desc: "Ask AI to analyze, summarize, and extract key insights from your sources.", icon: MessageSquare },
  { num: "03", title: "Generate Content", desc: "Pick a platform, choose a template, and generate human-sounding posts instantly.", icon: PenTool },
  { num: "04", title: "Publish & Track", desc: "Export ready-to-post content. Sound human, go viral, grow your audience.", icon: BarChart3 },
];

const testimonials = [
  { name: "Aminata Diallo", role: "Content Creator · Dakar", image: "https://randomuser.me/api/portraits/women/44.jpg", text: "In 3 weeks I doubled my Facebook engagement. My posts finally sound like something I would have written myself." },
  { name: "Kwame Asante", role: "Entrepreneur · Accra", image: "https://randomuser.me/api/portraits/men/32.jpg", text: "I generate 5 variations in 30 seconds. Before, I used to spend 2 hours on a single LinkedIn post." },
  { name: "Chloé Mbeki", role: "Business Coach · Paris", image: "https://randomuser.me/api/portraits/women/68.jpg", text: "The Anti-AI mode is mind-blowing. Even my most demanding audience detects nothing." },
  { name: "Patrick Nkomo", role: "YouTube Creator · Douala", image: "https://randomuser.me/api/portraits/men/75.jpg", text: "I finally have a tool that understands my niche. The generated content speaks directly to my Cameroonian audience." },
  { name: "Fatou Sarr", role: "Influencer · Abidjan", image: "https://randomuser.me/api/portraits/women/12.jpg", text: "The AI Coach helped me find angles I would never have thought of. My click-through rate increased by 40%." },
  { name: "David Kouassi", role: "Digital Marketer · Lyon", image: "https://randomuser.me/api/portraits/men/54.jpg", text: "I post on 4 different platforms with the same adapted content. An incredible time saver." },
  { name: "Nadia Okonkwo", role: "Consultant · London", image: "https://randomuser.me/api/portraits/women/23.jpg", text: "Supen.io transformed the way I create. I focus on ideas, the AI handles the rest." },
  { name: "Théo Mensah", role: "Creator Economy · Brussels", image: "https://randomuser.me/api/portraits/men/18.jpg", text: "The Facebook threads generated are exactly in my style. My followers think I have a whole team." },
  { name: "Grace Adeyemi", role: "Online Educator · Lagos", image: "https://randomuser.me/api/portraits/women/91.jpg", text: "The RAG feature is revolutionary. I upload my notes and the AI creates content based on MY own ideas." },
];

const resultsData = [
  { src: "/results/Screenshot_2026-04-02_003014.png", stat: "2.7K likes · 649 shares", platform: "Facebook", tier: "green" },
  { src: "/results/Screenshot_2026-04-02_003201.png", stat: "3.2K likes · 5K shares", platform: "Facebook", tier: "green" },
  { src: "/results/Screenshot_2026-04-02_003257.png", stat: "26K likes · 23K shares", platform: "Facebook", tier: "gold" },
  { src: "/results/Screenshot_2026-04-02_003356.png", stat: "7.2K likes · 7.1K shares", platform: "Facebook", tier: "green" },
  { src: "/results/Screenshot_2026-04-02_003931.png", stat: "1.1K likes · 230 shares", platform: "Facebook", tier: "cyan" },
  { src: "/results/Screenshot_2026-04-02_004452.png", stat: "630 reactions · 44 reposts", platform: "LinkedIn", tier: "cyan" },
  { src: "/results/Screenshot_2026-04-02_004606.png", stat: "624 reactions · 63 reposts", platform: "LinkedIn", tier: "cyan" },
  { src: "/results/Screenshot_2026-04-02_004655.png", stat: "697 reactions · 93 reposts", platform: "LinkedIn", tier: "cyan" },
  { src: "/results/Screenshot_2026-04-02_004737.png", stat: "881 reactions · 135 reposts", platform: "LinkedIn", tier: "cyan" },
  { src: "/results/Screenshot_2026-04-02_005007.png", stat: "1.7M views · 3K likes", platform: "X (Twitter)", tier: "gold" },
  { src: "/results/Screenshot_2026-04-02_005138.png", stat: "1.6M views · 9.8K likes", platform: "X (Twitter)", tier: "gold" },
  { src: "/results/Screenshot_2026-04-02_005256.png", stat: "257K views · 2.2K likes", platform: "X (Twitter)", tier: "green" },
];
const tierColors = { gold: "bg-amber-500/90", green: "bg-emerald-500/90", cyan: "bg-primary/90" };

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

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
    name: "Pro",
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
      "Unlimited AI Coach",
      "Priority support",
    ],
    cta: "Start for $10/month →",
    highlighted: true,
    rotation: "rotate-[1deg]",
  },
  {
    name: "Business",
    icon: Users,
    price: "$29",
    period: "/month",
    desc: "For agencies and content teams",
    features: ["Everything in Pro", "Unlimited generations", "3 team members", "Shared workspaces", "Advanced analytics", "Dedicated onboarding", "Dedicated support"],
    cta: "Get Business →",
    highlighted: false,
    rotation: "rotate-[-2deg]",
  },
];

const faqs = [
  { q: "Does the content really pass AI detectors?", a: "Yes. Our Anti-AI Protocol uses grade 5 reading level, varied sentence structures, personal anecdotes, and natural imperfections to produce content that reads as genuinely human." },
  { q: "What platforms does Supen.io support?", a: "We support X (Twitter), LinkedIn, Instagram captions & carousels, YouTube descriptions, blog posts, TikTok scripts, and newsletter drafts." },
  { q: "Can I upload YouTube videos?", a: "Absolutely. Just paste a YouTube URL and we'll extract the full transcript for you to analyze, summarize, or repurpose into other formats." },
  { q: "Is there a free plan?", a: "Yes! Start with our free plan — 3 sources and 5 AI generations per day. Upgrade anytime for unlimited access." },
  { q: "What AI model powers Supen.io?", a: "We use Claude by Anthropic for intelligent, nuanced content generation that understands context and tone." },
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
      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <LogoFull size="sm" />
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Log In</Button>
            <Button size="sm" onClick={() => navigate("/login")} className="glow-sm">Get Started</Button>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative py-24 md:py-32 px-6 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-primary/3 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          className="relative z-10 max-w-3xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Content Creation Platform
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1}
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 tracking-tight"
          >
            Research. Create.
            <br />
            Go{" "}
            <span className="inline-block overflow-hidden align-bottom" style={{ minWidth: "6.5ch", height: "1.15em" }}>
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
            <span className="text-gradient">.</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed"
          >
            The all-in-one workspace for content creators. Centralize your research, generate platform-ready posts that actually sound human.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => navigate("/login")} className="glow-sm font-semibold group h-12 px-8 text-base">
              Start Creating — It's Free
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login")} className="h-12 px-8 text-base">
              Watch Demo
            </Button>
          </motion.div>

          <motion.p variants={fadeUp} custom={4} className="mt-5 text-xs text-muted-foreground">
            No credit card required · Free plan available · Set up in 30 seconds
          </motion.p>
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

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="py-24 px-6 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <span className="text-xs text-primary font-semibold uppercase tracking-widest">How it works</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">From source to <span className="text-gradient">viral post</span> in 4 steps</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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

          {/* Infinite scroll columns */}
          <div className="flex justify-center gap-6 max-h-[740px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]">
            {[
              { items: firstColumn, dur: 15 },
              { items: secondColumn, dur: 19, hide: "hidden md:flex" },
              { items: thirdColumn, dur: 17, hide: "hidden lg:flex" },
            ].map((col, ci) => (
              <div key={ci} className={col.hide || "flex flex-col"}>
                <motion.div
                  animate={{ translateY: "-50%" }}
                  transition={{ duration: col.dur, repeat: Infinity, ease: "linear", repeatType: "loop" }}
                  className="flex flex-col gap-6 pb-6"
                >
                  {[0, 1].map((dup) => (
                    <div key={dup} className="flex flex-col gap-6">
                      {col.items.map((t) => (
                        <div key={`${dup}-${t.name}`} className="p-5 rounded-xl border border-border/50 bg-card shadow-lg shadow-primary/5 max-w-xs w-full">
                          <p className="text-sm text-foreground/80 leading-relaxed">{t.text}</p>
                          <div className="flex items-center gap-3 mt-4">
                            <img src={t.image} alt={t.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{t.name}</p>
                              <p className="text-xs text-muted-foreground">{t.role}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ REAL RESULTS ═══════════ */}
      <section className="py-20 overflow-hidden">
        <motion.div className="text-center mb-12 px-6"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 border border-border/30 rounded-full px-4 py-1.5 text-sm text-muted-foreground mb-6">
            Real Results
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Content that actually <span className="text-primary">performs</span>
          </h2>
          <p className="text-muted-foreground">Real posts. Real numbers. Generated with Supen.io.</p>
        </motion.div>

        <div className="[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] group/scroll">
          <motion.div
            animate={{ translateX: "-50%" }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear", repeatType: "loop" }}
            className="flex gap-6 w-max group-hover/scroll:[animation-play-state:paused]"
            style={{ animationPlayState: "running" }}
          >
            {[...resultsData, ...resultsData].map((r, i) => (
              <div key={i} className={cn("w-[320px] shrink-0 rounded-xl overflow-hidden border border-border/20 shadow-lg shadow-black/10 transition-transform duration-300 hover:scale-105 hover:shadow-xl relative", i % 2 === 0 ? "rotate-[0.5deg]" : "-rotate-[0.5deg]")}>
                {/* Platform badge */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="bg-primary/90 text-white text-[10px] font-medium px-2 py-1 rounded-full">{r.platform}</span>
                </div>
                <div className="w-full h-[260px] bg-accent/30">
                  <img src={r.src} alt="Result" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
                <div className={cn("px-4 py-3 border-t border-border/20 text-white text-sm font-bold flex items-center gap-2", tierColors[r.tier as keyof typeof tierColors] || "bg-primary/90")}>
                  <span>⚡</span> {r.stat}
                </div>
              </div>
            ))}
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
                    Populaire !
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

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <motion.div
          className="relative z-10 max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to <span className="text-gradient">go viral</span>?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join thousands of creators using Supen.io to create content that connects. Start free, no credit card required.
          </p>
          <Button size="lg" onClick={() => navigate("/login")} className="glow-sm font-semibold group h-12 px-10 text-base">
            Start Creating Now
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-border/30 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4">
                <LogoFull size="sm" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI-powered content creation platform for creators who want to sound human.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/30 gap-4">
            <p className="text-xs text-muted-foreground">© 2025 Supen.io. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Instagram className="w-4 h-4" /></a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Linkedin className="w-4 h-4" /></a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Mail className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
