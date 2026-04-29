"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClickUpTask, DashboardMetrics } from "@/types/clickup";
import { computeMetrics } from "@/lib/clickup/helpers";
import { useMemo } from "react";

const POLLING_INTERVAL = parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL || "30000");

async function fetchAllTasks(): Promise<ClickUpTask[]> {
  const sp = new URLSearchParams();
  sp.set("include_closed", "true");
  sp.set("subtasks", "true");

  const res = await fetch(`/api/clickup/tasks/all?${sp.toString()}&_t=${Date.now()}`);
  if (!res.ok) throw new Error("Failed to fetch all tasks");
  return res.json();
}

export function useClickUpTasks() {
  const query = useQuery({
    queryKey: ["clickup-tasks"],
    queryFn: fetchAllTasks,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
  });

  const metrics: DashboardMetrics | null = useMemo(() => {
    if (!query.data) return null;
    return computeMetrics(query.data);
  }, [query.data]);

  return {
    tasks: query.data || [],
    metrics,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    lastUpdated: query.dataUpdatedAt,
    refetch: query.refetch,
  };
}
