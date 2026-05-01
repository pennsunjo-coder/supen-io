/**
 * Viral hooks library — 100+ proven hooks organized by niche and type.
 * Used as instant suggestions in the Studio + Tools.
 * ALL HOOKS IN ENGLISH.
 */

export type HookType =
  | "question"
  | "stat"
  | "contrarian"
  | "story"
  | "fomo"
  | "confession"
  | "promise"
  | "provocateur";

export type Niche =
  | "business"
  | "marketing"
  | "tech"
  | "finance"
  | "fitness"
  | "education"
  | "lifestyle"
  | "general";

export interface Hook {
  text: string;
  type: HookType;
  niche: Niche;
  platform?: string;
}

export const VIRAL_HOOKS: Hook[] = [
  // ═══ BUSINESS & ENTREPRENEURSHIP ═══
  { text: "You've been working 60h/week for someone else. For how many years now?", type: "question", niche: "business" },
  { text: "How many business ideas have you killed because of fear?", type: "question", niche: "business" },
  { text: "Ever calculated what you actually earn per hour?", type: "question", niche: "business" },
  { text: "Why the hardest workers are not the most successful.", type: "question", niche: "business" },
  { text: "95% of entrepreneurs quit before year 2. Here's why the 5% survive.", type: "stat", niche: "business" },
  { text: "I made $0 for 18 months. Then $47,000 in one month.", type: "stat", niche: "business" },
  { text: "My first business made $12. The second made $120,000.", type: "stat", niche: "business" },
  { text: "1 in 10 entrepreneurs succeed. Here's what the other 9 get wrong.", type: "stat", niche: "business" },
  { text: "I saved for 3 years to start my business. It failed in 3 months.", type: "stat", niche: "business" },
  { text: "Stop looking for your passion. Look for a problem.", type: "contrarian", niche: "business" },
  { text: "Business plans are for people afraid to start.", type: "contrarian", niche: "business" },
  { text: "MBA degrees didn't build the world's biggest companies.", type: "contrarian", niche: "business" },
  { text: "Motivation is useless in business. Here's what actually matters.", type: "contrarian", niche: "business" },
  { text: "Your business idea isn't original. That's actually good news.", type: "contrarian", niche: "business" },
  { text: "I had $200 in my account. I launched anyway.", type: "story", niche: "business" },
  { text: "My co-founder scammed me out of $50,000. Here's what I learned.", type: "story", niche: "business" },
  { text: "I failed 7 times before succeeding. Here's attempt number 8.", type: "story", niche: "business" },
  { text: "My boss fired me on a Friday. By Monday, I was an entrepreneur.", type: "story", niche: "business" },
  { text: "At 35, I quit everything to start my first business.", type: "story", niche: "business" },
  { text: "In 5 years, you'll regret not starting today.", type: "fomo", niche: "business" },
  { text: "While you hesitate, someone else is launching your idea.", type: "fomo", niche: "business" },
  { text: "People who started in 2020 are millionaires today.", type: "fomo", niche: "business" },

  // ═══ DIGITAL MARKETING ═══
  { text: "Your content isn't bad. You're just targeting the wrong people.", type: "contrarian", niche: "marketing" },
  { text: "I tested 47 hooks. Here are the 3 that actually work.", type: "stat", niche: "marketing" },
  { text: "Why your posts get zero engagement (and how to fix it).", type: "question", niche: "marketing" },
  { text: "The secret of 1M-follower creators that nobody talks about.", type: "fomo", niche: "marketing" },
  { text: "I analyzed 1,000 viral posts. Here's the pattern.", type: "stat", niche: "marketing" },
  { text: "Stop creating content for everyone. You're reaching no one.", type: "contrarian", niche: "marketing" },
  { text: "My most viral post was written in 8 minutes.", type: "story", niche: "marketing" },
  { text: "3 words that instantly triple your engagement.", type: "promise", niche: "marketing" },
  { text: "The real reason people don't like your posts.", type: "question", niche: "marketing" },
  { text: "Your competitor has 10x more followers. Here's why that's normal.", type: "contrarian", niche: "marketing" },
  { text: "I stopped posting for 30 days. Here's what happened.", type: "story", niche: "marketing" },
  { text: "The algorithm doesn't hate you. You're just making these 3 mistakes.", type: "contrarian", niche: "marketing" },
  { text: "How I 10x'd my engagement by changing ONE word.", type: "stat", niche: "marketing" },
  { text: "Nobody tells you that marketing is just psychology.", type: "contrarian", niche: "marketing" },
  { text: "How much is your audience actually worth? The answer will surprise you.", type: "question", niche: "marketing" },

  // ═══ TECH & AI ═══
  { text: "AI will replace your job. But not the way you think.", type: "contrarian", niche: "tech" },
  { text: "I use AI 8 hours a day. Here are the 5 tools that change everything.", type: "stat", niche: "tech" },
  { text: "ChatGPT lied to you. Here's how to actually use AI.", type: "contrarian", niche: "tech" },
  { text: "In 2026, not using AI is like not having internet in 2000.", type: "fomo", niche: "tech" },
  { text: "I automated 80% of my work with AI. Here's how.", type: "stat", niche: "tech" },
  { text: "AI doesn't replace humans. It replaces humans who don't use AI.", type: "contrarian", niche: "tech" },
  { text: "These 3 AI prompts save me 15 hours every week.", type: "promise", niche: "tech" },
  { text: "Why the highest-paid developers use AI differently.", type: "question", niche: "tech" },
  { text: "I used AI to build a product in 48 hours. Here's the result.", type: "story", niche: "tech" },
  { text: "90% of people use ChatGPT like Google. That's a mistake.", type: "stat", niche: "tech" },
  { text: "AI let me do the work of a 5-person team. Alone.", type: "stat", niche: "tech" },
  { text: "The perfect prompt doesn't exist. Here's what actually works.", type: "contrarian", niche: "tech" },

  // ═══ FINANCE & INVESTING ═══
  { text: "You work 35 years for retirement. What if you could do it in 10?", type: "question", niche: "finance" },
  { text: "I lost $30,000 in the stock market. Here's the $30,000 lesson.", type: "story", niche: "finance" },
  { text: "School never taught you about money. Here's why.", type: "contrarian", niche: "finance" },
  { text: "How I save 40% of my income without feeling deprived.", type: "promise", niche: "finance" },
  { text: "The trap of 'safe' investments your bank won't tell you about.", type: "contrarian", niche: "finance" },
  { text: "Investing $100/month for 30 years = ?", type: "question", niche: "finance" },
  { text: "Rich people don't work harder. They make their money work.", type: "contrarian", niche: "finance" },
  { text: "I had $0 in savings at 28. Here's how I caught up.", type: "story", niche: "finance" },
  { text: "3 financial mistakes 95% of people make in their 30s.", type: "stat", niche: "finance" },
  { text: "The 50/30/20 rule your bank doesn't want you to know.", type: "contrarian", niche: "finance" },

  // ═══ FITNESS & HEALTH ═══
  { text: "I lost 45 lbs without a strict diet. Here's what actually worked.", type: "story", niche: "fitness" },
  { text: "You've been working out for 6 months with no results? Here's why.", type: "question", niche: "fitness" },
  { text: "The gym is the most profitable business in the world. Here's why.", type: "contrarian", niche: "fitness" },
  { text: "Morning exercisers have an unfair advantage.", type: "fomo", niche: "fitness" },
  { text: "Eating less doesn't make you lose weight. Here's the real explanation.", type: "contrarian", niche: "fitness" },
  { text: "20 minutes a day transformed my body in 90 days.", type: "stat", niche: "fitness" },
  { text: "The real reason you abandon your fitness goals.", type: "question", niche: "fitness" },
  { text: "I ate McDonald's every week while losing 30 lbs. Here's how.", type: "story", niche: "fitness" },
  { text: "95% of people warm up wrong.", type: "stat", niche: "fitness" },
  { text: "The best exercise for weight loss isn't what you think.", type: "contrarian", niche: "fitness" },

  // ═══ EDUCATION & LEARNING ═══
  { text: "I learned more in 6 months on YouTube than in 5 years of school.", type: "story", niche: "education" },
  { text: "Your degree doesn't prepare you for the real job market.", type: "contrarian", niche: "education" },
  { text: "How to learn any skill in 20 hours (proven method).", type: "promise", niche: "education" },
  { text: "The highest-paying skills in 2026 aren't taught in school.", type: "contrarian", niche: "education" },
  { text: "I spent $5,000 on courses. Here's what was actually worth it.", type: "story", niche: "education" },
  { text: "The memorization technique only 1% of students know.", type: "stat", niche: "education" },
  { text: "Why reading one book a week won't make you smarter.", type: "contrarian", niche: "education" },
  { text: "Online learning vs traditional education: the real numbers.", type: "stat", niche: "education" },

  // ═══ LIFESTYLE & PERSONAL DEV ═══
  { text: "I quit social media for 30 days. Here's what happened.", type: "story", niche: "lifestyle" },
  { text: "5 AM wake-ups: the secret of successful people (myth or reality).", type: "question", niche: "lifestyle" },
  { text: "Being busy doesn't mean being productive. The real difference.", type: "contrarian", niche: "lifestyle" },
  { text: "I changed 1 habit. My life changed in 3 months.", type: "story", niche: "lifestyle" },
  { text: "People who surround themselves with ambitious people earn 33% more.", type: "stat", niche: "lifestyle" },
  { text: "The problem isn't time. It's what you do with it.", type: "contrarian", niche: "lifestyle" },
  { text: "Why the most productive people work less than you.", type: "question", niche: "lifestyle" },
  { text: "I said no to everything for 1 month. Here's what changed.", type: "story", niche: "lifestyle" },
  { text: "Discipline is overrated. Here's what actually works.", type: "contrarian", niche: "lifestyle" },
  { text: "3 morning habits that changed everything (no 5 AM alarm needed).", type: "promise", niche: "lifestyle" },

  // ═══ GENERAL ═══
  { text: "What nobody tells you about [topic].", type: "contrarian", niche: "general" },
  { text: "I wish I knew this at 20.", type: "confession", niche: "general" },
  { text: "The truth nobody dares to say about [topic].", type: "provocateur", niche: "general" },
  { text: "Stop doing this. Seriously.", type: "provocateur", niche: "general" },
  { text: "In 2026, if you're not doing this, you're missing something huge.", type: "fomo", niche: "general" },
  { text: "I tried this for 1 year. Here's my honest review.", type: "story", niche: "general" },
  { text: "The only thing that actually helped me change.", type: "confession", niche: "general" },
  { text: "Everyone is lying to you about [topic]. Here's the truth.", type: "contrarian", niche: "general" },
  { text: "I disagree with 90% of experts on this topic.", type: "provocateur", niche: "general" },
  { text: "Here's what I'd tell my 5-years-ago self.", type: "confession", niche: "general" },
  { text: "The advice everyone gives that doesn't work.", type: "contrarian", niche: "general" },
  { text: "I made the mistake everyone makes. Don't repeat it.", type: "confession", niche: "general" },
  { text: "Why the hardest workers aren't the most successful.", type: "question", niche: "general" },
  { text: "The one thing successful people do differently.", type: "fomo", niche: "general" },
  { text: "I've been watching for 3 years. Here's what I learned.", type: "story", niche: "general" },

  // ═══ LINKEDIN REFERENCE HOOKS (extracted from viral posts) ═══
  { text: "Half of what 'experts' say about [topic] is wrong.", type: "contrarian", niche: "general", platform: "linkedin" },
  { text: "840 out of 1000 people have never tried this. Here's the plan:", type: "stat", niche: "general", platform: "linkedin" },
  { text: "I tracked my entire workflow for 30 days. It was brutal:", type: "story", niche: "general", platform: "linkedin" },
  { text: "47,000 creators switched this year. Here's what they know:", type: "stat", niche: "marketing", platform: "linkedin" },
  { text: "You're still doing it the old way. But the rules changed.", type: "contrarian", niche: "general", platform: "linkedin" },
  { text: "I (secretly) became a SaaS founder. Here's what happened:", type: "confession", niche: "business", platform: "linkedin" },
  { text: "In 2026, this will replace 80% of manual work.", type: "fomo", niche: "tech", platform: "linkedin" },
  { text: "12 minutes per task. That's 45 days of your year.", type: "stat", niche: "general", platform: "linkedin" },
  { text: "While most people learn tools, smart people learn systems.", type: "contrarian", niche: "tech", platform: "linkedin" },
  { text: "I spent $0 and built what others charge $500/month for.", type: "story", niche: "tech", platform: "linkedin" },
  { text: "Everyone's talking about AI. Nobody's talking about this:", type: "fomo", niche: "tech", platform: "linkedin" },
  { text: "Your hook has 1.3 seconds. Here's how to use them:", type: "stat", niche: "marketing", platform: "linkedin" },

  // ═══ THREAD HOOKS (X/Facebook threads) ═══
  { text: "I grew 15K followers in 90 days. Here are the 7 prompts I use:", type: "story", niche: "marketing", platform: "x" },
  { text: "Most people build content wrong. Here's the system that works:", type: "contrarian", niche: "marketing", platform: "x" },
  { text: "BREAKING: Claude + Cursor is literally a cheatcode.", type: "fomo", niche: "tech", platform: "x" },
  { text: "I tested 50 AI tools this month. Only 7 were worth keeping:", type: "stat", niche: "tech", platform: "x" },
  { text: "RIP ChatGPT free tier. This open-source alternative is better:", type: "provocateur", niche: "tech", platform: "x" },
  { text: "In 2007, iPhone killed Nokia. In 2026, this will kill LinkedIn:", type: "provocateur", niche: "tech", platform: "x" },
  { text: "I automated my entire content pipeline. Total cost: $0.", type: "story", niche: "tech", platform: "x" },
  { text: "The 5-minute morning routine that 10x'd my output:", type: "promise", niche: "general", platform: "x" },
];

