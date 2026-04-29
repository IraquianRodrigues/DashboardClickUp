"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { DashboardMetrics } from "@/types/clickup";

interface StatusChartProps {
  metrics: DashboardMetrics;
}

function CenterLabel({ viewBox, total }: { viewBox?: any; total: number }) {
  if (!viewBox) return null;
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="central" className="fill-white text-3xl font-black">
        {total}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="central" className="fill-white/40 text-[10px] font-bold uppercase tracking-widest">
        TAREFAS
      </text>
    </g>
  );
}

export function StatusChart({ metrics }: StatusChartProps) {
  const data = [
    { name: "Concluído", value: metrics.completed, color: "var(--color-brand-green)" },
    { name: "Em Andamento", value: metrics.inProgress, color: "var(--color-brand-blue)" },
    { name: "Atrasado", value: metrics.overdue, color: "var(--color-brand-orange)" },
    { name: "Impedido", value: metrics.blocked, color: "#ef4444" },
    { name: "Pendente", value: metrics.pending, color: "rgba(255,255,255,0.2)" },
  ].filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Sem dados de status</div>;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand-blue)]/5 blur-[100px] rounded-full pointer-events-none" />
      <h3 className="text-xs font-bold uppercase tracking-widest mb-6 text-foreground/80 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[var(--color-brand-blue)] shadow-[0_0_8px_var(--color-brand-blue)]" />
        Distribuição por Status
      </h3>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={70} outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                animationBegin={0}
                animationDuration={1200}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 0px 8px ${entry.color}60)` }} />
                ))}
                <CenterLabel total={total} />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  padding: "10px 16px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  backdropFilter: "blur(8px)",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
                formatter={(value, name) => {
                  const v = typeof value === 'number' ? value : 0;
                  return [`${v} tarefas (${Math.round((v / total) * 100)}%)`, `${name}`];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom legend */}
        <div className="space-y-3 shrink-0 min-w-[140px]">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2 group">
              <div
                className="w-3 h-3 rounded-sm shrink-0 transition-transform group-hover:scale-125"
                style={{
                  backgroundColor: entry.color,
                  boxShadow: `0 0 6px ${entry.color}50`
                }}
              />
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 group-hover:text-white/80 transition-colors">{entry.name}</p>
                <p className="text-sm font-bold text-white/90">{entry.value} <span className="text-[10px] text-white/30 font-normal">({Math.round((entry.value / total) * 100)}%)</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
