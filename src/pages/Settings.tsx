import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, User, Sliders, CreditCard, Info,
  LogOut, Trash2, ExternalLink, Crown, Check, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { PLANS, createCheckoutSession, isPlanActive, type Plan } from "@/lib/stripe";

/* ─── Types ─── */

const PLATFORMS = [
  { id: "LinkedIn", label: "LinkedIn" },
  { id: "X (Twitter)", label: "X (Twitter)" },
  { id: "Instagram", label: "Instagram" },
  { id: "YouTube", label: "YouTube" },
  { id: "Facebook", label: "Facebook" },
  { id: "TikTok", label: "TikTok" },
];

const NICHES = [
  "Marketing", "Tech", "Business", "Finance", "Health",
  "Personal development", "Education", "Design", "Other",
];

const LANGUAGES = [
  { id: "fr", label: "French" },
  { id: "en", label: "English" },
  { id: "both", label: "Both" },
];

const TONES = [
  { id: "educatif", label: "Educational" },
  { id: "inspirant", label: "Inspiring" },
  { id: "pratique", label: "Practical" },
  { id: "humoristique", label: "Humorous" },
];

const LENGTHS = [
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "long", label: "Long" },
];

type Section = "profil" | "preferences" | "compte" | "about";

const NAV_ITEMS: { id: Section; label: string; icon: typeof User }[] = [
  { id: "profil", label: "Profil", icon: User },
  { id: "preferences", label: "Preferences", icon: Sliders },
  { id: "compte", label: "Abonnement", icon: CreditCard },
  { id: "about", label: "A propos", icon: Info },
];

