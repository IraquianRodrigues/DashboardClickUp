"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, AlertTriangle, CalendarClock } from "lucide-react";
import type { ClickUpTask } from "@/types/clickup";
import { formatDueDate, getPriorityLevel, getPriorityLabel, getPriorityTailwind, extractClientName, isOverdue, getUserInitials } from "@/lib/clickup/helpers";

interface TaskCardViewProps {
  tasks: ClickUpTask[];
  onTaskClick: (taskId: string) => void;
}

export function TaskCardView({ tasks, onTaskClick }: TaskCardViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-[10px] uppercase tracking-widest">
        Nenhuma tarefa encontrada
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {tasks.map((task) => {
        const overdue = isOverdue(task);
        const priority = getPriorityLevel(task.priority);
        const client = extractClientName(task);

        return (
          <div
            key={task.id}
            onClick={() => onTaskClick(task.id)}
            className={cn(
              "group cursor-pointer p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-lg",
              overdue
                ? "border-[var(--color-brand-orange)]/30 bg-[var(--color-brand-orange)]/5 hover:border-[var(--color-brand-orange)]/50"
                : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/5"
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <h4 className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-white transition-colors">
                {task.name}
              </h4>
              {overdue && <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--color-brand-orange)] drop-shadow-[0_0_6px_rgba(255,102,0,0.6)]" />}
            </div>

            {/* Status + Priority */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge
                variant="outline"
                className="rounded-lg border text-[10px]"
                style={{
                  borderColor: task.status.color + "50",
                  backgroundColor: task.status.color + "15",
                  color: task.status.color,
                }}
              >
                {task.status.status}
              </Badge>
              {task.priority && (
                <Badge variant="outline" className={cn("rounded-lg text-[10px]", getPriorityTailwind(priority))}>
                  {getPriorityLabel(priority)}
                </Badge>
              )}
            </div>

            {/* Meta row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Assignees */}
                <div className="flex -space-x-1.5">
                  {task.assignees.slice(0, 2).map((a) => (
                    <Avatar key={a.id} className="w-6 h-6 border-2 border-background">
                      <AvatarFallback className="text-[9px] font-medium" style={{ backgroundColor: a.color || "#6b7280", color: "#fff" }}>
                        {getUserInitials(a)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {task.assignees.length > 2 && (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium border-2 border-background">
                      +{task.assignees.length - 2}
                    </div>
                  )}
                </div>

                {/* Client */}
                <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{client}</span>
              </div>

              {/* Due date */}
              {task.due_date && (
                <div className={cn(
                  "flex items-center gap-1 text-[10px] font-semibold",
                  overdue ? "text-[var(--color-brand-orange)]" : "text-muted-foreground"
                )}>
                  <CalendarClock className="w-3 h-3" />
                  {formatDueDate(task.due_date)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
