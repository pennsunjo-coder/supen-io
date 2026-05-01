import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const IS_DEV = import.meta.env.DEV;

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  platforms: string[];
  source_platform: string;
  niche: string;
  onboarding_completed: boolean;
  created_at: string;
  plan?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan_expires_at?: string;
  // Personalization (see migration 20260402000015_extend_user_profiles.sql)
  content_frequency?: string;
  target_audience?: string;
  content_goals?: string[];
  preferred_tone?: string;
  preferred_length?: string;
  last_topics?: string[];
  avg_score?: number;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileRef = useRef<UserProfile | null>(null);

  // Keep ref up to date
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // 5-second timeout to prevent infinite loading on 522/timeout
    const timeout = setTimeout(() => {
      if (IS_DEV) console.warn("useProfile: timeout after 5s — using defaults");
      setProfile(null);
      setLoading(false);
    }, 5000);

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      clearTimeout(timeout);

      if (error) {
        if (IS_DEV) console.warn("useProfile select(*) failed, retrying:", error.message);
        const { data: retryData, error: retryErr } = await supabase
          .from("user_profiles")
          .select("id, user_id, first_name, platforms, source_platform, niche, onboarding_completed, created_at, plan")
          .eq("user_id", user.id)
          .maybeSingle();
        if (retryErr) {
          if (IS_DEV) console.warn("useProfile retry failed:", retryErr.message);
          setProfile(null);
        } else {
          setProfile((retryData as UserProfile) ?? null);
        }
      } else if (data) {
        setProfile(data as UserProfile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      clearTimeout(timeout);
      if (IS_DEV) console.warn("useProfile fetch error:", err);
      setProfile(null);
    }

    setLoading(false);
  }, [user]);

  // ONLY when user.id changes — NOT when fetchProfile is recreated
  // IMPORTANT: do NOT set loading=false when user is null.
  // ProtectedRoute handles the !user case with authLoading — if we set
  // loading=false here, there's a render where profileLoading=false
  // even though the profile hasn't been fetched → redirect to /onboarding.
  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      fetchProfile();
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateProfile = useCallback(
    async (
      updates: Partial<Omit<UserProfile, "id" | "user_id" | "created_at">>
    ): Promise<{ success: boolean; error: string | null }> => {
      if (!user) return { success: false, error: "Not connected" };

      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" })
          .select()
          .single();

        if (error) {
          return { success: false, error: error.message };
        }
        if (data) {
          setProfile(data as UserProfile);
        }
        return { success: true, error: null };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        return { success: false, error: msg };
      }
    },
    [user]
  );

  const onboardingCompleted = profile?.onboarding_completed ?? false;

  return { profile, loading, onboardingCompleted, updateProfile, refetch: fetchProfile };
}