// ─── Niche detection from text ───

const NICHE_KEYWORDS: Record<Exclude<Niche, "general">, string[]> = {
  business: ["business", "entrepren", "startup", "company", "boss", "ceo", "employee", "freelance", "sales", "client", "revenue", "profit"],
  marketing: ["marketing", "content", "audience", "engagement", "viral", "post", "social media", "instagram", "tiktok", "linkedin", "branding", "ads"],
  tech: ["ai", "tech", "code", "develop", "chatgpt", "claude", "software", "app", "digital", "automat", "programming", "api"],
  finance: ["money", "finance", "invest", "stock", "savings", "salary", "income", "wealth", "etf", "crypto", "budget", "retire"],
  fitness: ["fitness", "muscle", "gym", "workout", "body", "weight", "kg", "lbs", "diet", "nutrition", "health", "running", "yoga"],
  education: ["learn", "study", "school", "course", "degree", "teach", "skill", "training", "university", "student"],
  lifestyle: ["habit", "morning", "productivity", "discipline", "life", "personal", "development", "mindset", "routine", "growth"],
};

export function detectNiche(text: string): Niche {
  if (!text || text.length < 3) return "general";
  const lower = text.toLowerCase();
  let bestNiche: Niche = "general";
  let bestScore = 0;

  for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS) as [Niche, string[]][]) {
    const score = keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestNiche = niche;
    }
  }
  return bestNiche;
}

