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

      console.log("🔵 fetchProfile result:", {
        onboarding_completed: data?.onboarding_completed,
        user_id: data?.user_id,
        error: error?.message,
      });

      if (error) {
        console.warn("useProfile fetch:", error.message);
        setProfile(null);
      } else if (data) {
        setProfile(data as UserProfile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.warn("useProfile fetch error:", err);
      setProfile(null);
    }

    setLoading(false);
  }, [user]);

  // UNIQUEMENT quand user.id change — PAS quand fetchProfile est recréé
  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateProfile = useCallback(
    async (
      updates: Partial<Omit<UserProfile, "id" | "user_id" | "created_at">>
    ): Promise<{ success: boolean; error: string | null }> => {
      if (!user) return { success: false, error: "Non connecté" };

      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" })
          .select()
          .single();

        console.log("🟢 updateProfile result:", {
          onboarding_completed: data?.onboarding_completed,
          success: !error,
        });

        if (error) {
          console.warn("useProfile upsert error:", error.message);
          return { success: false, error: error.message };
        }
        if (data) {
          setProfile(data as UserProfile);
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

  return { profile, loading, onboardingCompleted, updateProfile, refetch: fetchProfile };
}
