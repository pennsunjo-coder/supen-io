import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Mail, Phone, Sparkles, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { LogoFull } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-8 h-8 border-2 border-[#24A89B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("waitlist")
        .insert({ 
          email: email.trim().toLowerCase(), 
          phone: phone.trim(),
          plan: "early_access" 
        });

      if (error) {
        if (error.code === "23505") {
          setSubmitted(true);
          return;
        }
        throw error;
      }

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#24A89B", "#ffffff", "#1a1a1a"]
      });

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-white selection:bg-[#24A89B]/30 font-sans relative overflow-hidden">
      {/* Premium Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#24A89B]/10 blur-[150px] rounded-full opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#24A89B]/5 blur-[120px] rounded-full opacity-30" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-8">
          <Link to="/" className="hover:opacity-80 transition-all active:scale-95 shrink-0" onDoubleClick={() => navigate("/login")}>
            <LogoFull size="md" />
          </Link>
          
          <div className="flex items-center gap-4">
             <button 
               onClick={toggleTheme} 
               className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all border border-white/5"
             >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </button>
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => navigate("/login")} 
               className="text-white/20 hover:text-white/60 text-[10px] uppercase tracking-widest font-bold"
             >
                Admin
             </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 py-12 text-center">
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-[#24A89B]" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Master the next era</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1] tracking-tight">
                The Future of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#24A89B] to-[#6366f1]">Viral Content.</span>
              </h1>

              <p className="text-white/60 text-lg md:text-xl font-medium max-w-lg mx-auto mb-10 leading-relaxed">
                Stop guessing. Start growing. Supenli.ai is the elite engine for high-performance creators.
              </p>

              <div className="flex flex-col items-center mb-12">
                <div className="flex -space-x-3 mb-4">
                  {[23, 32, 68, 44].map((i) => (
                    <img key={i} src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? "men" : "women"}/${i}.jpg`} className="w-10 h-10 rounded-full border-2 border-[#050505] object-cover" alt="User" />
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-[#050505] bg-[#24A89B]/20 flex items-center justify-center text-[10px] font-black text-[#24A89B]">
                    +2k
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Join the elite circle of early creators</span>
              </div>

              <form onSubmit={handleJoin} className="w-full max-w-md mx-auto space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-[#24A89B] transition-colors" />
                  <Input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#24A89B]/50 rounded-2xl transition-all"
                  />
                </div>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-[#24A89B] transition-colors" />
                  <Input 
                    type="tel" 
                    placeholder="Phone number (optional)" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-14 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#24A89B]/50 rounded-2xl transition-all"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 bg-[#24A89B] hover:bg-[#1a8a7f] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#24A89B]/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? "Joining..." : "Reserve My Spot"}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="w-full max-w-lg p-12 rounded-[40px] bg-white/[0.03] border border-white/5 backdrop-blur-3xl shadow-2xl relative"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#24A89B]/10 to-transparent rounded-[40px]" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#24A89B] to-[#1a8a7f] flex items-center justify-center mb-10 shadow-2xl shadow-[#24A89B]/20">
                  <Check className="w-10 h-10 text-white" />
                </div>

                <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight tracking-tight">
                  Spot <br /> Reserved.
                </h2>

                <p className="text-white/60 text-lg md:text-xl font-medium mb-10 leading-relaxed">
                  You're in. We'll reach out soon.
                </p>

                <Button 
                  onClick={() => setSubmitted(false)}
                  variant="ghost"
                  className="text-white/30 hover:text-white/60 text-[10px] uppercase tracking-widest font-black"
                >
                   Wait for launch
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10">
            © 2026 Supenli.ai. Built for virality.
          </p>
          <div className="flex gap-8">
             <span className="text-[10px] font-black uppercase tracking-widest text-white/5">Coming Soon</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
