"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { NumberTicker } from "@/components/ui/number-ticker";
import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";
import type { ClickUpUser } from "@/types/clickup";
import { getUserInitials } from "@/lib/clickup/helpers";

interface ClientCardProps {
  name: string;
  total: number;
  completed: number;
  overdue: number;
  responsible?: string;
}

export function ClientCard({ name, total, completed, overdue, responsible }: ClientCardProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const hasCritical = overdue > 0;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
      hasCritical ? "border-[var(--color-brand-orange)]/30 hover:shadow-[0_0_20px_rgba(255,102,0,0.2)]" : "border-white/5 hover:border-white/10"
    )}>
      {hasCritical && <BorderBeam size={100} duration={10} colorFrom="var(--color-brand-orange)" colorTo="var(--color-brand-orange)" />}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-blue)]/10 flex items-center justify-center border border-[var(--color-brand-blue)]/30">
            <span className="text-lg font-bold text-[var(--color-brand-blue)] drop-shadow-[0_0_8px_rgba(0,102,255,0.8)]">{name[0]?.toUpperCase()}</span>
          </div>
          <div>
            <h3 className="font-semibold">{name}</h3>
            <p className="text-xs text-muted-foreground"><NumberTicker value={total} className="text-xs text-muted-foreground" /> tarefas</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn("text-2xl font-bold", percentage === 100 ? "text-[var(--color-brand-green)] drop-shadow-[0_0_8px_rgba(0,255,0,0.5)]" : "text-white")}>{percentage}%</span>
          {responsible && responsible !== "N/A" && (
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]/10 px-2 py-0.5 rounded-full border border-[var(--color-brand-blue)]/20">
              {responsible}
            </div>
          )}
        </div>
      </div>

      <Progress value={percentage} className="h-2 mb-3" />

      <div className="flex items-center gap-3 text-xs">
        <Badge variant="outline" className="bg-[var(--color-brand-green)]/10 text-[var(--color-brand-green)] border-[var(--color-brand-green)]/20 rounded-lg">{completed} concluídas</Badge>
        <Badge variant="outline" className="bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] border-[var(--color-brand-blue)]/20 rounded-lg">{total - completed} pendentes</Badge>
        {overdue > 0 && <Badge variant="outline" className="bg-[var(--color-brand-orange)]/10 text-[var(--color-brand-orange)] border-[var(--color-brand-orange)]/20 rounded-lg">{overdue} atrasadas</Badge>}
      </div>
    </div>
  );
}
