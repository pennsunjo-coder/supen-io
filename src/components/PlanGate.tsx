import { useState } from "react";
import { Loader2, Crown, Check, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-profile";
import { useAdmin } from "@/hooks/use-admin";
import { PLANS, createCheckoutSession, isPlanActive } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Hard paywall — every unpaid non-admin user is gated to the plan picker.
// Enabled by default now that Stripe checkout is live. Set
// VITE_PAYWALL_ENABLED=false in Vercel only as an emergency kill-switch.
const PAYWALL_ENABLED = import.meta.env.VITE_PAYWALL_ENABLED !== "false";

/**
 * Wraps the app. A user with no active Plus/Pro subscription sees the plan
 * picker instead of the app. Admins and active subscribers pass through.
 */
export default function PlanGate({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { isAdmin } = useAdmin();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const active = isPlanActive(profile?.plan, profile?.plan_expires_at);

  if (!PAYWALL_ENABLED || isAdmin || active) {
    return <>{children}</>;
  }

  async function handleChoose(plan: "plus" | "pro") {
    if (!user?.id || !user?.email) {
      toast.error("Please sign in again.");
      return;
    }
    setUpgrading(plan);
    try {
      const url = await createCheckoutSession(plan, user.id, user.email);
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout.");
      setUpgrading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-8 max-w-lg">
        <h1 className="text-2xl font-bold mb-2">Choose your plan to get started</h1>
        <p className="text-sm text-muted-foreground">
          Supenli.ai is a paid tool. Pick the plan that fits your growth and start creating.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        {(Object.entries(PLANS) as ["plus" | "pro", (typeof PLANS)["plus"]][]).map(([planId, config]) => (
          <div key={planId} className={cn("bg-card border rounded-xl p-6 relative flex flex-col", config.color)}>
            {config.badge && (
              <span className={cn("absolute -top-2.5 left-5 text-[9px] font-semibold px-2 py-0.5 rounded-full", planId === "pro" ? "bg-amber-500/15 text-amber-400" : "bg-primary/15 text-primary")}>
                {config.badge}
              </span>
            )}
            <div className="mb-4">
              <p className="text-sm font-bold mb-1">{config.name}</p>
              <p className="text-3xl font-bold">
                ${config.price}
                <span className="text-xs font-normal text-muted-foreground">/month</span>
              </p>
            </div>
            <ul className="space-y-2 mb-6 flex-1">
              {config.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-primary/60 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleChoose(planId)}
              disabled={!!upgrading}
              className={cn("w-full h-10 text-sm gap-1.5 font-semibold", planId === "pro" && "bg-amber-500 hover:bg-amber-600 text-white")}
            >
              {upgrading === planId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
              {upgrading === planId ? "Redirecting..." : `Get ${config.name}`}
            </Button>
          </div>
        ))}
      </div>

      <button
        onClick={() => signOut()}
        className="mt-8 text-xs text-muted-foreground/60 hover:text-foreground transition-colors flex items-center gap-1.5"
      >
        <LogOut className="w-3 h-3" /> Sign out
      </button>
    </div>
  );
}
