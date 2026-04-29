"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ClickUpTask } from "@/types/clickup";
import { isDone, isInProgress, isOverdue, isBlocked, isPending } from "@/lib/clickup/helpers";
import { CheckCircle2, PlayCircle, Clock, AlertTriangle, ShieldAlert, ListTodo } from "lucide-react";

interface TaskQuickStatsProps {
  tasks: ClickUpTask[];
  filteredCount: number;
}

export function TaskQuickStats({ tasks, filteredCount }: TaskQuickStatsProps) {
  const stats = useMemo(() => {
    let completed = 0, inProgress = 0, pending = 0, overdue = 0, blocked = 0;
    for (const task of tasks) {
      if (isDone(task)) completed++;
      else if (isBlocked(task)) blocked++;
      else if (isInProgress(task)) inProgress++;
      else pending++;
      if (isOverdue(task)) overdue++;
    }
    return { completed, inProgress, pending, overdue, blocked, total: tasks.length };
  }, [tasks]);

  const items = [
    { label: "Total", value: stats.total, icon: ListTodo, color: "text-[var(--color-brand-blue)]", bg: "bg-[var(--color-brand-blue)]/10", border: "border-[var(--color-brand-blue)]/20" },
    { label: "Concluídas", value: stats.completed, icon: CheckCircle2, color: "text-[var(--color-brand-green)]", bg: "bg-[var(--color-brand-green)]/10", border: "border-[var(--color-brand-green)]/20" },
    { label: "Em Andamento", value: stats.inProgress, icon: PlayCircle, color: "text-[var(--color-brand-blue)]", bg: "bg-[var(--color-brand-blue)]/10", border: "border-[var(--color-brand-blue)]/20" },
    { label: "Pendentes", value: stats.pending, icon: Clock, color: "text-white/50", bg: "bg-white/5", border: "border-white/10" },
    { label: "Atrasadas", value: stats.overdue, icon: AlertTriangle, color: "text-[var(--color-brand-orange)]", bg: "bg-[var(--color-brand-orange)]/10", border: "border-[var(--color-brand-orange)]/20" },
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

      {filteredCount !== stats.total && (
        <div className="ml-auto text-[10px] text-muted-foreground uppercase tracking-widest">
          Mostrando {filteredCount} de {stats.total}
        </div>
      )}
    </div>
  );
}
