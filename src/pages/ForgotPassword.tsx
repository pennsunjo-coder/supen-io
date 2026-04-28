import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      if (error) throw error;
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Supenli.io</h1>
          <p className="text-muted-foreground text-sm mt-1">Reset your password</p>
        </div>

        <div className="bg-card border border-border/30 rounded-2xl p-8 shadow-xl">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold mb-2">Check your email</h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                We sent a reset link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Click the link to reset your password.
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
                Try again
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold mb-1">Forgot your password?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full font-semibold h-11" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
