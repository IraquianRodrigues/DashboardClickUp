"use client";

import { useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { ClientCard } from "@/components/clients/ClientCard";
import { BlurFade } from "@/components/ui/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";
import { useClickUpTasks } from "@/hooks/useClickUpTasks";
import { MOCK_TASKS } from "@/lib/mock-data";
import { computeMetrics } from "@/lib/clickup/helpers";

export default function ClientsPage() {
  const { tasks, isLoading, isFetching, lastUpdated, refetch } = useClickUpTasks();

  // Exclude tasks from "TP - CLIENTES INATIVOS" space
  const INACTIVE_SPACE_ID = "901312798060";
  const activeTasks = useMemo(() => tasks.filter(t => t.space?.id !== INACTIVE_SPACE_ID), [tasks]);
  const metrics = useMemo(() => computeMetrics(activeTasks), [activeTasks]);

  const clientList = useMemo(() => {
    return Object.values(metrics.byClient).sort((a, b) => b.total - a.total);
  }, [metrics]);

  return (
    <div className="min-h-screen">
      <Header title="Clientes" subtitle={`${clientList.length} cliente${clientList.length !== 1 ? "s" : ""}`} lastUpdated={lastUpdated} isFetching={isFetching} onRefresh={refetch} />

      <div className="p-6">
        {isLoading && tasks.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {clientList.map((client, i) => (
              <BlurFade key={client.name} delay={0.1 + i * 0.05}>
                <ClientCard name={client.name} total={client.total} completed={client.completed} overdue={client.overdue} responsible={client.responsible} />
              </BlurFade>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
