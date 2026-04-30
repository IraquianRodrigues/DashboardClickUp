"use client";

import { useMemo, useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { MemberCard } from "@/components/team/MemberCard";
import { TeamFilters } from "@/components/team/TeamFilters";
import { TeamQuickStats } from "@/components/team/TeamQuickStats";
import { BlurFade } from "@/components/ui/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useClickUpMembers } from "@/hooks/useClickUpMembers";
import type { MemberSortKey } from "@/hooks/useClickUpMembers";
import { pluralize } from "@/lib/utils";
import { Users, Search } from "lucide-react";

const ANIMATION_BASE_DELAY = 0.1;
const ANIMATION_STAGGER = 0.05;
const ANIMATION_MAX_DELAY = 0.5;

export default function TeamPage() {
  const { memberList, isLoading, isFetching, lastUpdated, refetch, error } = useClickUpMembers();

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<MemberSortKey>("total");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredList = useMemo(() => {
    let list = [...memberList];

    if (search) {
      const lower = search.toLowerCase();
      list = list.filter(m =>
        m.user.username.toLowerCase().includes(lower) ||
        m.user.email?.toLowerCase().includes(lower)
      );
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "total": cmp = a.total - b.total; break;
        case "name": cmp = a.user.username.localeCompare(b.user.username); break;
        case "completed": cmp = a.completed - b.completed; break;
        case "overdue": cmp = a.overdue - b.overdue; break;
        case "pending": cmp = a.pending - b.pending; break;
        case "completion": {
          const pA = a.total > 0 ? a.completed / a.total : 0;
          const pB = b.total > 0 ? b.completed / b.total : 0;
          cmp = pA - pB;
          break;
        }
      }
      return sortOrder === "desc" ? -cmp : cmp;
    });

    return list;
  }, [memberList, search, sortKey, sortOrder]);

  const stats = useMemo(() => {
    const totalMembers = memberList.length;
    const totalTasks = memberList.reduce((sum, m) => sum + m.total, 0);
    const totalCompleted = memberList.reduce((sum, m) => sum + m.completed, 0);
    const totalOverdue = memberList.reduce((sum, m) => sum + m.overdue, 0);
    const avgCompletion = totalMembers > 0
      ? Math.round(memberList.reduce((sum, m) => sum + (m.total > 0 ? (m.completed / m.total) * 100 : 0), 0) / totalMembers)
      : 0;
    return { totalMembers, totalTasks, totalCompleted, totalOverdue, avgCompletion };
  }, [memberList]);

  const handleClear = useCallback(() => setSearch(""), []);

  const hasActiveFilters = search !== "";

  return (
    <div className="min-h-screen dashboard-grid-bg">
      <Header
        title="Equipe"
        subtitle={`${filteredList.length} ${pluralize(filteredList.length, "membro", "membros")}`}
        lastUpdated={lastUpdated}
        isFetching={isFetching}
        onRefresh={refetch}
      />

      <div className="p-6 space-y-4">
        {isLoading ? (
          <>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-28 rounded-xl" />)}
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
            </div>
          </>
        ) : (
          <>
            <BlurFade delay={0.05}>
              <TeamQuickStats {...stats} />
            </BlurFade>

            <BlurFade delay={0.1}>
              <TeamFilters
                search={search}
                sortKey={sortKey}
                sortOrder={sortOrder}
                onSearchChange={setSearch}
                onSortKeyChange={setSortKey}
                onSortOrderChange={setSortOrder}
                onClear={handleClear}
                hasActiveFilters={hasActiveFilters}
              />
            </BlurFade>

            {filteredList.length === 0 ? (
              <BlurFade delay={0.15}>
                <EmptyState
                  icon={search ? Search : Users}
                  title={search ? "Nenhum membro encontrado" : "Nenhum membro"}
                  description={search ? `Nenhum resultado para "${search}"` : "Nenhum membro com tarefas foi encontrado nos ultimos 30 dias."}
                />
              </BlurFade>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredList.map((member, i) => (
                  <BlurFade key={member.user.id} delay={Math.min(ANIMATION_BASE_DELAY + i * ANIMATION_STAGGER, ANIMATION_MAX_DELAY)}>
                    <MemberCard
                      user={member.user}
                      total={member.total}
                      completed={member.completed}
                      inProgress={member.inProgress}
                      pending={member.pending}
                      overdue={member.overdue}
                    />
                  </BlurFade>
                ))}
              </div>
            )}
          </>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-400">
            Falha ao carregar dados. Verifique se CLICKUP_API_KEY e CLICKUP_TEAM_ID estao configurados no .env.local.
          </div>
        )}
      </div>
    </div>
  );
}
