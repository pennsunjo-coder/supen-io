import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-profile";

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipOnboardingCheck?: boolean;
}

export default function ProtectedRoute({ children, skipOnboardingCheck = false }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { onboardingCompleted, loading: profileLoading, fetched } = useProfile();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);

  // Timeout de 5 secondes : si le profil ne charge pas, laisser l'accès
  useEffect(() => {
    if (profileLoading) {
      const timer = setTimeout(() => setTimedOut(true), 5000);
      return () => clearTimeout(timer);
    }
    setTimedOut(false);
  }, [profileLoading]);

  // Attendre l'auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Attendre le profil (sauf timeout)
  if (profileLoading && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (skipOnboardingCheck) {
    return <>{children}</>;
  }

  // Redirige vers onboarding SEULEMENT si le profil a été récupéré depuis Supabase
  // et que onboarding_completed est explicitement false.
  // Si fetch a échoué (réseau) ou pas encore terminé → on laisse passer (pas de boucle)
  if (!timedOut && fetched && !onboardingCompleted && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
