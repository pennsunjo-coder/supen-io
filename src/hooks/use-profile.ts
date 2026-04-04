import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  platforms: string[];
  source_platform: string;
  niche: string;
  onboarding_completed: boolean;
  created_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);
  const profileRef = useRef<UserProfile | null>(null);

  // Garder la ref à jour
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.warn("useProfile fetch:", error.message);
        setProfile(null);
        setFetched(true); // DB responded — profile doesn't exist or table error
      } else if (data) {
        setProfile(data as UserProfile);
        setFetched(true);
      } else {
        setProfile(null);
        setFetched(true); // DB responded — no profile row
      }
    } catch (err) {
      // Erreur réseau — don't set fetched so ProtectedRoute won't redirect
      console.warn("useProfile fetch error:", err);
      setProfile(null);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (
      updates: Partial<Omit<UserProfile, "id" | "user_id" | "created_at">>
    ): Promise<{ success: boolean; error: string | null }> => {
      if (!user) return { success: false, error: "Non connecté" };

      try {
        // Upsert — fonctionne que le profil existe ou non
        const { data, error } = await supabase
          .from("user_profiles")
          .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" })
          .select()
          .single();

        if (error) {
          console.warn("useProfile upsert error:", error.message);
          return { success: false, error: error.message };
        }
        if (data) {
          console.log("🟢 useProfile: profil sauvegardé", data.onboarding_completed);
          setProfile(data as UserProfile);
          setFetched(true);
        }
        return { success: true, error: null };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur réseau";
        return { success: false, error: msg };
      }
    },
    [user]
  );

  const onboardingCompleted = profile?.onboarding_completed ?? false;

  return { profile, loading, fetched, onboardingCompleted, updateProfile, refetch: fetchProfile };
}
