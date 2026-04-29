"use client";

import { AnimatedList } from "@/components/ui/animated-list";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle, CalendarClock, User2 } from "lucide-react";
import { formatDueDate, isOverdue, getPriorityLevel, getPriorityColor } from "@/lib/clickup/helpers";
import type { ClickUpTask } from "@/types/clickup";
import { isToday } from "date-fns";

interface UpcomingDeadlinesProps {
  tasks: ClickUpTask[];
}

function DeadlineItem({ task }: { task: ClickUpTask }) {
  const overdue = isOverdue(task);
  const dueDate = task.due_date ? new Date(parseInt(task.due_date)) : null;
  const dueToday = dueDate ? isToday(dueDate) : false;
  const priority = getPriorityLevel(task.priority);
  const priorityColor = getPriorityColor(priority);

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 hover:scale-[1.02]",
      overdue ? "bg-[var(--color-brand-orange)]/10 border-[var(--color-brand-orange)]/30 hover:shadow-[0_0_15px_rgba(255,102,0,0.2)]" : 
      dueToday ? "bg-[var(--color-brand-green)]/10 border-[var(--color-brand-green)]/30 hover:shadow-[0_0_15px_rgba(0,255,0,0.2)]" : 
      "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
    )}>
      <div className={cn("p-2 rounded-lg", overdue ? "bg-[var(--color-brand-orange)]/20" : dueToday ? "bg-[var(--color-brand-green)]/20" : "bg-[var(--color-brand-blue)]/20")}>
        {overdue ? <AlertTriangle className="w-4 h-4 text-[var(--color-brand-orange)] drop-shadow-[0_0_8px_rgba(255,102,0,0.8)]" /> : 
         dueToday ? <Clock className="w-4 h-4 text-[var(--color-brand-green)] drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]" /> : 
         <CalendarClock className="w-4 h-4 text-[var(--color-brand-blue)] drop-shadow-[0_0_8px_rgba(0,102,255,0.8)]" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{task.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn("text-xs font-bold uppercase", overdue ? "text-[var(--color-brand-orange)]" : dueToday ? "text-[var(--color-brand-green)]" : "text-white/60")}>
            {formatDueDate(task.due_date)}
          </span>
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: priorityColor }} />
          {task.assignees && task.assignees.length > 0 ? (
            <div className="flex items-center gap-2">
              {task.assignees.slice(0, 2).map((assignee, i) => (
                <div key={assignee.id || i} className="flex items-center gap-1.5" title={assignee.username}>
                  {assignee.profilePicture ? (
                    <img src={assignee.profilePicture} alt={assignee.username} className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-[var(--color-brand-blue)]/20 text-[var(--color-brand-blue)] flex items-center justify-center shrink-0 font-bold text-[8px]">
                      {assignee.initials || assignee.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground truncate max-w-[80px]">{assignee.username ? assignee.username.split(" ")[0] : "Desconhecido"}</span>
                </div>
              ))}
              {task.assignees.length > 2 && (
                <span className="text-[10px] text-muted-foreground">+{task.assignees.length - 2}</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 opacity-50">
              <User2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Não atribuído</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function UpcomingDeadlines({ tasks }: UpcomingDeadlinesProps) {
  if (tasks.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest mb-6 text-foreground/80 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--color-brand-orange)] shadow-[0_0_8px_var(--color-brand-orange)]" />
          Prazos Próximos
        </h3>
        <div className="flex items-center justify-center h-48 text-muted-foreground text-[10px] uppercase tracking-widest">Sem prazos próximos</div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand-orange)]/5 blur-[100px] rounded-full pointer-events-none" />
      <h3 className="text-xs font-bold uppercase tracking-widest mb-6 text-foreground/80 flex items-center gap-2 relative z-10">
        <span className="w-2 h-2 rounded-full bg-[var(--color-brand-orange)] shadow-[0_0_8px_var(--color-brand-orange)]" />
        Prazos Próximos
      </h3>
      <div className="max-h-[320px] overflow-y-auto space-y-2 pr-2 relative z-10">
        <AnimatedList delay={150}>
          {tasks.slice(0, 8).map((task) => (
            <DeadlineItem key={task.id} task={task} />
          ))}
        </AnimatedList>
      </div>
    </div>
  );
}
