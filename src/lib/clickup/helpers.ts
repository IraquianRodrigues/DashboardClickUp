import type { ClickUpTask, ClickUpUser, DashboardMetrics, PriorityLevel } from "@/types/clickup";
import { formatDistanceToNow, isPast, isToday, isTomorrow, format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function getPriorityLevel(priority: ClickUpTask["priority"]): PriorityLevel {
  if (!priority) return "none";
  const map: Record<string, PriorityLevel> = { "1": "urgent", "2": "high", "3": "normal", "4": "low" };
  return map[priority.priority] || "none";
}

export function getPriorityLabel(priority: PriorityLevel): string {
  const map: Record<PriorityLevel, string> = { urgent: "Urgente", high: "Alta", normal: "Normal", low: "Baixa", none: "Nenhuma" };
  return map[priority];
}

export function getPriorityColor(priority: PriorityLevel): string {
  const map: Record<PriorityLevel, string> = {
    urgent: "#ef4444", high: "#f97316", normal: "#3b82f6", low: "#9ca3af", none: "#6b7280",
  };
  return map[priority];
}

export function getPriorityTailwind(priority: PriorityLevel): string {
  const map: Record<PriorityLevel, string> = {
    urgent: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    normal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    none: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };
  return map[priority];
}

export function isOverdue(task: ClickUpTask): boolean {
  if (!task.due_date) return false;
  if (task.status.type === "closed" || task.status.type === "done") return false;
  return isPast(new Date(parseInt(task.due_date)));
}

export function isBlocked(task: ClickUpTask): boolean {
  const statusLower = task.status.status.toLowerCase();
  return statusLower.includes("block") || statusLower.includes("bloqueado") || statusLower.includes("impedido");
}

export function isDone(task: ClickUpTask): boolean {
  return task.status.type === "closed" || task.status.type === "done";
}

export function isInProgress(task: ClickUpTask): boolean {
  const s = task.status.status.toLowerCase();
  return s.includes("progress") || s.includes("andamento") || s.includes("doing") || s.includes("review") || s.includes("revisão");
}

export function isPending(task: ClickUpTask): boolean {
  return task.status.type === "open" && !isInProgress(task) && !isBlocked(task);
}

export function formatDueDate(timestamp: string | null): string {
  if (!timestamp) return "—";
  const date = new Date(parseInt(timestamp));
  if (isToday(date)) return "Hoje";
  if (isTomorrow(date)) return "Amanhã";
  if (isPast(date)) return `Atrasado (${formatDistanceToNow(date, { locale: ptBR, addSuffix: true })})`;
  return format(date, "dd/MM/yyyy");
}

export function formatDate(timestamp: string | null): string {
  if (!timestamp) return "—";
  return format(new Date(parseInt(timestamp)), "dd/MM/yyyy HH:mm");
}

export function formatRelativeDate(timestamp: string | null): string {
  if (!timestamp) return "—";
  return formatDistanceToNow(new Date(parseInt(timestamp)), { locale: ptBR, addSuffix: true });
}

export function extractClientName(task: ClickUpTask): string {
  const clientField = task.custom_fields?.find(
    (f) => f.name.toLowerCase() === "client" || f.name.toLowerCase() === "cliente"
  );
  if (clientField?.value) return String(clientField.value);
  const clientTag = task.tags?.find(
    (t) => t.name.toLowerCase().startsWith("cliente:") || t.name.toLowerCase().startsWith("client:")
  );
  if (clientTag) return clientTag.name.split(":")[1]?.trim() || clientTag.name;
  return task.folder?.name || "Sem cliente";
}

export function getTimeProgress(estimate: number | null, spent: number | null): number {
  if (!estimate || estimate === 0) return 0;
  return Math.min(100, Math.round(((spent || 0) / estimate) * 100));
}

export function formatTimeMs(ms: number | null): string {
  if (!ms) return "0h";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours === 0) return `${minutes}min`;
  return `${hours}h ${minutes}min`;
}

export function getUserInitials(user: ClickUpUser): string {
  if (user.initials) return user.initials;
  const parts = user.username.split(" ");
  return parts.map(p => p[0]).slice(0, 2).join("").toUpperCase();
}

export function getUpcomingTasks(tasks: ClickUpTask[], days = 7): ClickUpTask[] {
  const now = Date.now();
  const limit = addDays(new Date(), days).getTime();
  return tasks
    .filter(t => {
      if (!t.due_date || isDone(t)) return false;
      const due = parseInt(t.due_date);
      return due >= now && due <= limit;
    })
    .sort((a, b) => parseInt(a.due_date!) - parseInt(b.due_date!));
}

export function getOverdueTasks(tasks: ClickUpTask[]): ClickUpTask[] {
  return tasks.filter(t => isOverdue(t)).sort((a, b) => parseInt(a.due_date!) - parseInt(b.due_date!));
}

export function computeMetrics(tasks: ClickUpTask[]): DashboardMetrics {
  const metrics: DashboardMetrics = {
    total: tasks.length,
    inProgress: 0, pending: 0, completed: 0, overdue: 0, blocked: 0,
    byStatus: {}, byAssignee: {}, byClient: {},
  };

  for (const task of tasks) {
    // Status counts
    if (isDone(task)) metrics.completed++;
    else if (isBlocked(task)) metrics.blocked++;
    else if (isInProgress(task)) metrics.inProgress++;
    else metrics.pending++;
    if (isOverdue(task)) metrics.overdue++;

    // By status
    const statusKey = task.status.status;
    if (!metrics.byStatus[statusKey]) metrics.byStatus[statusKey] = { count: 0, color: task.status.color };
    metrics.byStatus[statusKey].count++;

    // By assignee
    for (const assignee of task.assignees) {
      const name = assignee.username?.toLowerCase() || '';
      const email = assignee.email?.toLowerCase() || '';
      if (name.includes('amanda cristian') || email === 'iraquiamempreendexpert@gmail.com') {
        continue;
      }

      const key = String(assignee.id);
      if (!metrics.byAssignee[key]) {
        metrics.byAssignee[key] = { user: assignee, total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0 };
      }
      metrics.byAssignee[key].total++;
      if (isDone(task)) metrics.byAssignee[key].completed++;
      else if (isInProgress(task)) metrics.byAssignee[key].inProgress++;
      else metrics.byAssignee[key].pending++;
      if (isOverdue(task)) metrics.byAssignee[key].overdue++;
    }

    // By client
    const client = extractClientName(task);
    const spaceName = task.space?.name || "";
    const responsible = spaceName.replace("TP -", "").replace("TP-", "").trim() || "N/A";

    if (!metrics.byClient[client]) metrics.byClient[client] = { name: client, total: 0, completed: 0, overdue: 0, responsible };
    metrics.byClient[client].total++;
    if (isDone(task)) metrics.byClient[client].completed++;
    if (isOverdue(task)) metrics.byClient[client].overdue++;
  }

  return metrics;
}
