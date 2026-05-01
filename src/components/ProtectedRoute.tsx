import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-profile";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  skipOnboardingCheck?: boolean;
}

export default function ProtectedRoute({ children, skipOnboardingCheck = false }: Props) {
  const { user, loading: authLoading } = useAuth();
  const { onboardingCompleted, loading: profileLoading } = useProfile();
  const location = useLocation();

  // 1. Auth en cours → spinner
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Pas connecté → login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Profil en cours de chargement → spinner
  // CRITIQUE : ne jamais rediriger ici, attendre la réponse Supabase
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // 4. Skip onboarding check (for the /onboarding route itself)
  if (skipOnboardingCheck) {
    return <>{children}</>;
  }

  // 5. Onboarding not completed → /onboarding
  // ONLY when profileLoading = false (we have the Supabase response)
  if (!onboardingCompleted && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // 6. All good → render the page
  return <>{children}</>;
}
