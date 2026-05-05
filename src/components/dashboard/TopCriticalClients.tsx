"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { DashboardMetrics } from "@/types/clickup";
import { AlertTriangle, TrendingDown, ArrowRight } from "lucide-react";
import Link from "next/link";

interface TopCriticalClientsProps {
  metrics: DashboardMetrics;
}

export function TopCriticalClients({ metrics }: TopCriticalClientsProps) {
  const criticalClients = useMemo(() => {
    return Object.values(metrics.byClient)
      .map(c => ({
        ...c,
        completionPct: c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0,
        pending: c.total - c.completed,
      }))
      .filter(c => c.total >= 2) // Only clients with meaningful task count
      .sort((a, b) => {
        // Sort by: most overdue first, then lowest completion %
        if (b.overdue !== a.overdue) return b.overdue - a.overdue;
        return a.completionPct - b.completionPct;
      })
      .slice(0, 3);
  }, [metrics]);

  if (criticalClients.length === 0) return null;

  const hasCritical = criticalClients.some(c => c.overdue > 0 || c.completionPct < 30);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand-orange)]/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[var(--color-brand-orange)]/10 border border-[var(--color-brand-orange)]/20">
            {hasCritical ? (
              <AlertTriangle className="w-4 h-4 text-[var(--color-brand-orange)] drop-shadow-[0_0_8px_rgba(255,102,0,0.8)]" />
            ) : (
              <TrendingDown className="w-4 h-4 text-white/50" />
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/80">Clientes que Precisam de Atenção</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              Top 3 com menor performance
            </p>
          </div>
        </div>
        <Link 
          href="/clients" 
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors"
        >
          Ver todos <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Client list */}
      <div className="space-y-3 relative z-10">
        {criticalClients.map((client, i) => {
          const isUrgent = client.overdue > 0;
          return (
            <div
              key={client.name}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01]",
                isUrgent
                  ? "bg-[var(--color-brand-orange)]/5 border-[var(--color-brand-orange)]/20 hover:border-[var(--color-brand-orange)]/40"
                  : "bg-white/[0.02] border-white/5 hover:border-white/10"
              )}
            >
              {/* Rank */}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-black",
                i === 0 ? "bg-[var(--color-brand-orange)]/20 text-[var(--color-brand-orange)]" :
                i === 1 ? "bg-white/10 text-white/60" :
                "bg-white/5 text-white/40"
              )}>
                {i + 1}
              </div>

              {/* Client info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{client.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {client.completed}/{client.total} tarefas
                  </span>
                  {client.overdue > 0 && (
                    <span className="text-[10px] font-bold text-[var(--color-brand-orange)] uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {client.overdue} atrasada{client.overdue > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Completion gauge */}
              <div className="text-right shrink-0">
                <span className={cn(
                  "text-lg font-black",
                  client.completionPct >= 75 ? "text-[var(--color-brand-green)]" :
                  client.completionPct >= 50 ? "text-[var(--color-brand-blue)]" :
                  client.completionPct >= 25 ? "text-[var(--color-brand-orange)]" :
                  "text-red-400"
                )}>
                  {client.completionPct}%
                </span>
                {/* Mini progress bar */}
                <div className="h-1 w-16 rounded-full bg-white/5 overflow-hidden mt-1 ml-auto">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${client.completionPct}%`,
                      backgroundColor: client.completionPct >= 75 ? "var(--color-brand-green)" :
                        client.completionPct >= 50 ? "var(--color-brand-blue)" :
                        client.completionPct >= 25 ? "var(--color-brand-orange)" : "#ef4444",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
