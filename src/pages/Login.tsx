import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, ArrowRight, Eye, EyeOff, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, signUp, signInWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);
    setLoading(false);

    if (error) {
      toast.error(error);
      return;
    }

    if (isSignUp) {
      toast.success("Account created! Check your email to confirm.");
    } else {
      navigate("/dashboard");
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(error);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left: Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-background to-background" />
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center glow-sm">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">Supen.io</span>
        </div>

        <div className="relative z-10 max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold leading-tight mb-4"
          >
            Your content
            <br />
            <span className="text-gradient">creation hub</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground leading-relaxed"
          >
            Generate viral content in seconds. Sounds human, not robotic.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 flex gap-4 text-xs text-muted-foreground/60"
        >
          <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-primary/50" /> 10,000+ creators</span>
          <span>·</span>
          <span>6 platforms</span>
          <span>·</span>
          <span>Anti-AI</span>
        </motion.div>
      </div>

      {/* ── Right: Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:border-l lg:border-border/20 bg-card/20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-[320px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-lg font-bold">Supen.io</span>
          </div>

          <h2 className="text-xl font-bold mb-0.5">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            {isSignUp ? "Start creating content that connects." : "Sign in to your workspace."}
          </p>

          {/* Google */}
          <Button
            variant="outline"
            className="w-full h-9 gap-2 text-xs border-border/40 hover:bg-accent/40 mb-4"
            onClick={handleGoogleLogin}
          >
            <GoogleIcon /> Continue with Google
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-[10px] text-muted-foreground/40">or</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-accent/20 border-border/30 h-9 text-[13px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-accent/20 border-border/30 h-9 pr-9 text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-9 text-[13px] font-semibold glow-sm group"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? "Create account" : "Sign in"}
                  <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
            >
              {isSignUp ? "Already have an account? Sign in" : "No account? Sign up"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
