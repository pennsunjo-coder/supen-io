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
  "Marketing", "Tech", "Business", "Finance", "Santé",
  "Développement personnel", "Éducation", "Design", "Autre",
];

const LANGUAGES = [
  { id: "fr", label: "Français" },
  { id: "en", label: "Anglais" },
  { id: "both", label: "Les deux" },
];

const TONES = [
  { id: "educatif", label: "Éducatif" },
  { id: "inspirant", label: "Inspirant" },
  { id: "pratique", label: "Pratique" },
  { id: "humoristique", label: "Humoristique" },
];

const LENGTHS = [
  { id: "short", label: "Court" },
  { id: "medium", label: "Moyen" },
  { id: "long", label: "Long" },
];

type Section = "profil" | "preferences" | "compte" | "about";

const NAV_ITEMS: { id: Section; label: string; icon: typeof User }[] = [
  { id: "profil", label: "Profil", icon: User },
  { id: "preferences", label: "Préférences", icon: Sliders },
  { id: "compte", label: "Compte", icon: CreditCard },
  { id: "about", label: "À propos", icon: Info },
];

/* ─── Component ─── */

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();

  const [activeSection, setActiveSection] = useState<Section>("profil");
  const [saving, setSaving] = useState(false);

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
      toast.success("Profil sauvegardé");
    } else {
      toast.error(error || "Erreur lors de la sauvegarde");
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
      toast.success("Compte supprimé");
      navigate("/");
    } catch {
      toast.error("Erreur lors de la suppression");
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
          Retour au dashboard
        </button>
        <h1 className="ml-auto text-sm font-semibold">Paramètres</h1>
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
                <h2 className="text-lg font-bold mb-1">Profil</h2>
                <p className="text-sm text-muted-foreground">Tes informations personnelles</p>
              </div>

              <div className="bg-card border border-border/30 rounded-xl p-6 space-y-5">
                {/* Prénom */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Prénom</label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ton prénom"
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
                  <p className="text-[11px] text-muted-foreground mt-1">L'email ne peut pas être modifié</p>
                </div>

                {/* Niche */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Niche / Domaine</label>
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

                {/* Plateformes */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Plateformes préférées</label>
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
                  <Button onClick={handleSaveProfile} disabled={saving} className="h-9 gap-2 text-xs">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Sauvegarder
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* ═══ PRÉFÉRENCES ═══ */}
          {activeSection === "preferences" && (
            <>
              <div>
                <h2 className="text-lg font-bold mb-1">Préférences de contenu</h2>
                <p className="text-sm text-muted-foreground">Personnalise la génération de contenu</p>
              </div>

              <div className="bg-card border border-border/30 rounded-xl p-6 space-y-6">
                {/* Langue */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Langue de génération</label>
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
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Ton par défaut</label>
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
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Longueur préférée</label>
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
                    <p className="text-sm font-medium">Protocole Anti-IA</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Humanise automatiquement le contenu généré
                    </p>
                  </div>
                  <Switch checked={antiAi} onCheckedChange={setAntiAi} />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Ces préférences seront bientôt prises en compte lors de la génération.
              </p>
            </>
          )}

          {/* ═══ COMPTE ═══ */}
          {activeSection === "compte" && (
            <>
              <div>
                <h2 className="text-lg font-bold mb-1">Compte</h2>
                <p className="text-sm text-muted-foreground">Gère ton abonnement et ton compte</p>
              </div>

              {/* Plan actuel */}
              <div className="bg-card border border-border/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-4 h-4 text-primary" />
                      <p className="text-sm font-semibold">Plan actuel</p>
                    </div>
                    <p className="text-2xl font-bold">Free</p>
                    <p className="text-xs text-muted-foreground mt-1">5 générations / jour</p>
                  </div>
                  <Button className="h-9 gap-2 text-xs">
                    <Crown className="w-3.5 h-3.5" />
                    Upgrader mon plan
                  </Button>
                </div>
              </div>

              {/* Déconnexion */}
              <div className="bg-card border border-border/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Se déconnecter</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tu pourras te reconnecter à tout moment
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="h-9 gap-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Déconnexion
                  </Button>
                </div>
              </div>

              {/* Zone danger */}
              <div className="bg-card border border-destructive/20 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Trash2 className="w-4 h-4 text-destructive" />
                  <p className="text-sm font-semibold text-destructive">Zone danger</p>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  La suppression de ton compte est irréversible. Toutes tes données (sources, contenus, profil) seront définitivement effacées.
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
                    <p className="text-xs text-destructive font-medium">Es-tu sûr ?</p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAccount}
                      className="h-8 text-xs"
                    >
                      Oui, supprimer définitivement
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
                <h2 className="text-lg font-bold mb-1">À propos</h2>
                <p className="text-sm text-muted-foreground">Informations sur l'application</p>
              </div>

              <div className="bg-card border border-border/30 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between py-2">
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p className="text-sm font-mono font-medium">1.0.0</p>
                </div>
                <div className="border-t border-border/20" />
                <div className="flex items-center justify-between py-2">
                  <p className="text-sm text-muted-foreground">Site web</p>
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
                  <p className="text-sm text-muted-foreground">Propulsé par</p>
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