// ─── Filter & retrieve hooks ───

export function getHooks(
  niche?: string,
  type?: HookType,
  limit: number = 10,
): Hook[] {
  let filtered = VIRAL_HOOKS;

  if (niche) {
    const n = niche.toLowerCase();
    const detected = (Object.keys(NICHE_KEYWORDS) as Niche[]).find((k) => n.includes(k)) ||
      (Object.entries(NICHE_KEYWORDS) as [Niche, string[]][]).find(([, kws]) => kws.some((kw) => n.includes(kw)))?.[0];

    if (detected) {
      filtered = VIRAL_HOOKS.filter((h) => h.niche === detected || h.niche === "general");
    }
  }

  if (type) {
    filtered = filtered.filter((h) => h.type === type);
  }

  return filtered
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}

// ─── Personalize a hook with user topic ───

export function personalizeHook(hook: string, topic: string): string {
  if (!topic) return hook;
  return hook.replace(/\[topic\]/g, topic);
}

// ─── Daily hook (deterministic per day + niche) ───

export function getDailyHook(niche?: string): Hook {
  const today = new Date();
  const dayKey = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const pool = niche ? getHooks(niche, undefined, 100) : VIRAL_HOOKS;
  const idx = dayKey % pool.length;
  return pool[idx] || VIRAL_HOOKS[0];
}
