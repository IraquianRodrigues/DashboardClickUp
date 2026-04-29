"use client";

import { useMemo, useState } from "react";
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, flexRender, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from "lucide-react";
import type { ClickUpTask } from "@/types/clickup";
import { formatDueDate, formatDate, getPriorityLevel, getPriorityLabel, getPriorityTailwind, extractClientName, isOverdue, getUserInitials } from "@/lib/clickup/helpers";
import { cn } from "@/lib/utils";

interface TaskTableProps {
  tasks: ClickUpTask[];
  onTaskClick: (taskId: string) => void;
}

export function TaskTable({ tasks, onTaskClick }: TaskTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<ClickUpTask>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting()} className="-ml-3 hover:bg-transparent">
          Tarefa <ArrowUpDown className="ml-1 w-3 h-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <p className="font-medium truncate">{row.original.name}</p>
          <p className="text-xs text-muted-foreground truncate">{row.original.list.name}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="rounded-lg border" style={{ borderColor: row.original.status.color + "50", backgroundColor: row.original.status.color + "15", color: row.original.status.color }}>
          {row.original.status.status}
        </Badge>
      ),
      sortingFn: (a, b) => a.original.status.status.localeCompare(b.original.status.status),
    },
    {
      accessorKey: "priority",
      header: "Prioridade",
      cell: ({ row }) => {
        const level = getPriorityLevel(row.original.priority);
        return <Badge variant="outline" className={cn("rounded-lg", getPriorityTailwind(level))}>{getPriorityLabel(level)}</Badge>;
      },
      sortingFn: (a, b) => {
        const pa = parseInt(a.original.priority?.priority || "5");
        const pb = parseInt(b.original.priority?.priority || "5");
        return pa - pb;
      },
    },
    {
      accessorKey: "assignees",
      header: "Responsáveis",
      cell: ({ row }) => (
        <div className="flex -space-x-2">
          {row.original.assignees.slice(0, 3).map((a) => (
            <Avatar key={a.id} className="w-7 h-7 border-2 border-background">
              <AvatarFallback className="text-[10px] font-medium" style={{ backgroundColor: a.color || "#6b7280", color: "#fff" }}>
                {getUserInitials(a)}
              </AvatarFallback>
            </Avatar>
          ))}
          {row.original.assignees.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium border-2 border-background">
              +{row.original.assignees.length - 3}
            </div>
          )}
        </div>
      ),
      enableSorting: false,
    },
    {
      id: "client",
      header: "Cliente",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{extractClientName(row.original)}</span>,
    },
    {
      accessorKey: "due_date",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting()} className="-ml-3 hover:bg-transparent">
          Prazo <ArrowUpDown className="ml-1 w-3 h-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const overdue = isOverdue(row.original);
        return <span className={cn("text-sm", overdue ? "text-[var(--color-brand-orange)] font-semibold" : "text-muted-foreground")}>{formatDueDate(row.original.due_date)}</span>;
      },
      sortingFn: (a, b) => {
        const da = parseInt(a.original.due_date || "0");
        const db = parseInt(b.original.due_date || "0");
        return da - db;
      },
    },
  ], []);

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="border-border/50 hover:bg-transparent">
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">Nenhuma tarefa encontrada</TableCell></TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const overdue = isOverdue(row.original);
                return (
                  <TableRow key={row.id} onClick={() => onTaskClick(row.original.id)}
                    className={cn(
                      "cursor-pointer border-border/30 transition-colors",
                      overdue
                        ? "bg-[var(--color-brand-orange)]/[0.03] hover:bg-[var(--color-brand-orange)]/[0.08] border-l-2 border-l-[var(--color-brand-orange)]/50"
                        : "hover:bg-accent/30"
                    )}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {tasks.length} tarefa{tasks.length !== 1 ? "s" : ""} • Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Linhas:</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger className="h-8 w-[70px] rounded-lg border-border/50 bg-card/50 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[15, 20, 30, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