/* ─── Component ─── */

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();

  const [activeSection, setActiveSection] = useState<Section>("profil");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [niche, setNiche] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);

  // Preferences
  const [language, setLanguage] = useState("fr");
  const [tone, setTone] = useState("educatif");
  const [length, setLength] = useState("medium");
  const [antiAi, setAntiAi] = useState(true);

  // Danger zone
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Billing
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const currentPlan = (profile?.plan || "free") as Plan;
  const planActive = isPlanActive(profile?.plan, profile?.plan_expires_at);

  async function handleUpgrade(plan: "pro" | "business") {
    if (!user) return;
    setUpgrading(plan);
    try {
      const url = await createCheckoutSession(plan, user.id, user.email!);
      window.location.href = url;
    } catch {
      toast.error("Erreur lors du demarrage du paiement. Reessaye.");
    }
    setUpgrading(null);
  }

  // Load profile data
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setNiche(profile.niche || "");
      setPlatforms(profile.platforms || []);
    }
  }, [profile]);

  function togglePlatform(id: string) {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function handleSaveProfile() {
    setSaving(true);
    const { success, error } = await updateProfile({
      first_name: firstName,
      niche,
      platforms,
    });
    setSaving(false);
    if (success) {
      toast.success("Profile saved");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } else {
      toast.error(error || "Error saving");
    }
  }

  async function handleLogout() {
    await signOut();
    navigate("/");
  }

  async function handleDeleteAccount() {
    if (!user) return;
    try {
      // Delete profile + content, then sign out
      await supabase.from("user_profiles").delete().eq("user_id", user.id);
      await supabase.from("generated_content").delete().eq("user_id", user.id);
      await supabase.from("sources").delete().eq("user_id", user.id);
      await signOut();
      toast.success("Account deleted");
      navigate("/");
    } catch {
      toast.error("Error deleting account");
    }
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="h-12 border-b border-border/20 flex items-center px-4 shrink-0">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </button>
        <h1 className="ml-auto text-sm font-semibold">Settings</h1>
      </header>

      <div className="flex max-w-5xl mx-auto py-8 px-4 gap-8">
        {/* Sidebar nav */}
        <nav className="w-48 shrink-0 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                activeSection === item.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* ═══ PROFIL ═══ */}
          {activeSection === "profil" && (
            <>
              <div>
                <h2 className="text-lg font-bold mb-1">Profile</h2>
                <p className="text-sm text-muted-foreground">Your personal information</p>
              </div>

              <div className="bg-card border border-border/30 rounded-xl p-6 space-y-5">
                {/* First name */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">First name</label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Your first name"
                    className="max-w-sm"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="max-w-sm bg-muted/50 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Email cannot be changed</p>
                </div>

                {/* Niche */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Niche / Field</label>
                  <div className="flex flex-wrap gap-2">
                    {NICHES.map((n) => (
                      <button
                        key={n}
                        onClick={() => setNiche(n)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs border transition-all",
                          niche === n
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border/30 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platforms */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Preferred platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all",
                          platforms.includes(p.id)
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border/30 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        )}
                      >
                        {platforms.includes(p.id) && <Check className="w-3 h-3" />}
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save */}
                <div className="pt-2">
                  <Button onClick={handleSaveProfile} disabled={saving || justSaved} className="h-9 gap-2 text-xs">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {justSaved ? "Sauvegarde !" : "Sauvegarder"}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* ═══ PRÉFÉRENCES ═══ */}
          {activeSection === "preferences" && (
            <>
              <div>
                <h2 className="text-lg font-bold mb-1">Content preferences</h2>
                <p className="text-sm text-muted-foreground">Customize content generation</p>
              </div>

              <div className="bg-card border border-border/30 rounded-xl p-6 space-y-6">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Bientot disponible
                </span>

                {/* Langue */}
                <div className="opacity-50 pointer-events-none">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Generation language</label>
                  <div className="flex gap-2">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setLanguage(l.id)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-xs border transition-all",
                          language === l.id
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border/30 text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ton */}
                <div className="opacity-50 pointer-events-none">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Default tone</label>
                  <div className="flex flex-wrap gap-2">
                    {TONES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTone(t.id)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-xs border transition-all",
                          tone === t.id
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border/30 text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Longueur */}
                <div className="opacity-50 pointer-events-none">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Preferred length</label>
                  <div className="flex gap-2">
                    {LENGTHS.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setLength(l.id)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-xs border transition-all",
                          length === l.id
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border/30 text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Anti-IA */}
                <div className="flex items-center justify-between py-3 border-t border-border/20">
                  <div>
                    <p className="text-sm font-medium">Anti-AI Protocol</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Automatically humanizes generated content
                    </p>
                  </div>
                  <Switch checked={antiAi} onCheckedChange={setAntiAi} />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Les preferences de langue, ton et longueur seront bientot disponibles. Le protocole Anti-IA est deja actif.
              </p>
            </>
          )}

          {/* ═══ COMPTE ═══ */}
          {activeSection === "compte" && (
            <>
              <div>
                <h2 className="text-lg font-bold mb-1">Abonnement</h2>
                <p className="text-sm text-muted-foreground">Gere ton abonnement et ton compte</p>
              </div>

              {/* Plan cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.entries(PLANS) as [Plan, typeof PLANS[Plan]][]).map(([planId, config]) => {
                  const isCurrent = currentPlan === planId && (planId === "free" || planActive);
                  return (
                    <div key={planId} className={cn("bg-card border rounded-xl p-5 relative flex flex-col", config.color, isCurrent && "ring-1 ring-primary/30")}>
                      {config.badge && (
                        <span className={cn("absolute -top-2.5 left-4 text-[9px] font-semibold px-2 py-0.5 rounded-full", planId === "pro" ? "bg-primary/15 text-primary" : "bg-amber-500/15 text-amber-400")}>
                          {config.badge}
                        </span>
                      )}
                      <div className="mb-4">
                        <p className="text-sm font-bold mb-1">{config.name}</p>
                        <p className="text-2xl font-bold">
                          {config.price === 0 ? "Gratuit" : `$${config.price}`}
                          {config.price > 0 && <span className="text-xs font-normal text-muted-foreground">/mois</span>}
                        </p>
                      </div>
                      <ul className="space-y-2 mb-5 flex-1">
                        {config.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Check className="w-3.5 h-3.5 text-primary/60 shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {isCurrent ? (
                        <Button variant="outline" disabled className="w-full h-9 text-xs">
                          Plan actuel
                        </Button>
                      ) : planId !== "free" ? (
                        <Button
                          onClick={() => handleUpgrade(planId as "pro" | "business")}
                          disabled={!!upgrading}
                          className={cn("w-full h-9 text-xs gap-1.5 font-semibold", planId === "business" && "bg-amber-500 hover:bg-amber-600 text-white")}
                        >
                          {upgrading === planId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crown className="w-3.5 h-3.5" />}
                          {upgrading === planId ? "Redirection..." : `Passer a ${config.name}`}
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* Deconnexion */}
              <div className="bg-card border border-border/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Deconnexion</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tu pourras te reconnecter a tout moment
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="h-9 gap-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Se deconnecter
                  </Button>
                </div>
              </div>

              {/* Zone dangereuse */}
              <div className="bg-card border border-destructive/20 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Trash2 className="w-4 h-4 text-destructive" />
                  <p className="text-sm font-semibold text-destructive">Zone dangereuse</p>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  La suppression de ton compte est irreversible. Toutes tes donnees (sources, contenu, profil) seront definitivement effacees.
                </p>
                {!showDeleteConfirm ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="h-9 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    Supprimer mon compte
                  </Button>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-destructive font-medium">Es-tu sur ?</p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAccount}
                      className="h-8 text-xs"
                    >
                      Oui, supprimer definitivement
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="h-8 text-xs"
                    >
                      Annuler
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══ À PROPOS ═══ */}
          {activeSection === "about" && (
            <>
              <div>
                <h2 className="text-lg font-bold mb-1">About</h2>
                <p className="text-sm text-muted-foreground">Application information</p>
              </div>

              <div className="bg-card border border-border/30 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between py-2">
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p className="text-sm font-mono font-medium">1.0.0</p>
                </div>
                <div className="border-t border-border/20" />
                <div className="flex items-center justify-between py-2">
                  <p className="text-sm text-muted-foreground">Website</p>
                  <Link
                    to="/"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    supen.io <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div className="border-t border-border/20" />
                <div className="flex items-center justify-between py-2">
                  <p className="text-sm text-muted-foreground">Support</p>
                  <a
                    href="mailto:support@supen.io"
                    className="text-sm text-primary hover:underline"
                  >
                    support@supen.io
                  </a>
                </div>
                <div className="border-t border-border/20" />
                <div className="flex items-center justify-between py-2">
                  <p className="text-sm text-muted-foreground">Powered by</p>
                  <p className="text-sm font-medium">Claude Sonnet + Gemini Flash</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
