"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ClickUpTask } from "@/types/clickup";
import { isDone, isOverdue, isInProgress } from "@/lib/clickup/helpers";
import { FolderKanban } from "lucide-react";

interface SpaceOverviewProps {
  tasks: ClickUpTask[];
}

interface SpaceStats {
  name: string;
  responsible: string;
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionPct: number;
}

export function SpaceOverview({ tasks }: SpaceOverviewProps) {
  const spaceStats = useMemo(() => {
    const map = new Map<string, SpaceStats>();

    for (const task of tasks) {
      const spaceId = task.space?.id;
      const spaceName = (task.space as any)?.name || "Sem espaço";
      if (!spaceId) continue;

      if (!map.has(spaceId)) {
        const responsible = spaceName.replace("TP -", "").replace("TP-", "").replace("TP ", "").trim();
        map.set(spaceId, {
          name: spaceName,
          responsible,
          total: 0,
          completed: 0,
          inProgress: 0,
          overdue: 0,
          completionPct: 0,
        });
      }

      const stats = map.get(spaceId)!;
      stats.total++;
      if (isDone(task)) stats.completed++;
      if (isInProgress(task)) stats.inProgress++;
      if (isOverdue(task)) stats.overdue++;
    }

    for (const stats of map.values()) {
      stats.completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    }

    return Array.from(map.values())
      .filter(s => !s.name.toLowerCase().includes("inativos") && !s.name.toLowerCase().includes("todas as tarefas"))
      .sort((a, b) => b.total - a.total);
  }, [tasks]);

  if (spaceStats.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-6">
      <div className="absolute top-0 left-1/2 w-96 h-64 bg-[var(--color-brand-blue)]/3 blur-[120px] rounded-full pointer-events-none -translate-x-1/2" />

      <h3 className="text-xs font-bold uppercase tracking-widest mb-5 text-foreground/80 flex items-center gap-2 relative z-10">
        <span className="w-2 h-2 rounded-full bg-[var(--color-brand-blue)] shadow-[0_0_8px_var(--color-brand-blue)]" />
        Performance por Responsável
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 relative z-10">
        {spaceStats.map((space) => (
          <div
            key={space.name}
            className={cn(
              "group p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02]",
              space.overdue > 0
                ? "border-[var(--color-brand-orange)]/20 bg-[var(--color-brand-orange)]/5 hover:border-[var(--color-brand-orange)]/40 hover:shadow-[0_0_20px_rgba(255,102,0,0.1)]"
                : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/5"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-blue)]/10 border border-[var(--color-brand-blue)]/20 flex items-center justify-center">
                  <span className="text-xs font-black text-[var(--color-brand-blue)] drop-shadow-[0_0_6px_rgba(0,102,255,0.6)]">
                    {space.responsible[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold truncate max-w-[100px]">{space.responsible}</p>
                  <p className="text-[10px] text-muted-foreground">{space.total} tarefas</p>
                </div>
              </div>
              <span className={cn(
                "text-lg font-black",
                space.completionPct >= 75 ? "text-[var(--color-brand-green)] drop-shadow-[0_0_8px_rgba(0,255,0,0.4)]" :
                space.completionPct >= 50 ? "text-[var(--color-brand-blue)]" :
                "text-white/60"
              )}>
                {space.completionPct}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${space.completionPct}%`,
                  backgroundColor: space.completionPct >= 75 ? "var(--color-brand-green)" : space.completionPct >= 50 ? "var(--color-brand-blue)" : "var(--color-brand-orange)",
                  boxShadow: `0 0 8px ${space.completionPct >= 75 ? "rgba(0,255,0,0.4)" : space.completionPct >= 50 ? "rgba(0,102,255,0.4)" : "rgba(255,102,0,0.4)"}`,
                }}
              />
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-[var(--color-brand-green)]">✓ {space.completed}</span>
              <span className="text-[var(--color-brand-blue)]">▶ {space.inProgress}</span>
              {space.overdue > 0 && (
                <span className="text-[var(--color-brand-orange)] font-bold">⚠ {space.overdue}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
