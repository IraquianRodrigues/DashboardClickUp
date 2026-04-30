"use client";

import { cn } from "@/lib/utils";
import { NumberTicker } from "@/components/ui/number-ticker";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: "violet" | "blue" | "amber" | "emerald" | "red" | "gray" | "purple";
  showBeam?: boolean; // Kept for compatibility but ignored
  subtitle?: string;
}

const colorMap = {
  violet: { bg: "bg-gradient-to-br from-[var(--color-brand-blue)]/10 to-transparent", border: "border-[var(--color-brand-blue)]/30", icon: "text-[var(--color-brand-blue)] drop-shadow-[0_0_8px_rgba(0,102,255,0.8)]", text: "text-white drop-shadow-[0_0_12px_rgba(0,102,255,0.3)]", title: "text-[var(--color-brand-blue)]" },
  blue: { bg: "bg-gradient-to-br from-[var(--color-brand-blue)]/20 to-transparent", border: "border-[var(--color-brand-blue)]/50", icon: "text-[var(--color-brand-blue)] drop-shadow-[0_0_8px_rgba(0,102,255,0.8)]", text: "text-white drop-shadow-[0_0_12px_rgba(0,102,255,0.5)]", title: "text-white/70" },
  amber: { bg: "bg-gradient-to-br from-[var(--color-brand-orange)]/10 to-transparent", border: "border-[var(--color-brand-orange)]/30", icon: "text-[var(--color-brand-orange)] drop-shadow-[0_0_8px_rgba(255,102,0,0.8)]", text: "text-white drop-shadow-[0_0_12px_rgba(255,102,0,0.3)]", title: "text-[var(--color-brand-orange)]" },
  emerald: { bg: "bg-gradient-to-br from-[var(--color-brand-green)]/10 to-transparent", border: "border-[var(--color-brand-green)]/30", icon: "text-[var(--color-brand-green)] drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]", text: "text-white drop-shadow-[0_0_12px_rgba(0,255,0,0.3)]", title: "text-[var(--color-brand-green)]" },
  red: { bg: "bg-gradient-to-br from-[var(--color-brand-orange)]/20 to-transparent", border: "border-[var(--color-brand-orange)]/50 shadow-[0_0_20px_rgba(255,102,0,0.15)]", icon: "text-[var(--color-brand-orange)] drop-shadow-[0_0_8px_rgba(255,102,0,1)]", text: "text-white drop-shadow-[0_0_12px_rgba(255,102,0,0.5)]", title: "text-white/70" },
  gray: { bg: "bg-white/5", border: "border-white/10", icon: "text-white/50", text: "text-white/90", title: "text-white/50" },
  purple: { bg: "bg-gradient-to-br from-purple-500/10 to-transparent", border: "border-purple-500/30", icon: "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]", text: "text-white drop-shadow-[0_0_12px_rgba(168,85,247,0.3)]", title: "text-purple-400" },
};

export function MetricCard({ title, value, icon: Icon, color, subtitle }: MetricCardProps) {
  const colors = colorMap[color] || colorMap["gray"]; // Fallback to gray

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]",
      colors.bg, colors.border
    )}>
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <p className={cn("text-xs font-bold uppercase tracking-widest", colors.title)}>{title}</p>
          <div className={cn("text-4xl font-black tracking-tighter", colors.text)}>
            {typeof value === 'number' ? (
              <NumberTicker value={value} className={colors.text} />
            ) : (
              <span>{value}</span>
            )}
          </div>
          {subtitle && <p className="text-[10px] uppercase text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className={cn("p-2.5 rounded-xl bg-black/20 border border-white/5 backdrop-blur-md", colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {/* Neo-Premium Glow Effect */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-current opacity-10 blur-[50px] rounded-full pointer-events-none" style={{ color: "inherit" }} />
    </div>
  );
}
