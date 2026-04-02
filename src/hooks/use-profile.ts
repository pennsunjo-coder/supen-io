import { useState, useEffect, useCallback } from "react";
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

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      setProfile(data as UserProfile);
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: Partial<Omit<UserProfile, "id" | "user_id" | "created_at">>) => {
      if (!user) return;

      if (profile) {
        const { data, error } = await supabase
          .from("user_profiles")
          .update(updates)
          .eq("user_id", user.id)
          .select()
          .single();
        if (!error && data) setProfile(data as UserProfile);
      } else {
        const { data, error } = await supabase
          .from("user_profiles")
          .insert({ user_id: user.id, ...updates })
          .select()
          .single();
        if (!error && data) setProfile(data as UserProfile);
      }
    },
    [user, profile]
  );

  const onboardingCompleted = profile?.onboarding_completed ?? false;

  return { profile, loading, onboardingCompleted, updateProfile, refetch: fetchProfile };
}
