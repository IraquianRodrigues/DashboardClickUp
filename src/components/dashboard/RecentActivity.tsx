"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatRelativeDate, isDone, isInProgress, getUserInitials } from "@/lib/clickup/helpers";
import type { ClickUpTask } from "@/types/clickup";
import { CheckCircle2, PlayCircle, FileEdit, Clock } from "lucide-react";

interface RecentActivityProps {
  tasks: ClickUpTask[];
}

function getActivityIcon(task: ClickUpTask) {
  if (isDone(task)) return { icon: CheckCircle2, color: "text-[var(--color-brand-green)]", bg: "bg-[var(--color-brand-green)]/10" };
  if (isInProgress(task)) return { icon: PlayCircle, color: "text-[var(--color-brand-blue)]", bg: "bg-[var(--color-brand-blue)]/10" };
  return { icon: FileEdit, color: "text-white/50", bg: "bg-white/5" };
}

function getActivityLabel(task: ClickUpTask) {
  if (isDone(task)) return "concluiu";
  if (isInProgress(task)) return "está trabalhando em";
  return "atualizou";
}

export function RecentActivity({ tasks }: RecentActivityProps) {
  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => parseInt(b.date_updated) - parseInt(a.date_updated))
      .slice(0, 10);
  }, [tasks]);

  if (recentTasks.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest mb-6 text-foreground/80 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white/30" />
          Atividade Recente
        </h3>
        <div className="flex items-center justify-center h-48 text-muted-foreground text-[10px] uppercase tracking-widest">Sem atividade recente</div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-6">
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[var(--color-brand-blue)]/5 blur-[100px] rounded-full pointer-events-none" />

      <h3 className="text-xs font-bold uppercase tracking-widest mb-5 text-foreground/80 flex items-center gap-2 relative z-10">
        <span className="w-2 h-2 rounded-full bg-white/50 shadow-[0_0_8px_rgba(255,255,255,0.3)] animate-pulse" />
        Atividade Recente
      </h3>

      <div className="max-h-[340px] overflow-y-auto space-y-1 pr-1 relative z-10 scrollbar-thin">
        {recentTasks.map((task, i) => {
          const { icon: Icon, color, bg } = getActivityIcon(task);
          const assignee = task.assignees[0];

          return (
            <div
              key={task.id}
              className="flex items-start gap-3 p-3 rounded-xl transition-all duration-300 hover:bg-white/5 group relative"
            >
              {/* Timeline line */}
              {i < recentTasks.length - 1 && (
                <div className="absolute left-[27px] top-[40px] w-[1px] h-[calc(100%-16px)] bg-white/5" />
              )}

              {/* Icon */}
              <div className={cn("p-2 rounded-lg shrink-0 transition-all duration-300 group-hover:scale-110", bg)}>
                <Icon className={cn("w-3.5 h-3.5", color)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs">
                  {assignee?.username && (
                    <span className="font-bold text-white/90">{assignee.username.split(" ")[0]}</span>
                  )}
                  <span className="text-muted-foreground">{getActivityLabel(task)}</span>
                </div>
                <p className="text-sm font-medium truncate mt-0.5 text-white/80 group-hover:text-white transition-colors">
                  {task.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {formatRelativeDate(task.date_updated)}
                  </span>
                  {task.folder?.name && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider truncate max-w-[120px]">
                        {task.folder.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
