"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NumberTicker } from "@/components/ui/number-ticker";
import { BorderBeam } from "@/components/ui/border-beam";
import { getUserInitials } from "@/lib/clickup/helpers";
import type { ClickUpUser } from "@/types/clickup";
import { cn } from "@/lib/utils";

interface MemberCardProps {
  user: ClickUpUser;
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
}

export function MemberCard({ user, total, completed, inProgress, pending, overdue }: MemberCardProps) {
  const hasCritical = overdue > 0;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-sm p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
      hasCritical ? "border-red-500/30" : "border-border/50"
    )}>
      {hasCritical && <BorderBeam size={100} duration={10} colorFrom="#ef4444" colorTo="#f97316" />}

      <div className="flex items-center gap-3 mb-4">
        <Avatar className="w-12 h-12 border-2 border-border">
          <AvatarFallback className="text-base font-bold" style={{ backgroundColor: user.color || "#6b7280", color: "#fff" }}>
            {getUserInitials(user)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{user.username}</h3>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatBox label="Total" value={total} color="text-foreground" />
        <StatBox label="Concluídas" value={completed} color="text-emerald-400" />
        <StatBox label="Em andamento" value={inProgress} color="text-blue-400" />
        <StatBox label="Pendentes" value={pending} color="text-amber-400" />
      </div>

      {/* Workload bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Carga de trabalho</span>
          <span className="text-muted-foreground">{total - completed} ativas</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden flex">
          {inProgress > 0 && <div className="h-full bg-blue-500" style={{ width: `${(inProgress / Math.max(total, 1)) * 100}%` }} />}
          {pending > 0 && <div className="h-full bg-amber-500" style={{ width: `${(pending / Math.max(total, 1)) * 100}%` }} />}
          {overdue > 0 && <div className="h-full bg-red-500" style={{ width: `${(overdue / Math.max(total, 1)) * 100}%` }} />}
        </div>
      </div>

      {overdue > 0 && (
        <div className="mt-3">
          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 rounded-lg text-xs">⚠ {overdue} atrasada{overdue > 1 ? "s" : ""}</Badge>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-accent/20 border border-border/30">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-bold", color)}><NumberTicker value={value} className={color} /></p>
    </div>
  );
}
