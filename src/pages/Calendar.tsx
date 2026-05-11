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
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="max-w-7xl mx-auto p-8 lg:p-12">
            
            {/* ═══ PREMIUM HEADER ═══ */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(20,184,166,0.15)]">
                  <CalendarDays className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-black tracking-tight text-white mb-1">Editorial Schedule</h1>
                  <p className="text-xs font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
                    {posts.length} Content Assets Planned
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* View toggle */}
                <div className="flex gap-1 p-1 rounded-2xl glass border-white/5">
                  <button
                    onClick={() => setView("calendar")}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                      view === "calendar" ? "bg-white text-black shadow-xl" : "text-muted-foreground hover:text-white"
                    )}
                  >
                    <Grid3x3 className="w-3.5 h-3.5" /> Grid
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                      view === "list" ? "bg-white text-black shadow-xl" : "text-muted-foreground hover:text-white"
                    )}
                  >
                    <List className="w-3.5 h-3.5" /> Timeline
                  </button>
                </div>
                <Button 
                  onClick={() => openSchedule()} 
                  className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm gap-2 shadow-2xl shadow-primary/20 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Schedule Post
                </Button>
              </div>
            </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
               <div className="relative">
                 <div className="w-16 h-16 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />
                 <CalendarDays className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
               </div>
               <p className="text-xs font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Syncing Calendar...</p>
            </div>
          ) : view === "calendar" ? (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr,380px] gap-12">
              {/* ═══ CALENDAR GRID ═══ */}
              <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl">
                {/* Month Navigation */}
                <div className="flex items-center justify-between px-10 py-8 border-b border-white/5 bg-white/[0.02]">
                  <button onClick={() => navigateMonth(-1)} className="w-12 h-12 rounded-2xl glass border-white/5 flex items-center justify-center text-muted-foreground hover:text-white transition-all">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    {MONTHS[currentDate.getMonth()]} <span className="text-primary opacity-60 ml-1">{currentDate.getFullYear()}</span>
                  </h2>
                  <button onClick={() => navigateMonth(1)} className="w-12 h-12 rounded-2xl glass border-white/5 flex items-center justify-center text-muted-foreground hover:text-white transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.01]">
                  {DAYS.map((d) => (
                    <div key={d} className="px-4 py-4 text-center text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days Matrix */}
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
                          "relative h-32 p-4 border-b border-r border-white/5 text-left transition-all duration-500",
                          !isCurrentMonth && "opacity-[0.05]",
                          isSelected ? "bg-primary/10" : "hover:bg-white/[0.03]",
                        )}
                      >
                        <div className={cn(
                          "text-xs font-black w-7 h-7 rounded-full flex items-center justify-center transition-all mb-2",
                          isToday && "bg-primary text-white shadow-[0_0_15px_rgba(20,184,166,0.5)]",
                          !isToday && isSelected && "bg-white/10 text-white",
                          !isToday && !isSelected && "text-white/30 hover:text-white",
                        )}>
                          {day.getDate()}
                        </div>
                        
                        {/* Compact Post Stack */}
                        <div className="flex flex-col gap-1.5 overflow-hidden">
                          {dayPosts.slice(0, 2).map((p, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "h-1.5 rounded-full shadow-sm",
                                PLATFORM_COLORS[p.platform] || "bg-muted-foreground"
                              )}
                            />
                          ))}
                          {dayPosts.length > 2 && (
                            <span className="text-[9px] font-black text-primary/40 uppercase tracking-tighter">+{dayPosts.length - 2} More</span>
                          )}
                        </div>

                        {isSelected && (
                           <motion.div layoutId="day-ring" className="absolute inset-0 border-2 border-primary/40 z-10 pointer-events-none" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ═══ DAY DETAILS SIDEBAR ═══ */}
              <aside className="space-y-8">
                <div className="glass-card rounded-[2.5rem] p-10 border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <CalendarDays className="w-32 h-32 rotate-12" />
                  </div>
                  
                  <h3 className="text-2xl font-black text-white tracking-tight mb-2">
                    {selectedDate.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "long" })}
                  </h3>
                  <div className="flex items-center gap-2 mb-8">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                      {selectedDayPosts.length} Assets Scheduled
                    </p>
                  </div>

                  {selectedDayPosts.length === 0 ? (
                    <div className="text-center py-12 glass rounded-3xl border-dashed border-white/5">
                      <Sparkles className="w-12 h-12 text-primary/20 mx-auto mb-4 animate-pulse" />
                      <p className="text-xs font-bold text-muted-foreground/40 mb-6 px-8">No content assets planned for this day.</p>
                      <Button onClick={() => openSchedule(selectedDate)} className="h-12 px-6 rounded-2xl glass border-white/5 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10">
                        <Plus className="w-4 h-4" /> Plan Now
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedDayPosts.map((post) => (
                        <PostCard key={post.id} post={post} onPublished={markPublished} onCancel={cancelPost} onDelete={deletePost} />
                      ))}
                      <button 
                        onClick={() => openSchedule(selectedDate)}
                        className="w-full h-14 rounded-2xl border border-dashed border-white/10 flex items-center justify-center gap-3 text-muted-foreground/40 hover:text-primary hover:border-primary/20 transition-all text-[10px] font-black uppercase tracking-widest mt-4"
                      >
                        <Plus className="w-4 h-4" /> Add Publication
                      </button>
                    </div>
                  )}
                </div>

                <div className="glass-card rounded-[2.5rem] p-8 border-white/5 bg-primary/[0.02]">
                   <h4 className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mb-4">Strategic Insight</h4>
                   <p className="text-xs leading-relaxed text-white/60 font-medium italic">
                     "Consistency is the engine of authority. Your current pace suggests a 15% increase in engagement over the next 30 days."
                   </p>
                </div>
              </aside>
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
          {/* ═══ SCHEDULE MODAL ═══ */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass max-w-xl w-full p-12 rounded-[3rem] border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-8">
                 <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full glass border-white/5 flex items-center justify-center text-muted-foreground hover:text-white transition-all">
                   <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">Schedule Publication</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-3 block">Publication Content</label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="bg-white/5 border-white/10 rounded-2xl text-white text-base min-h-[120px] p-6 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-white/10"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-3 block">Channel</label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 appearance-none cursor-pointer"
                    >
                      {PLATFORMS.map((p) => (<option key={p} value={p} className="bg-zinc-900">{p}</option>))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-3 block">Date</label>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-4 text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-3 block">Time</label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-4 text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-3 block">Internal Notes</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Strategic context..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-white/10"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-12">
                <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1 h-14 rounded-2xl glass border-white/5 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10">
                  Cancel
                </Button>
                <Button onClick={handleSchedule} disabled={saving || !content.trim()} className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-2xl shadow-primary/20">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Finalize Plan
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

/* ─── PREMIUM POST CARD ─── */

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
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "rounded-[1.5rem] border transition-all duration-500",
        post.status === "published" 
          ? "glass border-emerald-500/10 opacity-60" 
          : "glass border-white/5 p-5"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("w-2 h-2 rounded-full mt-2.5 shrink-0 shadow-[0_0_8px_currentColor]", dotColor.replace('bg-', 'text-'))} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={cn("text-[10px] font-black uppercase tracking-widest", textColor)}>{post.platform}</span>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-white/20 uppercase">
              <Clock className="w-3 h-3" />
              {expanded ? `${dateStr} · ${timeStr}` : timeStr}
            </div>
            {post.status === "published" && (
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 ml-auto">Live</span>
            )}
          </div>
          <p className={cn("text-sm text-white/90 font-medium leading-relaxed", !expanded && "line-clamp-2")}>
            {post.content}
          </p>
          {expanded && post.notes && (
            <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/5 text-[10px] text-white/40 italic">
              {post.notes}
            </div>
          )}
        </div>
      </div>
      
      {post.status === "scheduled" && (
        <div className="flex items-center gap-2 mt-5 pt-5 border-t border-white/5">
          {isPast && (
            <button onClick={() => onPublished(post.id)} className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10">
              <Check className="w-3 h-3" /> Published
            </button>
          )}
          <button onClick={() => onCancel(post.id)} className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
            Cancel
          </button>
          <button onClick={() => onDelete(post.id)} className="text-[10px] font-black uppercase tracking-widest text-rose-500/40 hover:text-rose-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-500/10 ml-auto">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default Calendar;
