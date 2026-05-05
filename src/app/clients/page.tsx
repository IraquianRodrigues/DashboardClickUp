"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { ClientCard } from "@/components/clients/ClientCard";
import { ClientFilters, ClientSortKey } from "@/components/clients/ClientFilters";
import { ClientQuickStats } from "@/components/clients/ClientQuickStats";
import { BlurFade } from "@/components/ui/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useClickUpTasks } from "@/hooks/useClickUpTasks";
import { computeMetrics } from "@/lib/clickup/helpers";
import { INACTIVE_SPACE_ID } from "@/lib/config";
import { pluralize } from "@/lib/utils";
import { Users, Search } from "lucide-react";

const ANIMATION_BASE_DELAY = 0.1;
const ANIMATION_STAGGER = 0.05;
const ANIMATION_MAX_DELAY = 0.5;

export default function ClientsPage() {
  const { tasks, isLoading, isFetching, lastUpdated, refetch, error } = useClickUpTasks();

  const activeTasks = useMemo(() => tasks.filter(t => t.space?.id !== INACTIVE_SPACE_ID), [tasks]);
  const metrics = useMemo(() => computeMetrics(activeTasks), [activeTasks]);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<ClientSortKey>("completion");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const clientList = useMemo(() => {
    let list = Object.values(metrics.byClient);

    if (search) {
      const lower = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(lower) ||
        c.responsible?.toLowerCase().includes(lower)
      );
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "total": cmp = a.total - b.total; break;
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "completion": {
          const pA = a.total > 0 ? a.completed / a.total : 0;
          const pB = b.total > 0 ? b.completed / b.total : 0;
          cmp = pA - pB;
          break;
        }
        case "overdue": cmp = a.overdue - b.overdue; break;
        case "responsible": cmp = (a.responsible || "").localeCompare(b.responsible || ""); break;
      }
      return sortOrder === "desc" ? -cmp : cmp;
    });

    return list;
  }, [metrics, search, sortKey, sortOrder]);

  const stats = useMemo(() => {
    const totalClients = Object.keys(metrics.byClient).length;
    const totalTasks = activeTasks.length;
    const totalCompleted = metrics.completed;
    const totalOverdue = metrics.overdue;
    const completion = totalClients > 0
      ? Math.round(Object.values(metrics.byClient).reduce((sum, c) => sum + (c.total > 0 ? (c.completed / c.total) * 100 : 0), 0) / totalClients)
      : 0;
    return { totalClients, totalTasks, totalCompleted, totalOverdue, completion };
  }, [metrics, activeTasks]);

  const hasActiveFilters = search !== "";

  return (
    <div className="min-h-screen dashboard-grid-bg">
      <Header
        title="Clientes"
        subtitle={`${clientList.length} ${pluralize(clientList.length, "cliente", "clientes")}`}
        lastUpdated={lastUpdated}
        isFetching={isFetching}
        onRefresh={refetch}
      />

      <div className="p-6 space-y-4">
        {isLoading && tasks.length === 0 ? (
          <>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-28 rounded-xl" />)}
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
            </div>
          </>
        ) : (
          <>
            <BlurFade delay={0.05}>
              <ClientQuickStats {...stats} completionLabel="Média conclusão" />
            </BlurFade>

            <BlurFade delay={0.1}>
              <ClientFilters
                search={search}
                sortKey={sortKey}
                sortOrder={sortOrder}
                onSearchChange={setSearch}
                onSortKeyChange={setSortKey}
                onSortOrderChange={setSortOrder}
                onClear={() => { setSearch(""); }}
                hasActiveFilters={hasActiveFilters}
              />
            </BlurFade>

            {clientList.length === 0 ? (
              <BlurFade delay={0.15}>
                <EmptyState
                  icon={search ? Search : Users}
                  title={search ? "Nenhum cliente encontrado" : "Nenhum cliente"}
                  description={search ? `Nenhum resultado para "${search}"` : "Nenhuma tarefa com cliente foi encontrada nos últimos 30 dias."}
                />
              </BlurFade>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {clientList.map((client, i) => (
                  <BlurFade key={client.name} delay={Math.min(ANIMATION_BASE_DELAY + i * ANIMATION_STAGGER, ANIMATION_MAX_DELAY)}>
                    <ClientCard
                      name={client.name}
                      total={client.total}
                      completed={client.completed}
                      overdue={client.overdue}
                      responsible={client.responsible}
                      pending={client.total - client.completed}
                    />
                  </BlurFade>
                ))}
              </div>
            )}
          </>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-400">
            ⚠ Falha ao carregar dados. Verifique se CLICKUP_API_KEY e CLICKUP_TEAM_ID estão configurados no .env.local.
          </div>
        )}
      </div>
    </div>
  );
}
