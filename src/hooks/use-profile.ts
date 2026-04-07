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
  plan?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan_expires_at?: string;
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

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
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
