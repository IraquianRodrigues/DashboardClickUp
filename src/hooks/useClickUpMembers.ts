"use client";

import { useMemo } from "react";
import { useClickUpTasks } from "./useClickUpTasks";
import type { ClickUpUser } from "@/types/clickup";

export type MemberSortKey = "name" | "total" | "completed" | "overdue" | "completion" | "pending";

export interface MemberWithMetrics {
  user: ClickUpUser;
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
}

export function useClickUpMembers() {
  const { tasks, metrics, isLoading, isFetching, error, lastUpdated, refetch } = useClickUpTasks();

  const memberList = useMemo((): MemberWithMetrics[] => {
    if (!metrics?.byAssignee) return [];

    return Object.values(metrics.byAssignee)
      .sort((a, b) => b.total - a.total);
  }, [metrics]);

  return {
    memberList,
    metrics,
    activeTasks: tasks,
    isLoading,
    isFetching,
    error,
    lastUpdated,
    refetch,
  };
}
