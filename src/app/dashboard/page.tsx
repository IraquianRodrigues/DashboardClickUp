"use client";

import { Header } from "@/components/layout/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusChart } from "@/components/dashboard/StatusChart";
import { TasksByAssignee } from "@/components/dashboard/TasksByAssignee";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { OverdueMarquee } from "@/components/dashboard/OverdueMarquee";
import { ProgressOverview } from "@/components/dashboard/ProgressOverview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AIInsights } from "@/components/dashboard/AIInsights";

import { BlurFade } from "@/components/ui/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";
import { useClickUpTasks } from "@/hooks/useClickUpTasks";
import { getUpcomingTasks, getOverdueTasks } from "@/lib/clickup/helpers";
import { ListTodo, PlayCircle, Clock, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { useMemo } from "react";
import { computeMetrics } from "@/lib/clickup/helpers";

export default function DashboardPage() {
  const { tasks, metrics: apiMetrics, isLoading, isFetching, lastUpdated, refetch, error } = useClickUpTasks();

  const metrics = useMemo(() => apiMetrics || computeMetrics(tasks), [apiMetrics, tasks]);

  const upcomingTasks = useMemo(() => getUpcomingTasks(tasks, 5), [tasks]);
  const overdueTasks = useMemo(() => getOverdueTasks(tasks), [tasks]);

  return (
    <div className="min-h-screen dashboard-grid-bg">
      <Header title="Dashboard" subtitle="Visão geral das tarefas em tempo real" lastUpdated={lastUpdated} isFetching={isFetching} onRefresh={refetch} />

      <div className="p-6 space-y-6">
        {/* Overdue alert */}
        <BlurFade delay={0.05}>
          <OverdueMarquee tasks={overdueTasks} />
        </BlurFade>

        {/* Metric Cards */}
        {isLoading && tasks.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <BlurFade delay={0.1}><MetricCard title="Total" value={metrics.total} icon={ListTodo} color="violet" /></BlurFade>
            <BlurFade delay={0.15}><MetricCard title="Em Andamento" value={metrics.inProgress} icon={PlayCircle} color="blue" /></BlurFade>
            <BlurFade delay={0.2}><MetricCard title="Pendentes" value={metrics.pending} icon={Clock} color="amber" /></BlurFade>
            <BlurFade delay={0.25}><MetricCard title="Concluídas" value={metrics.completed} icon={CheckCircle2} color="emerald" /></BlurFade>
            <BlurFade delay={0.3}><MetricCard title="Atrasadas" value={metrics.overdue} icon={AlertTriangle} color="red" showBeam={metrics.overdue > 0} /></BlurFade>
            <BlurFade delay={0.35}><MetricCard title="Bloqueadas" value={metrics.blocked} icon={ShieldAlert} color="gray" showBeam={metrics.blocked > 0} /></BlurFade>
          </div>
        )}

        {/* Progress Overview */}
        <BlurFade delay={0.38}>
          <ProgressOverview metrics={metrics} />
        </BlurFade>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BlurFade delay={0.4}><StatusChart metrics={metrics} /></BlurFade>
          <BlurFade delay={0.45}><TasksByAssignee metrics={metrics} /></BlurFade>
        </div>

        {/* AI Insights */}
        <BlurFade delay={0.48}>
          <AIInsights />
        </BlurFade>

        {/* Bottom row: Deadlines + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BlurFade delay={0.5}>
            <UpcomingDeadlines tasks={upcomingTasks} />
          </BlurFade>
          <BlurFade delay={0.55}>
            <RecentActivity tasks={tasks} />
          </BlurFade>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-400">
            ⚠ Usando dados de demonstração. Configure CLICKUP_API_KEY e CLICKUP_TEAM_ID no .env.local para dados reais.
          </div>
        )}
      </div>
    </div>
  );
}
