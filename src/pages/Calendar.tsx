import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, Check, X,
  Trash2, List, Grid3x3, Loader2, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useCalendar, type ScheduledPost } from "@/hooks/use-calendar";
import { useProfile } from "@/hooks/use-profile";

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "bg-pink-500",
  TikTok: "bg-zinc-900",
  LinkedIn: "bg-blue-600",
  Facebook: "bg-blue-500",
  "X (Twitter)": "bg-zinc-800",
  YouTube: "bg-red-500",
};

const PLATFORM_TEXT_COLORS: Record<string, string> = {
  Instagram: "text-pink-400",
  TikTok: "text-zinc-300",
  LinkedIn: "text-blue-400",
  Facebook: "text-blue-400",
  "X (Twitter)": "text-zinc-300",
  YouTube: "text-red-400",
};

const PLATFORMS = ["Instagram", "TikTok", "LinkedIn", "Facebook", "X (Twitter)", "YouTube"];
const DAYS_FR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS_FR = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // 0 = Sunday → we want Monday=0
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const days: Date[] = [];

  // Previous month padding
  for (let i = startWeekday; i > 0; i--) {
    days.push(new Date(year, month, 1 - i));
  }
  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  // Next month padding to fill 6 rows (42 cells)
  while (days.length < 42) {
    const last = days[days.length - 1];
    days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const Calendar = () => {
  const { profile } = useProfile();
  const { posts, loading, schedulePost, markPublished, cancelPost, deletePost } = useCalendar();

  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showModal, setShowModal] = useState(false);

  // Modal state
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState(profile?.platforms?.[0] || "Instagram");
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().slice(0, 10));
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const monthDays = useMemo(
    () => getMonthDays(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate],
  );

  // Posts grouped by date string YYYY-MM-DD
  const postsByDate = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();
    for (const post of posts) {
      if (post.status === "cancelled") continue;
      const key = post.scheduled_at.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(post);
    }
    return map;
  }, [posts]);

  function postsForDay(day: Date): ScheduledPost[] {
    const key = day.toISOString().slice(0, 10);
    return postsByDate.get(key) || [];
  }

  const selectedDayPosts = postsForDay(selectedDate);

  function openSchedule(date?: Date) {
    if (date) {
      setSelectedDate(date);
      setScheduleDate(date.toISOString().slice(0, 10));
    }
    setContent("");
    setNotes("");
    setShowModal(true);
  }

  async function handleSchedule() {
    if (!content.trim()) {
      toast.error("Content cannot be empty");
      return;
    }
    setSaving(true);
    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
    const { error } = await schedulePost({
      content: content.trim(),
      platform,
      scheduled_at: scheduledAt,
      notes: notes.trim() || undefined,
    });
    setSaving(false);
    if (error) {
      toast.error(`Error: ${error}`);
    } else {
      toast.success("Post scheduled!");
      setShowModal(false);
    }
  }

  function navigateMonth(delta: number) {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  }

  const today = new Date();
  const upcomingPosts = useMemo(
    () => posts.filter((p) => p.status === "scheduled" && new Date(p.scheduled_at) >= today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts],
  );

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Publication Calendar</h1>
                <p className="text-xs text-muted-foreground">
                  {posts.length} post{posts.length > 1 ? "s" : ""} scheduled
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex gap-1 p-1 rounded-lg bg-accent/30 border border-border/30">
                <button
                  onClick={() => setView("calendar")}
                  className={cn("px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5", view === "calendar" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
                >
                  <Grid3x3 className="w-3 h-3" /> Calendar
                </button>
                <button
                  onClick={() => setView("list")}
                  className={cn("px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5", view === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
                >
                  <List className="w-3 h-3" /> List
                </button>
              </div>
              <Button onClick={() => openSchedule()} size="sm" className="h-9 gap-1.5 text-xs font-semibold">
                <Plus className="w-3.5 h-3.5" /> Schedule
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : view === "calendar" ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6">
              {/* Calendar grid */}
              <div className="rounded-xl border border-border/30 bg-card overflow-hidden">
                {/* Month nav */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
                  <button onClick={() => navigateMonth(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent/50 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-sm font-bold">
                    {MONTHS_FR[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <button onClick={() => navigateMonth(1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent/50 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-border/20">
                  {DAYS_FR.map((d) => (
                    <div key={d} className="px-2 py-2 text-center text-[10px] font-semibold text-muted-foreground/60 uppercase">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7">
                  {monthDays.map((day, i) => {
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isToday = isSameDay(day, today);
                    const isSelected = isSameDay(day, selectedDate);
                    const dayPosts = postsForDay(day);

                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "relative h-20 p-1.5 border-b border-r border-border/15 text-left transition-all hover:bg-accent/30",
                          !isCurrentMonth && "opacity-30",
                          isSelected && "bg-primary/10 ring-1 ring-primary/30",
                        )}
                      >
                        <div className={cn(
                          "text-[11px] font-semibold w-5 h-5 rounded-full flex items-center justify-center",
                          isToday && "bg-primary text-primary-foreground",
                          !isToday && isSelected && "text-primary",
                          !isToday && !isSelected && "text-foreground/70",
                        )}>
                          {day.getDate()}
                        </div>
                        {/* Post dots */}
                        {dayPosts.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-1">
                            {dayPosts.slice(0, 4).map((p, idx) => (
                              <div
                                key={idx}
                                className={cn("w-1.5 h-1.5 rounded-full", PLATFORM_COLORS[p.platform] || "bg-muted-foreground")}
                                title={p.platform}
                              />
                            ))}
                            {dayPosts.length > 4 && (
                              <span className="text-[8px] text-muted-foreground">+{dayPosts.length - 4}</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar: selected day details */}
              <div className="rounded-xl border border-border/30 bg-card p-4 h-fit">
                <h3 className="text-xs font-bold mb-1">
                  {selectedDate.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
                </h3>
                <p className="text-[10px] text-muted-foreground mb-4">
                  {selectedDayPosts.length} post{selectedDayPosts.length > 1 ? "s" : ""} scheduled
                </p>

                {selectedDayPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarDays className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-[11px] text-muted-foreground/60 mb-3">No posts scheduled for this day</p>
                    <Button onClick={() => openSchedule(selectedDate)} size="sm" variant="outline" className="h-8 text-[11px] gap-1">
                      <Plus className="w-3 h-3" /> Schedule
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDayPosts.map((post) => (
                      <PostCard key={post.id} post={post} onPublished={markPublished} onCancel={cancelPost} onDelete={deletePost} />
                    ))}
                    <Button onClick={() => openSchedule(selectedDate)} size="sm" variant="outline" className="w-full h-8 text-[11px] gap-1 mt-2">
                      <Plus className="w-3 h-3" /> Add a post
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* List view */
            <div className="space-y-2">
              {upcomingPosts.length === 0 ? (
                <div className="rounded-xl border border-border/30 bg-card p-8 text-center">
                  <CalendarDays className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground mb-1">No upcoming posts</p>
                  <p className="text-xs text-muted-foreground/60 mb-4">Schedule your first post to get started.</p>
                  <Button onClick={() => openSchedule()} size="sm" className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Schedule a post
                  </Button>
                </div>
              ) : (
                upcomingPosts.map((post) => (
                  <div key={post.id} className="rounded-xl border border-border/30 bg-card p-4">
                    <PostCard post={post} onPublished={markPublished} onCancel={cancelPost} onDelete={deletePost} expanded />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/40 rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold">Schedule a Post</h3>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Content</label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Your post content..."
                    className="bg-accent/30 border-border/30 text-sm min-h-[100px] resize-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-accent/30 border border-border/30 rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    {PLATFORMS.map((p) => (<option key={p} value={p}>{p}</option>))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Date</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full bg-accent/30 border border-border/30 rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Time</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full bg-accent/30 border border-border/30 rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Notes (optional)</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g., Test the hook, add hashtags..."
                    className="w-full bg-accent/30 border border-border/30 rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 h-10 text-xs">
                  Cancel
                </Button>
                <Button onClick={handleSchedule} disabled={saving || !content.trim()} className="flex-1 h-10 gap-1.5 text-xs font-semibold">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Schedule
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

/* ─── PostCard ─── */

function PostCard({
  post, onPublished, onCancel, onDelete, expanded = false,
}: {
  post: ScheduledPost;
  onPublished: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  expanded?: boolean;
}) {
  const dotColor = PLATFORM_COLORS[post.platform] || "bg-muted-foreground";
  const textColor = PLATFORM_TEXT_COLORS[post.platform] || "text-muted-foreground";
  const time = new Date(post.scheduled_at);
  const isPast = time < new Date();
  const timeStr = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className={cn("rounded-lg border border-border/20 bg-accent/10 p-2.5", post.status === "published" && "opacity-60")}>
      <div className="flex items-start gap-2 mb-1.5">
        <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", dotColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={cn("text-[10px] font-semibold", textColor)}>{post.platform}</span>
            <span className="text-[9px] text-muted-foreground/50 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {expanded ? `${dateStr} · ${timeStr}` : timeStr}
            </span>
            {post.status === "published" && (
              <span className="text-[8px] text-emerald-400/80 ml-auto">Published</span>
            )}
          </div>
          <p className={cn("text-[11px] text-foreground/85 leading-snug", !expanded && "line-clamp-2")}>{post.content}</p>
          {expanded && post.notes && (
            <p className="text-[10px] text-muted-foreground/60 mt-1 italic">{post.notes}</p>
          )}
        </div>
      </div>
      {post.status === "scheduled" && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/15">
          {isPast && (
            <button onClick={() => onPublished(post.id)} className="text-[9px] text-emerald-400 hover:text-emerald-300 px-1.5 py-0.5 rounded hover:bg-emerald-500/10 transition-all flex items-center gap-1">
              <Check className="w-2.5 h-2.5" /> Mark as published
            </button>
          )}
          <button onClick={() => onCancel(post.id)} className="text-[9px] text-muted-foreground/60 hover:text-foreground px-1.5 py-0.5 rounded hover:bg-accent/50 transition-all">
            Cancel
          </button>
          <button onClick={() => onDelete(post.id)} className="text-[9px] text-muted-foreground/60 hover:text-red-400 px-1.5 py-0.5 rounded hover:bg-red-500/10 transition-all ml-auto">
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default Calendar;
