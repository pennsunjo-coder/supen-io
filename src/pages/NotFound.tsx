import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoFull } from "@/components/Logo";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.warn("[404]", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar with logo */}
      <header className="px-6 py-5 shrink-0">
        <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
          <LogoFull size="sm" />
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/[0.06] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-md w-full text-center">
          {/* Animated 404 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-6"
          >
            <h1 className="text-[120px] md:text-[160px] font-black leading-none tracking-tighter">
              <motion.span
                className="inline-block text-foreground"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0 }}
              >
                4
              </motion.span>
              <motion.span
                className="inline-block text-gradient mx-1"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              >
                0
              </motion.span>
              <motion.span
                className="inline-block text-foreground"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              >
                4
              </motion.span>
            </h1>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <Compass className="w-3 h-3 text-amber-400" />
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Page not found</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              This page went viral... somewhere else.
            </h2>
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
              We can't find this page. But your next viral post is waiting in the dashboard.
            </p>
            {location.pathname && location.pathname !== "/" && (
              <code className="text-[11px] text-muted-foreground/60 block mb-8 break-all">
                {location.pathname}
              </code>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button onClick={() => navigate("/")} className="gap-2 h-11 px-6">
              <Home className="w-4 h-4" />
              Back to home
            </Button>
            <Button onClick={() => navigate("/dashboard")} variant="outline" className="gap-2 h-11 px-6">
              <ArrowLeft className="w-4 h-4" />
              Go to dashboard
            </Button>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[11px] text-muted-foreground/40">
        © 2026 Supen.io
      </footer>
    </div>
  );
};

export default NotFound;
