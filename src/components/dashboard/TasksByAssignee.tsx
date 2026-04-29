"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from "recharts";
import type { DashboardMetrics } from "@/types/clickup";

interface TasksByAssigneeProps {
  metrics: DashboardMetrics;
}

function CustomLabel(props: any) {
  const { x, y, width, height, value } = props;
  if (!value || value === 0) return null;
  return (
    <text
      x={x + width + 6}
      y={y + height / 2}
      textAnchor="start"
      dominantBaseline="central"
      className="text-[10px] font-bold fill-white/40"
    >
      {value}
    </text>
  );
}

export function TasksByAssignee({ metrics }: TasksByAssigneeProps) {
  const data = Object.values(metrics.byAssignee)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map((item) => ({
      name: item.user.username.split(" ")[0],
      completed: item.completed,
      inProgress: item.inProgress,
      pending: item.pending,
      overdue: item.overdue,
      total: item.total,
    }));

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Sem dados de assignees</div>;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-6">
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--color-brand-green)]/5 blur-[100px] rounded-full pointer-events-none" />
      <h3 className="text-xs font-bold uppercase tracking-widest mb-6 text-foreground/80 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[var(--color-brand-green)] shadow-[0_0_8px_var(--color-brand-green)]" />
        Tarefas por Membro
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.15} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
          <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: "#fff", fontWeight: 600 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
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
          />
          <Bar dataKey="completed" stackId="a" fill="var(--color-brand-green)" name="Concluídas" radius={[0, 0, 0, 0]}>
            <LabelList dataKey="completed" content={<CustomLabel />} />
          </Bar>
          <Bar dataKey="inProgress" stackId="a" fill="var(--color-brand-blue)" name="Em andamento" />
          <Bar dataKey="pending" stackId="a" fill="rgba(255,255,255,0.12)" name="Pendentes" />
          <Bar dataKey="overdue" stackId="a" fill="var(--color-brand-orange)" radius={[0, 6, 6, 0]} name="Atrasadas" />
        </BarChart>
      </ResponsiveContainer>

      {/* Inline legend */}
      <div className="flex items-center justify-center gap-5 mt-4">
        {[
          { label: "Concluídas", color: "var(--color-brand-green)" },
          { label: "Em andamento", color: "var(--color-brand-blue)" },
          { label: "Pendentes", color: "rgba(255,255,255,0.2)" },
          { label: "Atrasadas", color: "var(--color-brand-orange)" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
