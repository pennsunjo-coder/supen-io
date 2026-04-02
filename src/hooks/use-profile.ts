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
        // Table n'existe peut-être pas encore — on traite comme "pas de profil"
        console.warn("useProfile fetch:", error.message);
        setProfile(null);
      } else if (data) {
        setProfile(data as UserProfile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      // Erreur réseau (TypeError: Load failed, etc.)
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
        // Utiliser la ref pour avoir la valeur actuelle (pas de stale closure)
        if (profileRef.current) {
          const { data, error } = await supabase
            .from("user_profiles")
            .update(updates)
            .eq("user_id", user.id)
            .select()
            .single();

          if (error) return { success: false, error: error.message };
          if (data) setProfile(data as UserProfile);
          return { success: true, error: null };
        } else {
          const { data, error } = await supabase
            .from("user_profiles")
            .insert({ user_id: user.id, ...updates })
            .select()
            .single();

          if (error) return { success: false, error: error.message };
          if (data) setProfile(data as UserProfile);
          return { success: true, error: null };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur réseau";
        return { success: false, error: msg };
      }
    },
    [user]
  );

  const onboardingCompleted = profile?.onboarding_completed ?? false;

  return { profile, loading, onboardingCompleted, updateProfile, refetch: fetchProfile };
}
