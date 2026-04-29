"use client";

import { useState, useCallback, useMemo } from "react";
import type { ClickUpTask, TaskFiltersState } from "@/types/clickup";
import { DEFAULT_FILTERS } from "@/types/clickup";
import { extractClientName, getPriorityLevel, isDone, isInProgress } from "@/lib/clickup/helpers";

// Normalize raw ClickUp statuses into 3 categories
function getNormalizedStatus(task: ClickUpTask): string {
  if (isDone(task)) return "concluído";
  if (isInProgress(task)) return "em progresso";
  return "pendente";
}

export function useTaskFilters(tasks: ClickUpTask[]) {
  const [filters, setFilters] = useState<TaskFiltersState>(DEFAULT_FILTERS);

  const setFilter = useCallback(<K extends keyof TaskFiltersState>(key: K, value: TaskFiltersState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.statuses.length) count++;
    if (filters.priorities.length) count++;
    if (filters.assignees.length) count++;
    if (filters.clients.length) count++;
    if (filters.listIds.length) count++;
    return count;
  }, [filters]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!task.name.toLowerCase().includes(q)) return false;
      }
      if (filters.statuses.length) {
        const normalized = getNormalizedStatus(task);
        if (!filters.statuses.includes(normalized)) return false;
      }
      if (filters.priorities.length && !filters.priorities.includes(getPriorityLevel(task.priority))) return false;
      if (filters.assignees.length && !task.assignees.some((a) => filters.assignees.includes(a.id))) return false;
      if (filters.clients.length) {
        const client = extractClientName(task);
        if (!filters.clients.includes(client)) return false;
      }
      if (filters.listIds.length && !filters.listIds.includes(task.list.id)) return false;
      return true;
    });
  }, [tasks, filters]);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const priorities = new Set<string>();
    const assignees = new Map<number, { id: number; username: string; profilePicture: string | null }>();
    const clients = new Set<string>();
    const lists = new Map<string, string>();

    tasks.forEach((task) => {
      if (task.priority) priorities.add(getPriorityLevel(task.priority));
      task.assignees.forEach((a) => assignees.set(a.id, { id: a.id, username: a.username, profilePicture: a.profilePicture }));
      clients.add(extractClientName(task));
      lists.set(task.list.id, task.list.name);
    });

    return {
      statuses: [
        { name: "concluído", color: "#00FF00" },
        { name: "em progresso", color: "#0066FF" },
        { name: "pendente", color: "#9ca3af" },
      ],
      priorities: ["urgent", "high", "normal", "low"],
      assignees: Array.from(assignees.values()),
      clients: Array.from(clients).sort(),
      lists: Array.from(lists.entries()).map(([id, name]) => ({ id, name })),
    };
  }, [tasks]);

  return { filters, setFilter, clearFilters, filteredTasks, filterOptions, activeFilterCount };
}
