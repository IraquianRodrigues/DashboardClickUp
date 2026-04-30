"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ClickUpTask, ClickUpUser } from "@/types/clickup";
import { computeMetrics } from "@/lib/clickup/helpers";
import { INACTIVE_SPACE_ID } from "@/lib/config";

export type MemberSortKey = "name" | "total" | "completed" | "overdue" | "completion" | "pending";

export interface MemberWithMetrics {
  user: ClickUpUser;
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
}

async function fetchTasks(): Promise<ClickUpTask[]> {
  let page = 0;
  let lastPage = false;
  const allTasks: ClickUpTask[] = [];
  const MAX_PAGES = 500;
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

  while (!lastPage && page < MAX_PAGES) {
    const batchPromises = [];
    for (let i = 0; i < 5 && page < MAX_PAGES; i++, page++) {
      const sp = new URLSearchParams();
      sp.set("include_closed", "true");
      sp.set("subtasks", "true");
      sp.set("page", String(page));
      sp.set("date_updated_gt", String(thirtyDaysAgo));
      batchPromises.push(
        fetch(`/api/clickup/tasks/all?${sp.toString()}`).then(r => {
          if (!r.ok) throw new Error(`Failed to fetch tasks page ${page}`);
          return r.json();
        })
      );
    }
    const results = await Promise.all(batchPromises);
    for (const result of results) {
      if (result.tasks && Array.isArray(result.tasks)) {
        allTasks.push(...result.tasks);
      }
      if (result.lastPage === true) {
        lastPage = true;
      }
    }
  }
  return Array.from(new Map(allTasks.map(t => [t.id, t])).values());
}

export function useClickUpMembers() {
  const { data: tasks, isLoading: tasksLoading, isFetching: tasksFetching, error: tasksError, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["clickup-tasks-team"],
    queryFn: fetchTasks,
    refetchInterval: parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL || "30000"),
    refetchIntervalInBackground: false,
  });

  const isFetching = tasksFetching;
  const error = tasksError;

  const activeTasks = useMemo(() => {
    return (tasks || []).filter(t => t.space?.id !== INACTIVE_SPACE_ID);
  }, [tasks]);

  const metrics = useMemo(() => computeMetrics(activeTasks), [activeTasks]);

  const memberList = useMemo((): MemberWithMetrics[] => {
    if (!metrics?.byAssignee) return [];

    return Object.values(metrics.byAssignee)
      .sort((a, b) => b.total - a.total);
  }, [metrics]);

  return {
    memberList,
    metrics,
    activeTasks,
    isLoading: tasksLoading,
    isFetching,
    error,
    lastUpdated: dataUpdatedAt,
    refetch,
  };
}
