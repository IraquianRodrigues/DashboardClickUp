"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { ClickUpTask, DashboardMetrics } from "@/types/clickup";
import { computeMetrics } from "@/lib/clickup/helpers";
import { useMemo } from "react";

const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes
const FETCH_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const INACTIVE_NAME = "TP - CLIENTES INATIVOS";

// ---- Spaces (fetched once, cached) ----

interface SpaceInfo { id: string; name: string }

async function fetchSpaces(): Promise<Map<string, string>> {
  const res = await fetch("/api/clickup/spaces");
  if (!res.ok) return new Map();
  const data = await res.json();
  const spaces: SpaceInfo[] = data.spaces || [];
  return new Map(spaces.map(s => [s.id, s.name]));
}

// ---- Tasks (paginated) ----

async function fetchPageWithRetry(url: string, retries = MAX_RETRIES): Promise<{ tasks: ClickUpTask[]; lastPage: boolean }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      if (attempt === retries) {
        return { tasks: [], lastPage: false };
      }
      await new Promise(r => setTimeout(r, (attempt + 1) * 1000));
    }
  }
  return { tasks: [], lastPage: false };
}

async function fetchAllTasks(): Promise<ClickUpTask[]> {
  // 1. Fetch spaces ONCE (fast, ~1s)
  const spaceMap = await fetchSpaces();

  // 2. Paginate through all tasks
  const allTasks: ClickUpTask[] = [];
  const MAX_PAGES = 500;
  let consecutiveEmpty = 0;
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

  let page = 0;
  while (page < MAX_PAGES) {
    const sp = new URLSearchParams();
    sp.set("include_closed", "true");
    sp.set("subtasks", "true");
    sp.set("page", String(page));
    sp.set("date_updated_gt", String(thirtyDaysAgo));

    const result = await fetchPageWithRetry(`/api/clickup/tasks/all?${sp.toString()}`);

    if (result.tasks && result.tasks.length > 0) {
      allTasks.push(...result.tasks);
      consecutiveEmpty = 0;
    } else {
      consecutiveEmpty++;
    }

    if (result.lastPage || consecutiveEmpty >= 3) break;
    page++;
  }

  // 3. Enrich with space names and filter inactive
  const enriched = allTasks
    .map(task => {
      if (task.space && spaceMap.has(task.space.id)) {
        return { ...task, space: { ...task.space, name: spaceMap.get(task.space.id) } };
      }
      return task;
    })
    .filter(task => {
      const spaceName = (task.space as any)?.name || "";
      const folderName = task.folder?.name || "";
      const listName = task.list?.name || "";
      return spaceName !== INACTIVE_NAME && folderName !== INACTIVE_NAME && listName !== INACTIVE_NAME;
    });

  // 4. De-duplicate by ID
  return Array.from(new Map(enriched.map(t => [t.id, t])).values());
}

export function useClickUpTasks() {
  const query = useQuery({
    queryKey: ["clickup-tasks"],
    queryFn: fetchAllTasks,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
    staleTime: POLLING_INTERVAL,
    retry: 1,
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
