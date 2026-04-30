"use client";

import { cn } from "@/lib/utils";
import { Users, CheckCircle2, AlertTriangle, TrendingUp, Percent } from "lucide-react";

interface TeamQuickStatsProps {
  totalMembers: number;
  totalTasks: number;
  totalCompleted: number;
  totalOverdue: number;
  avgCompletion: number;
}

export function TeamQuickStats({ totalMembers, totalTasks, totalCompleted, totalOverdue, avgCompletion }: TeamQuickStatsProps) {
  const items = [
    { label: "Membros", value: totalMembers, icon: Users, color: "text-[var(--color-brand-blue)]", bg: "bg-[var(--color-brand-blue)]/10", border: "border-[var(--color-brand-blue)]/20" },
    { label: "Tarefas", value: totalTasks, icon: TrendingUp, color: "text-white/70", bg: "bg-white/5", border: "border-white/10" },
    { label: "Concluidas", value: totalCompleted, icon: CheckCircle2, color: "text-[var(--color-brand-green)]", bg: "bg-[var(--color-brand-green)]/10", border: "border-[var(--color-brand-green)]/20" },
    { label: "Atrasadas", value: totalOverdue, icon: AlertTriangle, color: "text-[var(--color-brand-orange)]", bg: "bg-[var(--color-brand-orange)]/10", border: "border-[var(--color-brand-orange)]/20" },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 hover:scale-105",
              item.bg, item.border
            )}
          >
            <Icon className={cn("w-3.5 h-3.5", item.color)} />
            <span className={cn("text-xs font-bold", item.color)}>{item.value}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider hidden sm:inline">{item.label}</span>
          </div>
        );
      })}

      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200",
        "bg-[var(--color-brand-green)]/10 border-[var(--color-brand-green)]/20"
      )}>
        <Percent className="w-3.5 h-3.5 text-[var(--color-brand-green)]" />
        <span className="text-xs font-bold text-[var(--color-brand-green)]">{avgCompletion}%</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider hidden sm:inline">Media conclusao</span>
      </div>
    </div>
  );
}
