import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-profile";

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipOnboardingCheck?: boolean;
}

export default function ProtectedRoute({ children, skipOnboardingCheck = false }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { onboardingCompleted, loading: profileLoading } = useProfile();
  const location = useLocation();

  // Pendant le chargement → spinner
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Pas connecté → login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (skipOnboardingCheck) {
    return <>{children}</>;
  }

  // Onboarding pas fait → onboarding (sauf si déjà dessus)
  if (!onboardingCompleted && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
