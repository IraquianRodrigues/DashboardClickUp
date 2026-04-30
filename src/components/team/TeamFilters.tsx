"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, ArrowUpDown } from "lucide-react";
import type { MemberSortKey } from "@/hooks/useClickUpMembers";

interface TeamFiltersProps {
  search: string;
  sortKey: MemberSortKey;
  sortOrder: "asc" | "desc";
  onSearchChange: (value: string) => void;
  onSortKeyChange: (value: MemberSortKey) => void;
  onSortOrderChange: (value: "asc" | "desc") => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function TeamFilters({
  search,
  sortKey,
  sortOrder,
  onSearchChange,
  onSortKeyChange,
  onSortOrderChange,
  onClear,
  hasActiveFilters,
}: TeamFiltersProps) {
  const toggleSortOrder = () => {
    onSortOrderChange(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar membro..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 rounded-xl border-border/50 bg-card/50"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Select value={sortKey} onValueChange={(v) => onSortKeyChange(v as MemberSortKey)}>
            <SelectTrigger className="w-[180px] rounded-xl border-border/50 bg-card/50">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="total">Total de tarefas</SelectItem>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="completed">Concluidas</SelectItem>
              <SelectItem value="overdue">Atrasadas</SelectItem>
              <SelectItem value="completion">Taxa de conclusao</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortOrder}
            className="rounded-xl border-border/50 h-9 gap-1.5"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="text-xs hidden sm:inline">{sortOrder === "desc" ? "Decrescente" : "Crescente"}</span>
          </Button>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear} className="rounded-xl text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4 mr-1" /> Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
