"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import { getPriorityLabel } from "@/lib/clickup/helpers";
import type { PriorityLevel } from "@/types/clickup";
import type { DueDateFilter, ExtendedTaskFiltersState } from "@/hooks/useTaskFilters";
import { cn } from "@/lib/utils";

interface FilterOptions {
  statuses: { name: string; color: string }[];
  priorities: string[];
  assignees: { id: number; username: string; profilePicture: string | null }[];
  clients: string[];
  lists: { id: string; name: string }[];
}

interface TaskFiltersProps {
  filters: ExtendedTaskFiltersState;
  options: FilterOptions;
  activeCount: number;
  onFilterChange: <K extends keyof ExtendedTaskFiltersState>(key: K, value: ExtendedTaskFiltersState[K]) => void;
  onClear: () => void;
}

const DUE_DATE_OPTIONS: { value: DueDateFilter; label: string }[] = [
  { value: "all", label: "Todas as datas" },
  { value: "overdue", label: "Atrasadas" },
  { value: "today", label: "Hoje" },
  { value: "tomorrow", label: "Amanhã" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mês" },
  { value: "nodate", label: "Sem data" },
];

function SelectWrapper({
  label,
  value,
  onValueChange,
  isActive,
  children,
  className,
}: {
  label: string;
  value: string;
  onValueChange: (v: string | null) => void;
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="relative">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className={cn(
            "w-[160px] rounded-xl border-border/50 bg-card/50",
            isActive && "border-[var(--color-brand-blue)]/40 bg-[var(--color-brand-blue)]/5",
            className,
          )}
        >
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
      {isActive && (
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--color-brand-blue)] shadow-[0_0_6px_rgba(0,102,255,0.8)]" />
      )}
    </div>
  );
}

export function TaskFilters({ filters, options, activeCount, onFilterChange, onClear }: TaskFiltersProps) {
  const assigneeMap = useMemo(() => {
    const map = new Map<number, string>();
    options.assignees.forEach((a) => map.set(a.id, a.username));
    return map;
  }, [options.assignees]);

  const selectedAssigneeName = useMemo(() => {
    if (filters.assignees.length === 0) return "";
    return filters.assignees
      .map((id) => assigneeMap.get(id))
      .filter(Boolean)
      .join(", ");
  }, [filters.assignees, assigneeMap]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cliente ou descrição..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="pl-9 rounded-xl border-border/50 bg-card/50"
          />
        </div>

        {/* Status filter */}
        <SelectWrapper
          label="Status"
          value={filters.statuses[0] || ""}
          onValueChange={(v) => onFilterChange("statuses", v && v !== "all" ? [v] : [])}
          isActive={filters.statuses.length > 0}
        >
          <SelectItem value="all">Todos</SelectItem>
          {options.statuses.map((s) => (
            <SelectItem key={s.name} value={s.name}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="capitalize">{s.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectWrapper>

        {/* Priority filter */}
        <SelectWrapper
          label="Prioridade"
          value={filters.priorities[0] || ""}
          onValueChange={(v) => onFilterChange("priorities", v && v !== "all" ? [v] : [])}
          isActive={filters.priorities.length > 0}
        >
          <SelectItem value="all">Todas</SelectItem>
          {options.priorities.map((p) => (
            <SelectItem key={p} value={p}>
              {getPriorityLabel(p as PriorityLevel)}
            </SelectItem>
          ))}
        </SelectWrapper>

        {/* Assignee filter */}
        <SelectWrapper
          label="Responsável"
          value={selectedAssigneeName || ""}
          onValueChange={(v) => {
            if (!v || v === "all") {
              onFilterChange("assignees", []);
            } else {
              const assignee = options.assignees.find((a) => a.username === v);
              if (assignee) onFilterChange("assignees", [assignee.id]);
            }
          }}
          isActive={filters.assignees.length > 0}
        >
          <SelectItem value="all">Todos</SelectItem>
          {options.assignees.map((a) => (
            <SelectItem key={a.id} value={a.username}>
              {a.username}
            </SelectItem>
          ))}
        </SelectWrapper>

        {/* Client filter */}
        <SelectWrapper
          label="Cliente"
          value={filters.clients[0] || ""}
          onValueChange={(v) => onFilterChange("clients", v && v !== "all" ? [v] : [])}
          isActive={filters.clients.length > 0}
        >
          <SelectItem value="all">Todos</SelectItem>
          {options.clients.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectWrapper>

        {/* Due date filter */}
        <SelectWrapper
          label="Vencimento"
          value={filters.dueDate}
          onValueChange={(v) => onFilterChange("dueDate", (v || "all") as DueDateFilter)}
          isActive={filters.dueDate !== "all"}
        >
          {DUE_DATE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectWrapper>

        {/* Clear button */}
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="rounded-xl text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4 mr-1" /> Limpar ({activeCount})
          </Button>
        )}
      </div>

      {activeCount > 0 && (
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{activeCount} filtro{activeCount > 1 ? "s" : ""} ativo{activeCount > 1 ? "s" : ""}</span>
        </div>
      )}
    </div>
  );
}
