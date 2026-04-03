import { cn } from "@/lib/utils";
import type { ActivityData } from "@/hooks/use-activity";

function heatColor(count: number): string {
  if (count === 0) return "bg-accent/20";
  if (count === 1) return "bg-primary/30";
  if (count <= 3) return "bg-primary/60";
  return "bg-primary";
}

export function ActivityWidget({ data }: { data: ActivityData; daysLabels?: string[] }) {
  if (data.loading || data.total === 0) return null;

  return (
    <div className="px-5 py-2.5 border-b border-border/10">
      {/* Stats line */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 mb-2">
        <span>Semaine : <span className="text-foreground/80 font-medium">{data.thisWeek}</span></span>
        <span className="text-border/30">·</span>
        <span>Mois : <span className="text-foreground/80 font-medium">{data.thisMonth}</span></span>
        <span className="text-border/30">·</span>
        <span>Total : <span className="text-foreground/80 font-medium">{data.total}</span></span>
        {data.streak > 1 && (
          <>
            <span className="text-border/30">·</span>
            <span className="text-orange-400/80">🔥 {data.streak}j</span>
          </>
        )}
      </div>

      {/* Heatmap 28 days */}
      <div className="flex gap-[2px]">
        {data.heatmap.map((day) => (
          <div
            key={day.date}
            className={cn("w-[10px] h-[10px] rounded-[2px]", heatColor(day.count))}
            title={`${day.count} contenu${day.count > 1 ? "s" : ""} — ${day.label}`}
          />
        ))}
      </div>
    </div>
  );
}
