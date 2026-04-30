"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClickUpTask, DashboardMetrics } from "@/types/clickup";
import { computeMetrics } from "@/lib/clickup/helpers";
import { useMemo } from "react";

const POLLING_INTERVAL = parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL || "30000");

async function fetchAllTasks(): Promise<ClickUpTask[]> {
  let page = 0;
  let lastPage = false;
  const allTasks: ClickUpTask[] = [];
  
  // Maximum safeguard to prevent infinite loops (e.g. 500 pages = 50,000 tasks)
  const MAX_PAGES = 500;
  
  // Only fetch tasks from the last 30 days
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

  while (!lastPage && page < MAX_PAGES) {
    // Fetch up to 5 pages in parallel to speed things up
    const batchPromises = [];
    for (let i = 0; i < 5 && page < MAX_PAGES; i++, page++) {
      const sp = new URLSearchParams();
      sp.set("include_closed", "true");
      sp.set("subtasks", "true");
      sp.set("page", String(page));
      sp.set("date_updated_gt", String(thirtyDaysAgo));
      
      batchPromises.push(
        fetch(`/api/clickup/tasks/all?${sp.toString()}`).then(res => {
          if (!res.ok) throw new Error(`Failed to fetch tasks page ${page}`);
          return res.json();
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
  
  // De-duplicate tasks by ID (ClickUp pagination can sometimes return duplicates if tasks are updated during fetching)
  const uniqueTasks = Array.from(new Map(allTasks.map(t => [t.id, t])).values());
  return uniqueTasks;
}

export function useClickUpTasks() {
  const query = useQuery({
    queryKey: ["clickup-tasks"],
    queryFn: fetchAllTasks,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
  });

  const metrics: DashboardMetrics | null = useMemo(() => {
    if (!query.data || !Array.isArray(query.data)) return null;
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
