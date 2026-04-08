import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface ScheduledPost {
  id: string;
  content: string;
  platform: string;
  scheduled_at: string;
  status: "scheduled" | "published" | "cancelled";
  notes?: string;
  content_id?: string;
}

export function useCalendar() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", user.id)
        .gte("scheduled_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("scheduled_at", { ascending: true });
      if (error) {
        console.error("[useCalendar] fetch error:", error.message);
        setPosts([]);
      } else {
        setPosts((data as ScheduledPost[]) || []);
      }
    } catch (err) {
      console.error("[useCalendar] exception:", err);
      setPosts([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const schedulePost = useCallback(
    async (post: Omit<ScheduledPost, "id" | "status">): Promise<{ error: string | null }> => {
      if (!user) return { error: "Non connecte" };
      const { error } = await supabase.from("scheduled_posts").insert({
        ...post,
        user_id: user.id,
        status: "scheduled",
      });
      if (!error) await fetchPosts();
      return { error: error?.message || null };
    },
    [user, fetchPosts],
  );

  const markPublished = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("scheduled_posts")
        .update({ status: "published" })
        .eq("id", id);
      if (!error) await fetchPosts();
    },
    [fetchPosts],
  );

  const cancelPost = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("scheduled_posts")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (!error) await fetchPosts();
    },
    [fetchPosts],
  );

  const deletePost = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", id);
      if (!error) await fetchPosts();
    },
    [fetchPosts],
  );

  return { posts, loading, schedulePost, markPublished, cancelPost, deletePost, refetch: fetchPosts };
}
