import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Sparkles, Users, Mail, CheckCircle, Flame, Zap, Gift } from "lucide-react";
import confetti from "canvas-confetti";

interface WaitlistPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WaitlistPopup({ isOpen, onClose }: WaitlistPopupProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);
    setError("");
    console.log("[Waitlist] Submitting:", { name: name.trim(), email: email.trim() });

    try {
      const { error: dbError } = await supabase
        .from("waitlist")
        .insert({ name: name.trim(), email: email.trim().toLowerCase() });

      console.log("[Waitlist] Insert result:", dbError ? dbError.message : "OK");

      if (dbError) {
        if (dbError.code === "23505") {
          setError("This email is already registered!");
          setLoading(false);
          return;
        }
        throw dbError;
      }

      supabase.functions.invoke("bright-processor", {
        body: {
          to: email.trim(),
          subject: "You're on the list! Supenli.io is coming soon",
          type: "waitlist",
          data: { name: name.trim() },
        },
      }).catch((e) => console.warn("[Waitlist] Email failed:", e));

      // Confetti explosion
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ["#24A89B", "#1a8a7f", "#ffffff", "#a7f3d0", "#34d399"] });
      setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: ["#24A89B", "#ffffff", "#6ee7b7"] }), 300);
      setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ["#24A89B", "#ffffff", "#6ee7b7"] }), 600);

      setDone(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error("[Waitlist] Error:", msg);
      setError(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#1a1a2e] rounded-2xl border border-[#24A89B]/20 shadow-2xl shadow-black/50 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#24A89B] to-[#1a8a7f]" />

        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors z-10">
          <X className="w-4 h-4 text-white/60" />
        </button>

        <div className="p-8">
          {done ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-[#24A89B]/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#24A89B]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Congratulations!</h2>
              <p className="text-white/60 text-sm leading-relaxed mb-2">
                You're officially on the <span className="text-[#24A89B] font-semibold">Supenli.io</span> priority list!
              </p>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                We'll notify you the moment we go live. You'll be among the first to get access.
              </p>
              <Button onClick={onClose} className="bg-[#24A89B] hover:bg-[#1a8a7f] text-white font-semibold px-8">
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-[#24A89B]/10 border border-[#24A89B]/20 rounded-full px-4 py-1.5 mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-[#24A89B]" />
                  <span className="text-[#24A89B] text-xs font-semibold">Early Access</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                  Supenli.io is coming<br /><span className="text-[#24A89B]">very soon</span>
                </h2>
                <p className="text-white/60 text-sm leading-relaxed">
                  Join now to be notified first and get <strong className="text-white">priority access</strong> on launch day.
                </p>
              </div>

              <div className="flex items-center justify-center gap-6 mb-6 py-3 px-4 bg-white/[0.03] rounded-xl border border-white/5">
                <div className="text-center">
                  <Flame className="w-5 h-5 text-[#24A89B] mx-auto mb-1" />
                  <p className="text-white/40 text-xs">Launching soon</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <Zap className="w-5 h-5 text-[#24A89B] mx-auto mb-1" />
                  <p className="text-white/40 text-xs">Priority access</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <Gift className="w-5 h-5 text-[#24A89B] mx-auto mb-1" />
                  <p className="text-white/40 text-xs">Exclusive deals</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your first name"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#24A89B]/50 h-11"
                    required
                    autoFocus
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#24A89B]/50 h-11"
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-amber-400 bg-amber-400/10 rounded-lg px-3 py-2">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 font-bold text-base gap-2 bg-gradient-to-r from-[#24A89B] to-[#1a8a7f] hover:from-[#1a8a7f] hover:to-[#147a6f] text-white border-0 shadow-lg shadow-[#24A89B]/20"
                >
                  {loading ? "Joining..." : <><Sparkles className="w-4 h-4" /> Join the priority list</>}
                </Button>

                <p className="text-center text-xs text-white/30">No spam. One email on launch day.</p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
