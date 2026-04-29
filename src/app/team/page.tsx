"use client";

import { useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { MemberCard } from "@/components/team/MemberCard";
import { BlurFade } from "@/components/ui/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";
import { useClickUpTasks } from "@/hooks/useClickUpTasks";
import { MOCK_TASKS } from "@/lib/mock-data";
import { computeMetrics } from "@/lib/clickup/helpers";

export default function TeamPage() {
  const { tasks, metrics: apiMetrics, isLoading, isFetching, lastUpdated, refetch } = useClickUpTasks();
  const metrics = useMemo(() => apiMetrics || computeMetrics(tasks), [apiMetrics, tasks]);

  const memberList = useMemo(() => {
    return Object.values(metrics.byAssignee).sort((a, b) => b.total - a.total);
  }, [metrics]);

  return (
    <div className="min-h-screen">
      <Header title="Equipe" subtitle={`${memberList.length} membro${memberList.length !== 1 ? "s" : ""}`} lastUpdated={lastUpdated} isFetching={isFetching} onRefresh={refetch} />

      <div className="p-6">
        {isLoading && tasks.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {memberList.map((member, i) => (
              <BlurFade key={member.user.id} delay={0.1 + i * 0.05}>
                <MemberCard user={member.user} total={member.total} completed={member.completed} inProgress={member.inProgress} pending={member.pending} overdue={member.overdue} />
              </BlurFade>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
