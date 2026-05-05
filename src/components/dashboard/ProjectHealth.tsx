"use client";

import { cn } from "@/lib/utils";
import type { DashboardMetrics } from "@/types/clickup";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";

interface ProjectHealthProps {
  metrics: DashboardMetrics;
}

function calculateHealthScore(metrics: DashboardMetrics): {
  score: number;
  level: "critical" | "warning" | "good" | "excellent";
  label: string;
  factors: { name: string; value: number; weight: string; impact: "positive" | "negative" | "neutral" }[];
} {
  const total = metrics.total || 1;

  // Factor 1: Completion rate (0-40 points)
  const completionRate = metrics.completed / total;
  const completionScore = Math.round(completionRate * 40);

  // Factor 2: Overdue penalty (0-30 points, inverted)
  const overdueRate = metrics.overdue / total;
  const overdueScore = Math.round(Math.max(0, 1 - overdueRate * 3) * 30);

  // Factor 3: Active work ratio (0-20 points) - tasks in progress
  const activeRate = metrics.inProgress / Math.max(1, total - metrics.completed);
  const activeScore = Math.round(Math.min(1, activeRate * 2) * 20);

  // Factor 4: Blocked ratio penalty (0-10 points, inverted)
  const blockedRate = metrics.blocked / total;
  const blockedScore = Math.round(Math.max(0, 1 - blockedRate * 5) * 10);

  const score = Math.min(100, completionScore + overdueScore + activeScore + blockedScore);

  const level = score >= 80 ? "excellent" : score >= 60 ? "good" : score >= 40 ? "warning" : "critical";
  const label = score >= 80 ? "Excelente" : score >= 60 ? "Bom" : score >= 40 ? "Atenção" : "Crítico";

  const factors = [
    {
      name: "Conclusão",
      value: Math.round(completionRate * 100),
      weight: `${completionScore}/40`,
      impact: completionRate >= 0.6 ? "positive" as const : completionRate >= 0.3 ? "neutral" as const : "negative" as const,
    },
    {
      name: "Sem atrasos",
      value: Math.round((1 - overdueRate) * 100),
      weight: `${overdueScore}/30`,
      impact: overdueRate <= 0.05 ? "positive" as const : overdueRate <= 0.15 ? "neutral" as const : "negative" as const,
    },
    {
      name: "Trabalho ativo",
      value: Math.round(activeRate * 100),
      weight: `${activeScore}/20`,
      impact: activeRate >= 0.3 ? "positive" as const : activeRate >= 0.1 ? "neutral" as const : "negative" as const,
    },
    {
      name: "Desbloqueado",
      value: Math.round((1 - blockedRate) * 100),
      weight: `${blockedScore}/10`,
      impact: blockedRate <= 0.02 ? "positive" as const : blockedRate <= 0.1 ? "neutral" as const : "negative" as const,
    },
  ];

  return { score, level, label, factors };
}

const levelConfig = {
  excellent: {
    color: "var(--color-brand-green)",
    glow: "rgba(0,255,0,0.3)",
    bg: "from-[var(--color-brand-green)]/10 to-transparent",
    border: "border-[var(--color-brand-green)]/30",
    icon: ShieldCheck,
    textColor: "text-[var(--color-brand-green)]",
  },
  good: {
    color: "var(--color-brand-blue)",
    glow: "rgba(0,102,255,0.3)",
    bg: "from-[var(--color-brand-blue)]/10 to-transparent",
    border: "border-[var(--color-brand-blue)]/30",
    icon: CheckCircle2,
    textColor: "text-[var(--color-brand-blue)]",
  },
  warning: {
    color: "var(--color-brand-orange)",
    glow: "rgba(255,102,0,0.3)",
    bg: "from-[var(--color-brand-orange)]/10 to-transparent",
    border: "border-[var(--color-brand-orange)]/30",
    icon: TrendingDown,
    textColor: "text-[var(--color-brand-orange)]",
  },
  critical: {
    color: "#ef4444",
    glow: "rgba(239,68,68,0.3)",
    bg: "from-red-500/10 to-transparent",
    border: "border-red-500/30",
    icon: AlertTriangle,
    textColor: "text-red-400",
  },
};

export function ProjectHealth({ metrics }: ProjectHealthProps) {
  const { score, level, label, factors } = calculateHealthScore(metrics);
  const config = levelConfig[level];
  const Icon = config.icon;

  // SVG gauge calculations
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border bg-gradient-to-b backdrop-blur-xl p-6",
      config.bg, config.border
    )}>
      <div className="absolute top-0 right-0 w-64 h-64 blur-[120px] rounded-full pointer-events-none opacity-20" style={{ backgroundColor: config.color }} />

      {/* Header */}
      <div className="flex items-center gap-2 mb-5 relative z-10">
        <div className="p-2 rounded-xl" style={{ backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)` }}>
          <Activity className="w-4 h-4" style={{ color: config.color, filter: `drop-shadow(0 0 8px ${config.glow})` }} />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/80">Saúde do Projeto</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
            Índice composto de performance
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 relative z-10">
        {/* Gauge */}
        <div className="relative shrink-0">
          <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
            {/* Background track */}
            <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
            {/* Progress arc */}
            <circle
              cx="65" cy="65" r={radius}
              fill="none"
              stroke={config.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-out"
              style={{ filter: `drop-shadow(0 0 6px ${config.glow})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black tracking-tighter" style={{ color: config.color, filter: `drop-shadow(0 0 12px ${config.glow})` }}>
              <NumberTicker value={score} className="inline" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{label}</span>
          </div>
        </div>

        {/* Factors */}
        <div className="flex-1 space-y-2.5">
          {factors.map((factor) => (
            <div key={factor.name} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  {factor.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "text-xs font-bold",
                    factor.impact === "positive" ? "text-[var(--color-brand-green)]" :
                    factor.impact === "negative" ? "text-[var(--color-brand-orange)]" :
                    "text-white/60"
                  )}>
                    {factor.value}%
                  </span>
                  <span className="text-[9px] text-muted-foreground/50">{factor.weight}</span>
                </div>
              </div>
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.min(100, factor.value)}%`,
                    backgroundColor: factor.impact === "positive" ? "var(--color-brand-green)" :
                      factor.impact === "negative" ? "var(--color-brand-orange)" : "var(--color-brand-blue)",
                    boxShadow: `0 0 6px ${factor.impact === "positive" ? "rgba(0,255,0,0.3)" :
                      factor.impact === "negative" ? "rgba(255,102,0,0.3)" : "rgba(0,102,255,0.3)"}`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
