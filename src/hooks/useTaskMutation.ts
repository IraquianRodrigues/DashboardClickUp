"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ClickUpTask } from "@/types/clickup";
import { toast } from "sonner";

async function updateTask(taskId: string, data: Record<string, unknown>): Promise<ClickUpTask> {
  const res = await fetch(`/api/clickup/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export function useTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Record<string, unknown> }) =>
      updateTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clickup-tasks"] });
      toast.success("Tarefa atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar tarefa: ${error.message}`);
    },
  });
}
