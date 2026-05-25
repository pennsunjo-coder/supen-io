import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Sun, Moon, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { LogoFull } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAILS } from "@/hooks/use-admin";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Admins already signed in: shortcut straight to the subscription page.
  useEffect(() => {
    if (user?.email && ADMIN_EMAILS.includes(user.email)) {
      navigate("/settings");
    }
  }, [user, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-8 h-8 border-2 border-[#24A89B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
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

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all border border-white/5"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Button
              onClick={() => navigate("/login")}
              variant="ghost"
              className="h-10 px-4 text-white/70 hover:text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-[0.2em]"
            >
              Sign in
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#24A89B]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Now live</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1] tracking-tight">
            The Future of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#24A89B] to-[#24A89B]/60">Viral Content.</span>
          </h1>

          <p className="text-white/60 text-lg md:text-xl font-medium max-w-lg mx-auto mb-10 leading-relaxed">
            Stop guessing. Start growing. Supenli.ai is the elite engine for high-performance creators.
          </p>

          <div className="flex flex-col items-center mb-10">
            <div className="flex -space-x-3 mb-4">
              {[23, 32, 68, 44].map((i) => (
                <img key={i} src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? "men" : "women"}/${i}.jpg`} className="w-10 h-10 rounded-full border-2 border-[#050505] object-cover" alt="User" />
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-[#050505] bg-[#24A89B]/20 flex items-center justify-center text-[10px] font-black text-[#24A89B]">
                +2k
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Trusted by an elite circle of creators</span>
          </div>

          <Button
            onClick={() => navigate("/login")}
            className="h-14 px-10 bg-[#24A89B] hover:bg-[#1a8a7f] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#24A89B]/20 transition-all active:scale-95 gap-3 text-sm"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mt-6">
            Plans from $10/month · cancel anytime
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10">
            © 2026 Supenli.ai · Built for virality.
          </p>
          <div className="flex gap-6">
            <Link to="/faq" className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors">FAQ</Link>
            <Link to="/privacy" className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors">Privacy</Link>
            <Link to="/terms" className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors">Terms</Link>
            <Link to="/contact" className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
