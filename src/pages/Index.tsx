import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { LogoFull } from "@/components/Logo";
import WaitlistSection from "@/components/WaitlistSection";
import { WaitlistPopup } from "@/components/WaitlistPopup";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showWaitlist, setShowWaitlist] = useState(false);

  /* 
  ⛔ GUARDRAIL: Auto-redirect disabled for pre-launch phase.
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);
  */

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30 selection:text-primary font-sans relative overflow-hidden">
      {/* Premium Atmospheric Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(36,168,155,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(36,168,155,0.02),transparent_70%)]" />
      </div>

      {/* ═══════════ NAVBAR (minimal) ═══════════ */}
      <nav className="relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-8">
          <Link to="/" className="hover:opacity-80 transition-all active:scale-95 shrink-0" onDoubleClick={() => navigate("/login")}>
            <LogoFull size="md" />
          </Link>
          
          <div className="flex items-center gap-4">
             <button 
               onClick={toggleTheme} 
               className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all border border-white/5"
             >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </button>
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => navigate("/login")} 
               className="text-muted-foreground/40 hover:text-muted-foreground text-[10px] uppercase tracking-widest font-bold"
             >
                Admin
             </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center relative z-10 px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-4xl"
        >
          {/* 
             ⛔ GUARDRAIL: This IS the whole page. 
             Do not add marketing sections here without explicit user permission.
          */}
          <WaitlistSection />
        </motion.div>
      </main>

      {/* Footer (minimal) */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
            © 2026 Supenli.ai. All rights reserved.
          </p>
          <div className="flex gap-8">
             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/10">Coming Soon</span>
             <a href="/terms" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/20 hover:text-primary transition-colors">Terms</a>
             <a href="/privacy" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/20 hover:text-primary transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
      
      <WaitlistPopup isOpen={showWaitlist} onClose={() => setShowWaitlist(false)} />
    </div>
  );
};

export default Index;
