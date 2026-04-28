import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Check, Users, Loader2, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateEmail } from "@/lib/security";

const SEED_COUNT = 2400;

const plans = [
  { id: "free" as const, label: "Free", desc: "Notify me" },
  { id: "plus" as const, label: "Plus", desc: "$10/mo" },
  { id: "pro" as const, label: "Pro", desc: "$29/mo" },
];

export default function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [plan, setPlan] = useState<"free" | "plus" | "pro">("free");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("waitlist")
      .select("id", { count: "exact", head: true })
      .then(({ count: c }) => {
        if (c !== null) setCount(c + SEED_COUNT);
      });
  }, []);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();

    const trimmedEmail = email.toLowerCase().trim();
    if (!trimmedEmail || !validateEmail(trimmedEmail)) {
      toast.error("Please enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("waitlist").insert({
        email: trimmedEmail,
        first_name: firstName.trim(),
        plan,
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already on the list!");
          setJoined(true);
        } else {
          throw error;
        }
      } else {
        setJoined(true);
        if (count !== null) setCount(count + 1);
        toast.success("You're on the waitlist!");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleShare() {
    const shareData = {
      title: "Join Supenli.io waitlist",
      text: "I just joined the Supenli.io waitlist — viral content creation powered by AI. Join me!",
      url: "https://supenli.io/#waitlist",
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        navigator.clipboard.writeText(shareData.url);
        toast.success("Link copied!");
      });
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast.success("Link copied!");
    }
  }

  return (
    <section className="py-24 px-4 relative overflow-hidden" id="waitlist">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/[0.06] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Coming Soon
        </div>

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Be First. Get Notified on{" "}
          <span className="text-gradient">Launch Day.</span>
        </h2>

        <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto leading-relaxed">
          Join creators waiting for early access.
          Sign up now and get notified the moment we launch.
        </p>

        {/* Counter */}
        {count !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8"
          >
            <Users className="w-4 h-4" />
            <span>
              <strong className="text-foreground">{count.toLocaleString()}</strong>{" "}
              people already joined
            </span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!joined ? (
            <motion.form
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleJoin}
              className="space-y-4"
            >
              {/* Plan selector */}
              <div className="flex justify-center gap-2 mb-6">
                {plans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlan(p.id)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-sm font-medium border transition-all",
                      plan === p.id
                        ? "border-primary bg-primary/10 text-foreground shadow-sm"
                        : "border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50"
                    )}
                  >
                    <div className="font-bold">{p.label}</div>
                    <div className="text-[11px] opacity-70">{p.desc}</div>
                  </button>
                ))}
              </div>

              {/* Inputs */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="text"
                  placeholder="First name (optional)"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-12 bg-card border-border/30"
                  maxLength={100}
                />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-card border-border/30"
                  maxLength={254}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full max-w-md mx-auto h-12 text-base font-semibold gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Join the Waitlist
                    <span className="ml-1">→</span>
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground/60">
                No spam. Unsubscribe anytime.
              </p>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">You're in!</h3>
              <p className="text-muted-foreground leading-relaxed">
                We'll email you at <strong className="text-foreground">{email}</strong> on launch day.
                <br />
                Tell your creator friends →
              </p>
              <Button
                variant="outline"
                className="mt-4 gap-2"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
                Share with friends
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
