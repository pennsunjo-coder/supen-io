import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setValidSession(true);
      } else {
        toast.error("Invalid or expired reset link.");
        navigate("/forgot-password");
      }
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setDone(true);
      toast.success("Password updated successfully!");

      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!validSession) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Supen.io</h1>
          <p className="text-muted-foreground text-sm mt-1">Create a new password</p>
        </div>

        <div className="bg-card border border-border/30 rounded-2xl p-8 shadow-xl">
          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold mb-2">Password updated!</h2>
              <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold mb-1">Create new password</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Choose a strong password for your account.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="pl-9 pr-9"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat your password"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            password.length >= i * 3
                              ? i <= 1
                                ? "bg-red-400"
                                : i <= 2
                                  ? "bg-amber-400"
                                  : i <= 3
                                    ? "bg-blue-400"
                                    : "bg-emerald-400"
                              : "bg-accent/40"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {password.length < 4
                        ? "Too short"
                        : password.length < 7
                          ? "Weak"
                          : password.length < 10
                            ? "Good"
                            : "Strong"}
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full font-semibold h-11" disabled={loading}>
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
