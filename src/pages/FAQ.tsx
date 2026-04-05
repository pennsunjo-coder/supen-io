import { useState } from "react";
import { Link } from "react-router-dom";
import { LogoFull } from "@/components/Logo";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  {
    q: "Is the content really undetectable as AI?",
    a: "Our Anti-AI humanization protocol rewrites content to match human writing patterns. We enforce a grade 5 reading level, ban common AI phrases (like \"delve\", \"tapestry\", \"pivotal\"), eliminate parallel structures, and inject natural imperfections. While no system is 100% guaranteed, our users consistently pass AI detection tools like GPTZero and Originality.ai.",
  },
  {
    q: "What platforms do you support?",
    a: "Supen.io generates optimized content for Instagram (posts, carousels, Reels scripts), TikTok (scripts, hooks), Facebook (posts, Reels), LinkedIn (articles, thought leadership posts), YouTube (scripts, descriptions, titles), and X/Twitter (threads, single posts). Each platform has dedicated formats with the right tone, length, and structure.",
  },
  {
    q: "Can I use my own documents as research sources?",
    a: "Yes! You can upload PDFs, paste URLs (articles, blog posts), add YouTube video links (we extract transcripts), or write your own notes. All sources are chunked, indexed, and searchable. When you generate content, our RAG system automatically pulls relevant context from your sources to make your posts accurate and data-driven.",
  },
  {
    q: "How does the RAG system work?",
    a: "RAG (Retrieval-Augmented Generation) means your documents are split into searchable chunks and stored in our database. When you generate content, we search your sources for the most relevant passages using text similarity (pg_trgm), then feed that context to the AI alongside viral content patterns. The result: content that's both factually grounded in your research and optimized for engagement.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes! The free plan includes access to the YouTube Transcriber tool (unlimited), 5 content generations per day, and basic source management. It's perfect for trying out the platform and seeing the quality of our output before committing to a paid plan.",
  },
  {
    q: "What's included in Pro and Business plans?",
    a: "Pro ($10/month) unlocks unlimited generations, all 6 platforms, advanced Anti-AI protocol, content history, and priority support. Business ($29/month) adds team collaboration, API access, custom brand voice profiles, advanced analytics, and a dedicated account manager.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Absolutely. There's no commitment or lock-in period. Cancel anytime from your Settings page — you'll keep access until the end of your current billing period. No hidden fees, no cancellation penalties.",
  },
  {
    q: "What languages are supported?",
    a: "Supen.io supports content generation in English and French. The dashboard interface is in French, while the landing page is in English. We're planning to add more languages (Spanish, Portuguese, German) based on user demand.",
  },
  {
    q: "How is my data protected?",
    a: "Your data is stored on Supabase infrastructure with PostgreSQL databases, encrypted at rest and in transit. We use Row Level Security (RLS) to ensure you can only access your own data. We never share, sell, or use your content to train AI models. You can delete your account and all data at any time from Settings.",
  },
  {
    q: "Can I generate infographics and images?",
    a: "Yes! After generating your content, Supen.io offers an infographic creator powered by Google Gemini. Choose a visual style (Sketchnote, Modern, or Colorful), and we generate a 1080x1080 PNG image ready for Instagram, LinkedIn, or any platform. You can also get image prompt suggestions for tools like Midjourney or DALL-E.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="h-14 border-b border-border/20 flex items-center px-6 max-w-3xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <LogoFull size="sm" />
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="text-sm text-muted-foreground mb-12">Everything you need to know about Supen.io</p>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="border border-border/20 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-accent/20 transition-colors"
              >
                <span className="text-sm font-medium pr-4">{faq.q}</span>
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200",
                  openIndex === i && "rotate-180",
                )} />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">Still have questions?</p>
          <Link
            to="/contact"
            className="text-sm text-primary hover:underline font-medium"
          >
            Contact our support team
          </Link>
        </div>
      </main>
    </div>
  );
}
