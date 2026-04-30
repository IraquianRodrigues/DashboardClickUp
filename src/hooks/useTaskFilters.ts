"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { ClickUpTask, TaskFiltersState } from "@/types/clickup";
import { DEFAULT_FILTERS } from "@/types/clickup";
import { extractClientName, getPriorityLevel, isDone, isInProgress } from "@/lib/clickup/helpers";

const STORAGE_KEY = "task-filters-prefs";

function loadSavedFilters(): Partial<TaskFiltersState> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

function getNormalizedStatus(task: ClickUpTask): string {
  if (isDone(task)) return "concluído";
  if (isInProgress(task)) return "em progresso";
  return "pendente";
}

export type DueDateFilter = "all" | "overdue" | "today" | "tomorrow" | "week" | "month" | "nodate";

export interface ExtendedTaskFiltersState extends TaskFiltersState {
  dueDate: DueDateFilter;
}

const EXTENDED_DEFAULTS: ExtendedTaskFiltersState = {
  ...DEFAULT_FILTERS,
  dueDate: "all",
};

function getDateBoundaries() {
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  const tomorrowEnd = new Date(todayStart);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 2);
  const tomorrowEndMs = tomorrowEnd.getTime();

  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndMs = weekEnd.getTime();

  const monthEnd = new Date(todayStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  const monthEndMs = monthEnd.getTime();

  return { now, todayStartMs, tomorrowEndMs, weekEndMs, monthEndMs };
}

export function useTaskFilters(tasks: ClickUpTask[]) {
  const [filters, setFilters] = useState<ExtendedTaskFiltersState>(() => {
    const saved = loadSavedFilters();
    return { ...EXTENDED_DEFAULTS, ...saved } as ExtendedTaskFiltersState;
  });

  useEffect(() => {
    const toSave: Record<string, unknown> = {};
    if (filters.search) toSave.search = filters.search;
    if (filters.statuses.length) toSave.statuses = filters.statuses;
    if (filters.priorities.length) toSave.priorities = filters.priorities;
    if (filters.assignees.length) toSave.assignees = filters.assignees;
    if (filters.clients.length) toSave.clients = filters.clients;
    if (filters.dueDate !== "all") toSave.dueDate = filters.dueDate;
    if (Object.keys(toSave).length > 0) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); } catch {}
    }
  }, [filters]);

  const setFilter = useCallback(<K extends keyof ExtendedTaskFiltersState>(key: K, value: ExtendedTaskFiltersState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => setFilters(EXTENDED_DEFAULTS), []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.statuses.length) count++;
    if (filters.priorities.length) count++;
    if (filters.assignees.length) count++;
    if (filters.clients.length) count++;
    if (filters.dueDate !== "all") count++;
    return count;
  }, [filters.search, filters.statuses.length, filters.priorities.length, filters.assignees.length, filters.clients.length, filters.dueDate]);

  const filteredTasks = useMemo(() => {
    const { now, todayStartMs, tomorrowEndMs, weekEndMs, monthEndMs } = getDateBoundaries();
    return tasks.filter((task) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const client = extractClientName(task).toLowerCase();
        const description = (task.description || "").toLowerCase();
        if (
          !task.name.toLowerCase().includes(q) &&
          !client.includes(q) &&
          !description.includes(q)
        ) return false;
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
      if (filters.dueDate !== "all" && task.due_date) {
        const due = parseInt(task.due_date);
        switch (filters.dueDate) {
          case "overdue": if (due >= now || isDone(task)) return false; break;
          case "today": if (due < todayStartMs || due >= tomorrowEndMs) return false; break;
          case "tomorrow": if (due < tomorrowEndMs || due >= weekEndMs) return false; break;
          case "week": if (due < todayStartMs || due >= weekEndMs) return false; break;
          case "month": if (due < todayStartMs || due >= monthEndMs) return false; break;
          case "nodate": return false;
        }
      } else if (filters.dueDate === "nodate" && task.due_date) {
        return false;
      }
      return true;
    });
  }, [tasks, filters]);

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
      assignees: Array.from(assignees.values()).sort((a, b) => (a.username || "").localeCompare(b.username || "")),
      clients: Array.from(clients).sort(),
      lists: Array.from(lists.entries()).map(([id, name]) => ({ id, name })),
    };
  }, [tasks]);

  return { filters, setFilter, clearFilters, filteredTasks, filterOptions, activeFilterCount };
}
