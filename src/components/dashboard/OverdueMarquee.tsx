"use client";

import { Marquee } from "@/components/ui/marquee";
import { AlertTriangle } from "lucide-react";
import type { ClickUpTask } from "@/types/clickup";
import { formatDueDate, extractClientName, getPriorityColor, getPriorityLevel } from "@/lib/clickup/helpers";

interface OverdueMarqueeProps {
  tasks: ClickUpTask[];
}

export function OverdueMarquee({ tasks }: OverdueMarqueeProps) {
  const now = Date.now();
  const recentOverdue = tasks.filter(t => {
    if (!t.due_date) return false;
    const due = parseInt(t.due_date);
    const diffDays = (now - due) / (1000 * 60 * 60 * 24);
    return diffDays <= 15;
  });

  if (recentOverdue.length === 0) return null;

  return (
    <div className="rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-xs font-semibold text-red-400">
            {recentOverdue.length} TAREFA{recentOverdue.length > 1 ? "S" : ""} ATRASADA{recentOverdue.length > 1 ? "S" : ""} (ÚLTIMOS 15 DIAS)
          </span>
        </div>
        {tasks.length > recentOverdue.length && (
          <span className="text-[10px] text-red-400/50 uppercase font-bold tracking-widest">
            +{tasks.length - recentOverdue.length} muito antigas ocultas
          </span>
        )}
      </div>
      <Marquee pauseOnHover className="py-3 [--duration:4000s]">
        {recentOverdue.map((task) => {
          const client = extractClientName(task);
          const priorityColor = getPriorityColor(getPriorityLevel(task.priority));

          return (
            <div key={task.id} className="flex items-center gap-3 mx-3 px-4 py-2 rounded-xl bg-red-950/40 border border-red-500/20 shadow-sm hover:bg-red-900/40 transition-colors">
              <div className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_currentColor]" style={{ color: priorityColor, backgroundColor: priorityColor }} />

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-200">{task.name}</span>
                  {client && client !== "Sem cliente" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-300 font-medium whitespace-nowrap">
                      {client}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-red-400/70 font-medium">
                  <span className="text-red-400 font-bold uppercase tracking-wider">{formatDueDate(task.due_date)}</span>

                  {task.assignees && task.assignees.length > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        {task.assignees.slice(0, 2).map((a, i) => (
                          <span key={a.id || i} className="text-red-300">
                            {a.username ? a.username.split(" ")[0] : "Desconhecido"}
                            {i === 0 && task.assignees.length > 1 ? "," : ""}
                          </span>
                        ))}
                        {task.assignees.length > 2 && <span className="text-red-500/50">+{task.assignees.length - 2}</span>}
                      </div>
                    </>
                  )}

                  {task.folder?.name && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[150px]">{task.folder.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </Marquee>
    </div>
  );
}
