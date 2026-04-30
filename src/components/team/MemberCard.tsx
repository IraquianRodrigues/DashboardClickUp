"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NumberTicker } from "@/components/ui/number-ticker";
import { BorderBeam } from "@/components/ui/border-beam";
import { getUserInitials } from "@/lib/clickup/helpers";
import type { ClickUpUser } from "@/types/clickup";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { AlertTriangle, Mail } from "lucide-react";

interface MemberCardProps {
  user: ClickUpUser;
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
}

const OVERLOAD_THRESHOLD = 5;

export const MemberCard = React.memo(function MemberCard({ user, total, completed, inProgress, pending, overdue }: MemberCardProps) {
  const router = useRouter();
  const hasCritical = overdue > 0;
  const completion = total > 0 ? Math.round((completed / total) * 100) : 0;
  const activeTasks = total - completed;
  const isOverloaded = activeTasks > OVERLOAD_THRESHOLD;

  const handleViewTasks = () => {
    try { sessionStorage.setItem("team-filter-member", String(user.id)); } catch {}
    router.push("/tasks");
  };

  return (
    <div
      role="article"
      aria-label={`${user.username} - ${total} tarefas`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") handleViewTasks(); }}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-sm p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer",
        hasCritical ? "border-red-500/30" : "border-border/50"
      )}
      onClick={handleViewTasks}
    >
      {hasCritical && <BorderBeam size={100} duration={10} colorFrom="#ef4444" colorTo="#f97316" />}

      <div className="flex items-center gap-3 mb-4">
        <Avatar className="w-12 h-12 border-2 border-border">
          {user.profilePicture && (
            <AvatarImage src={user.profilePicture} alt={user.username} />
          )}
          <AvatarFallback className="text-base font-bold" style={{ backgroundColor: user.color || "#6b7280", color: "#fff" }}>
            {getUserInitials(user)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{user.username}</h3>
            {isOverloaded && (
              <Badge variant="outline" className="shrink-0 bg-red-500/10 text-red-400 border-red-500/20 text-[10px] px-1.5 py-0">
                Sobrecarga
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatBox label="Total" value={total} color="text-foreground" />
        <StatBox label="Concluidas" value={completed} color="text-emerald-400" />
        <StatBox label="Em andamento" value={inProgress} color="text-blue-400" />
        <StatBox label="Pendentes" value={pending} color="text-amber-400" />
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Taxa de conclusao</span>
        <span className={cn(
          "text-xs font-bold",
          completion === 100 ? "text-emerald-400" : completion >= 50 ? "text-blue-400" : "text-amber-400"
        )}>
          {completion}%
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Carga de trabalho</span>
          <span className="text-muted-foreground">{activeTasks} ativas</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden flex" role="progressbar" aria-valuenow={activeTasks} aria-valuemin={0} aria-valuemax={total}>
          {inProgress > 0 && <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(inProgress / Math.max(total, 1)) * 100}%` }} />}
          {pending > 0 && <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${(pending / Math.max(total, 1)) * 100}%` }} />}
          {overdue > 0 && <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${(overdue / Math.max(total, 1)) * 100}%` }} />}
        </div>
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Em andamento</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Pendentes</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Atrasadas</span>
        </div>
      </div>

      {overdue > 0 && (
        <div className="mt-3">
          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 rounded-lg text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {overdue} atrasada{overdue > 1 ? "s" : ""}
          </Badge>
        </div>
      )}
    </div>
  );
});

const StatBox = React.memo(function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-accent/20 border border-border/30">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-bold", color)}><NumberTicker value={value} className={color} /></p>
    </div>
  );
});
