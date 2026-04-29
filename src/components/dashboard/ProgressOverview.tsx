"use client";

import { cn } from "@/lib/utils";
import type { DashboardMetrics } from "@/types/clickup";
import { NumberTicker } from "@/components/ui/number-ticker";
import { TrendingUp, CheckCircle2, Clock, PlayCircle, AlertTriangle } from "lucide-react";

interface ProgressOverviewProps {
  metrics: DashboardMetrics;
}

export function ProgressOverview({ metrics }: ProgressOverviewProps) {
  const total = metrics.total || 1;
  const completedPct = Math.round((metrics.completed / total) * 100);
  const inProgressPct = Math.round((metrics.inProgress / total) * 100);
  const overduePct = Math.round((metrics.overdue / total) * 100);
  const pendingPct = 100 - completedPct - inProgressPct - overduePct;

  const segments = [
    { label: "Concluídas", value: metrics.completed, pct: completedPct, color: "var(--color-brand-green)", icon: CheckCircle2 },
    { label: "Em Andamento", value: metrics.inProgress, pct: inProgressPct, color: "var(--color-brand-blue)", icon: PlayCircle },
    { label: "Pendentes", value: metrics.pending, pct: Math.max(0, pendingPct), color: "rgba(255,255,255,0.15)", icon: Clock },
    { label: "Atrasadas", value: metrics.overdue, pct: overduePct, color: "var(--color-brand-orange)", icon: AlertTriangle },
  ].filter(s => s.value > 0);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-6">
      <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--color-brand-green)]/3 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[var(--color-brand-green)]/10 border border-[var(--color-brand-green)]/20">
            <TrendingUp className="w-4 h-4 text-[var(--color-brand-green)] drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/80">Progresso Geral</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              {metrics.completed} de {metrics.total} tarefas concluídas
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={cn(
            "text-3xl font-black tracking-tighter",
            completedPct >= 75 ? "text-[var(--color-brand-green)] drop-shadow-[0_0_12px_rgba(0,255,0,0.5)]" :
            completedPct >= 50 ? "text-[var(--color-brand-blue)] drop-shadow-[0_0_12px_rgba(0,102,255,0.5)]" :
            "text-white"
          )}>
            <NumberTicker value={completedPct} className="inline" />%
          </span>
        </div>
      </div>

      {/* Segmented progress bar */}
      <div className="relative z-10">
        <div className="flex h-3 rounded-full overflow-hidden bg-white/5 gap-[2px]">
          {segments.map((seg, i) => (
            <div
              key={seg.label}
              className="transition-all duration-1000 ease-out relative group"
              style={{
                width: `${seg.pct}%`,
                backgroundColor: seg.color,
                minWidth: seg.pct > 0 ? "4px" : "0",
                borderRadius: i === 0 ? "9999px 0 0 9999px" : i === segments.length - 1 ? "0 9999px 9999px 0" : "0",
                boxShadow: seg.color !== "rgba(255,255,255,0.15)" ? `0 0 12px ${seg.color}40` : "none",
              }}
            >
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                <div className="bg-black/90 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap backdrop-blur-md shadow-lg">
                  {seg.label}: {seg.value} ({seg.pct}%)
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          {segments.map((seg) => {
            const Icon = seg.icon;
            return (
              <div key={seg.label} className="flex items-center gap-1.5">
                <Icon className="w-3 h-3" style={{ color: seg.color === "rgba(255,255,255,0.15)" ? "rgba(255,255,255,0.5)" : seg.color }} />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {seg.label}
                </span>
                <span className="text-[10px] font-bold" style={{ color: seg.color === "rgba(255,255,255,0.15)" ? "rgba(255,255,255,0.5)" : seg.color }}>
                  {seg.pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
