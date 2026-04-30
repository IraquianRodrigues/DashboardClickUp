"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskCardView } from "@/components/tasks/TaskCardView";
import { TaskQuickStats } from "@/components/tasks/TaskQuickStats";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { BlurFade } from "@/components/ui/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useClickUpTasks } from "@/hooks/useClickUpTasks";
import { useTaskFilters } from "@/hooks/useTaskFilters";
import { LayoutGrid, List, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractClientName, formatDueDate } from "@/lib/clickup/helpers";

type ViewMode = "table" | "cards";

export default function TasksPage() {
  const { tasks, isLoading, isFetching, lastUpdated, refetch } = useClickUpTasks();
  const { filters, setFilter, clearFilters, filteredTasks, filterOptions, activeFilterCount } = useTaskFilters(tasks);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [copied, setCopied] = useState(false);

  const appliedMemberFilter = useRef(false);

  useEffect(() => {
    if (appliedMemberFilter.current) return;
    try {
      const memberId = sessionStorage.getItem("team-filter-member");
      if (memberId && filterOptions.assignees.length > 0) {
        const id = parseInt(memberId);
        const exists = filterOptions.assignees.some(a => a.id === id);
        if (exists) {
          setFilter("assignees", [id]);
          appliedMemberFilter.current = true;
          sessionStorage.removeItem("team-filter-member");
        }
      }
    } catch {}
  }, [filterOptions.assignees, setFilter]);

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setDetailOpen(true);
  };

  const handleCopy = useCallback(() => {
    const text = filteredTasks
      .map((t) => `${t.name} | ${t.status.status} | ${extractClientName(t)} | ${formatDueDate(t.due_date)}`)
      .join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [filteredTasks]);

  return (
    <div className="min-h-screen dashboard-grid-bg">
      <Header title="Tarefas" subtitle={`${filteredTasks.length} tarefa${filteredTasks.length !== 1 ? "s" : ""}`} lastUpdated={lastUpdated} isFetching={isFetching} onRefresh={refetch} />

      <div className="p-6 space-y-4">
        <BlurFade delay={0.05}>
          <TaskQuickStats tasks={tasks} filteredCount={filteredTasks.length} />
        </BlurFade>

        <BlurFade delay={0.1}>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <TaskFilters filters={filters} options={filterOptions} activeCount={activeFilterCount} onFilterChange={setFilter} onClear={clearFilters} />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="rounded-xl border-border/50 h-9 gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[var(--color-brand-green)]" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-xs hidden sm:inline">{copied ? "Copiado!" : "Copiar"}</span>
              </Button>

              <div className="flex rounded-xl border border-border/50 overflow-hidden">
                <button
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === "table" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === "cards" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </BlurFade>

        {isLoading && tasks.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : (
          <BlurFade delay={0.2}>
            {viewMode === "table" ? (
              <TaskTable tasks={filteredTasks} onTaskClick={handleTaskClick} />
            ) : (
              <TaskCardView tasks={filteredTasks} onTaskClick={handleTaskClick} />
            )}
          </BlurFade>
        )}
      </div>

      <TaskDetailPanel taskId={selectedTaskId} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
}
