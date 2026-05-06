"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClickUpTask, DashboardMetrics } from "@/types/clickup";
import { computeMetrics } from "@/lib/clickup/helpers";
import { useMemo } from "react";

const POLLING_INTERVAL = parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL || "60000");

async function fetchAllTasks(): Promise<ClickUpTask[]> {
  let page = 0;
  let lastPage = false;
  const allTasks: ClickUpTask[] = [];
  
  const MAX_PAGES = 500;
  const FETCH_TIMEOUT_MS = 9_000; // Slightly under Netlify's 10s limit
  
  // Only fetch tasks from the last 30 days
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

  while (!lastPage && page < MAX_PAGES) {
    // Fetch 2 pages in parallel (reduced from 5 to avoid overwhelming serverless functions)
    const batchPromises = [];
    for (let i = 0; i < 2 && page < MAX_PAGES; i++, page++) {
      const sp = new URLSearchParams();
      sp.set("include_closed", "true");
      sp.set("subtasks", "true");
      sp.set("page", String(page));
      sp.set("date_updated_gt", String(thirtyDaysAgo));
      
      batchPromises.push(
        fetchWithTimeout(`/api/clickup/tasks/all?${sp.toString()}`, FETCH_TIMEOUT_MS)
          .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch tasks page ${page}`);
            return res.json();
          })
          .catch(() => ({ tasks: [], lastPage: true })) // Graceful degradation: stop on error
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
  
  // De-duplicate tasks by ID
  const uniqueTasks = Array.from(new Map(allTasks.map(t => [t.id, t])).values());
  return uniqueTasks;
}

function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
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
