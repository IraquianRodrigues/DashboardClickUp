"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { BlurFade } from "@/components/ui/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskCardView } from "@/components/tasks/TaskCardView";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { Button } from "@/components/ui/button";
import { ClientQuickStats } from "@/components/clients/ClientQuickStats";
import { useClickUpTasks } from "@/hooks/useClickUpTasks";
import { extractClientName, computeMetrics } from "@/lib/clickup/helpers";
import { INACTIVE_SPACE_ID } from "@/lib/config";
import { pluralize } from "@/lib/utils";
import { ArrowLeft, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "cards";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const clientName = decodeURIComponent(slug);

  const { tasks, isLoading, isFetching, lastUpdated, refetch } = useClickUpTasks();

  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const clientTasks = useMemo(() => {
    const active = tasks.filter(t => t.space?.id !== INACTIVE_SPACE_ID);
    return active.filter(t => extractClientName(t) === clientName);
  }, [tasks, clientName]);

  const clientMetrics = useMemo(() => computeMetrics(clientTasks), [clientTasks]);

  const stats = useMemo(() => ({
    totalClients: 1,
    totalTasks: clientTasks.length,
    totalCompleted: clientMetrics.completed,
    totalOverdue: clientMetrics.overdue,
    completion: clientTasks.length > 0 ? Math.round((clientMetrics.completed / clientTasks.length) * 100) : 0,
  }), [clientTasks, clientMetrics]);

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setDetailOpen(true);
  };

  return (
    <div className="min-h-screen dashboard-grid-bg">
      <Header
        title={clientName}
        subtitle={`${clientTasks.length} ${pluralize(clientTasks.length, "tarefa", "tarefas")}`}
        lastUpdated={lastUpdated}
        isFetching={isFetching}
        onRefresh={refetch}
      />

      <div className="p-6 space-y-4">
        <BlurFade delay={0.05}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/clients")}
            className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para clientes
          </Button>
        </BlurFade>

        {isLoading && tasks.length === 0 ? (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-28 rounded-xl" />)}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          </div>
        ) : (
          <>
            <BlurFade delay={0.1}>
              <ClientQuickStats {...stats} completionLabel="Conclusão" />
            </BlurFade>

            <BlurFade delay={0.15}>
              <div className="flex items-center justify-end">
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
            </BlurFade>

            {clientTasks.length === 0 ? (
              <BlurFade delay={0.2}>
                <EmptyState
                  title="Nenhuma tarefa encontrada"
                  description={`Nenhuma tarefa foi encontrada para o cliente "${clientName}" nos últimos 30 dias.`}
                />
              </BlurFade>
            ) : (
              <BlurFade delay={0.2}>
                {viewMode === "table" ? (
                  <TaskTable tasks={clientTasks} onTaskClick={handleTaskClick} />
                ) : (
                  <TaskCardView tasks={clientTasks} onTaskClick={handleTaskClick} />
                )}
              </BlurFade>
            )}
          </>
        )}
      </div>

      <TaskDetailPanel taskId={selectedTaskId} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
}
