"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import type { TaskFiltersState } from "@/types/clickup";
import { getPriorityLabel, getPriorityTailwind } from "@/lib/clickup/helpers";
import type { PriorityLevel } from "@/types/clickup";

interface FilterOptions {
  statuses: { name: string; color: string }[];
  priorities: string[];
  assignees: { id: number; username: string; profilePicture: string | null }[];
  clients: string[];
  lists: { id: string; name: string }[];
}

interface TaskFiltersProps {
  filters: TaskFiltersState;
  options: FilterOptions;
  activeCount: number;
  onFilterChange: <K extends keyof TaskFiltersState>(key: K, value: TaskFiltersState[K]) => void;
  onClear: () => void;
}

export function TaskFilters({ filters, options, activeCount, onFilterChange, onClear }: TaskFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar tarefas..." value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="pl-9 rounded-xl border-border/50 bg-card/50" />
        </div>

        {/* Status filter */}
        <Select value={filters.statuses[0] || ""} onValueChange={(v) => onFilterChange("statuses", v ? [v] : [])}>
          <SelectTrigger className="w-[160px] rounded-xl border-border/50 bg-card/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {options.statuses.map((s) => (
              <SelectItem key={s.name} value={s.name}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="capitalize">{s.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority filter */}
        <Select value={filters.priorities[0] || ""} onValueChange={(v) => onFilterChange("priorities", v ? [v] : [])}>
          <SelectTrigger className="w-[160px] rounded-xl border-border/50 bg-card/50">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {options.priorities.map((p) => (
              <SelectItem key={p} value={p}>
                <Badge variant="outline" className={getPriorityTailwind(p as PriorityLevel)}>
                  {getPriorityLabel(p as PriorityLevel)}
                </Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Assignee filter */}
        <Select value={filters.assignees[0]?.toString() || ""} onValueChange={(v) => onFilterChange("assignees", v ? [parseInt(v)] : [])}>
          <SelectTrigger className="w-[160px] rounded-xl border-border/50 bg-card/50">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {options.assignees.map((a) => (
              <SelectItem key={a.id} value={a.id.toString()}>{a.username}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Client filter */}
        <Select value={filters.clients[0] || ""} onValueChange={(v) => onFilterChange("clients", v ? [v] : [])}>
          <SelectTrigger className="w-[160px] rounded-xl border-border/50 bg-card/50">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {options.clients.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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
