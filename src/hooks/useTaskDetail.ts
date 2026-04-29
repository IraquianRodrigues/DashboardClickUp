"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClickUpTask, ClickUpComment } from "@/types/clickup";

async function fetchTaskDetail(taskId: string): Promise<ClickUpTask> {
  const res = await fetch(`/api/clickup/tasks/${taskId}`);
  if (!res.ok) throw new Error("Failed to fetch task details");
  return res.json();
}

async function fetchTaskComments(taskId: string): Promise<ClickUpComment[]> {
  const res = await fetch(`/api/clickup/comments/${taskId}`);
  if (!res.ok) throw new Error("Failed to fetch comments");
  const data = await res.json();
  return data.comments;
}

export function useTaskDetail(taskId: string | null) {
  const taskQuery = useQuery({
    queryKey: ["clickup-task", taskId],
    queryFn: () => fetchTaskDetail(taskId!),
    enabled: !!taskId,
  });

  const commentsQuery = useQuery({
    queryKey: ["clickup-comments", taskId],
    queryFn: () => fetchTaskComments(taskId!),
    enabled: !!taskId,
  });

  return {
    task: taskQuery.data || null,
    comments: commentsQuery.data || [],
    isLoading: taskQuery.isLoading || commentsQuery.isLoading,
    error: taskQuery.error || commentsQuery.error,
  };
}
