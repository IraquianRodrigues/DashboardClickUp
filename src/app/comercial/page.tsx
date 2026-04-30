"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { BlurFade } from "@/components/ui/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertCircle, ChevronDown, Filter } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface GHLDashboardData {
  opportunities: {
    total: number;
    byPipeline: Record<string, { total: number; value: number; won: number; wonValue: number; open: number; openValue: number; stages: Record<string, { count: number; value: number; type: string }>; conversionRate: number }>;
    totalPipelineValue: number;
    wonValue: number;
    openValue: number;
  };
  errors?: string[];
}

const COLORS = {
  blue: "#3b82f6", // Open
  cyan: "#06b6d4", // Won
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a855f7",
  emerald: "#10b981",
  slate: "#334155"
};

export default function ComercialPage() {
  const [data, setData] = useState<GHLDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<string>("Todos os pipelines");

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const res = await fetch("/api/ghl/dashboard");
      if (!res.ok) throw new Error("Falha ao carregar dados do GoHighLevel");
      const json = await res.json();
      setData(json);
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value: number) => {
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
    return `R$ ${value}`;
  };

  const pipelines = useMemo(() => {
    if (!data) return [];
    return ["Todos os pipelines", ...Object.keys(data.opportunities.byPipeline)];
  }, [data]);

  const stats = useMemo(() => {
    if (!data) return null;
    
    let openCount = 0;
    let wonCount = 0;
    let openVal = 0;
    let wonVal = 0;

    if (selectedPipeline === "Todos os pipelines") {
      openVal = data.opportunities.openValue;
      wonVal = data.opportunities.wonValue;
      openCount = data.opportunities.total - Object.values(data.opportunities.byPipeline).reduce((acc, p) => acc + p.won, 0);
      wonCount = Object.values(data.opportunities.byPipeline).reduce((acc, p) => acc + p.won, 0);
    } else {
      const pipe = data.opportunities.byPipeline[selectedPipeline];
      if (pipe) {
        wonCount = pipe.won;
        openCount = pipe.total - pipe.won;
        wonVal = pipe.wonValue;
        openVal = pipe.value - pipe.wonValue; // Approximated if not strictly provided
      }
    }

    const totalCount = openCount + wonCount;
    const totalVal = openVal + wonVal;
    const convRate = totalCount > 0 ? ((wonCount / totalCount) * 100).toFixed(2) : "0.00";

    return {
      openCount, wonCount, totalCount,
      openVal, wonVal, totalVal,
      convRate
    };
  }, [data, selectedPipeline]);

  const funnelData = useMemo(() => {
    if (!data || selectedPipeline === "Todos os pipelines") return [];
    const pipe = data.opportunities.byPipeline[selectedPipeline];
    if (!pipe) return [];

    let cumulativeCount = pipe.total;
    const stages = Object.entries(pipe.stages).map(([name, stage]) => {
      const currentCount = stage.count;
      const currentCumulative = cumulativeCount;
      cumulativeCount -= currentCount; // Subtract for next stages if ordered

      return {
        name,
        value: stage.value,
        count: currentCount,
        cumulative: currentCumulative,
        conversion: pipe.total > 0 ? Math.round((currentCumulative / pipe.total) * 100) : 0,
      };
    });

    // Return exact order from API (which now preserves GHL pipeline stages order)
    return stages;
  }, [data, selectedPipeline]);

  if (isLoading && !data) {
    return (
      <div className="min-h-screen dashboard-grid-bg">
        <Header title="Painel Comercial" subtitle="GoHighLevel Dashboard" lastUpdated={0} isFetching={false} onRefresh={() => {}} />
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl col-span-1" />
          <Skeleton className="h-64 rounded-2xl col-span-1" />
          <Skeleton className="h-64 rounded-2xl col-span-1" />
          <Skeleton className="h-[500px] rounded-2xl col-span-1 md:col-span-3" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen dashboard-grid-bg">
        <Header title="Painel Comercial" subtitle="GoHighLevel Dashboard" lastUpdated={0} isFetching={false} onRefresh={() => {}} />
        <div className="p-6">
          <EmptyState icon={AlertCircle} title="Erro ao carregar dados" description={error} action={<button onClick={fetchData} className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-bold">Tentar novamente</button>} />
        </div>
      </div>
    );
  }

  if (!data || !stats) return null;

  return (
    <div className="min-h-screen dashboard-grid-bg text-white relative">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[var(--color-brand-blue)]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[var(--color-brand-green)]/5 blur-[120px] rounded-full pointer-events-none" />

      <Header title="Painel Comercial" subtitle="Empreende Xpert - GoHighLevel" lastUpdated={lastUpdated} isFetching={isRefreshing} onRefresh={fetchData} />

      <div className="p-6 max-w-[1600px] mx-auto space-y-6 relative z-10">
        {/* Top 3 Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Status de Oportunidade */}
          <BlurFade delay={0.1}>
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-5 h-72 flex flex-col group transition-all duration-300 hover:bg-white/[0.07]">
              <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/80 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-brand-blue)] shadow-[0_0_8px_rgba(0,102,255,0.8)]" />
                  Status de Oportunidade
                </h3>
                <div className="relative">
                  <select 
                    value={selectedPipeline}
                    onChange={(e) => setSelectedPipeline(e.target.value)}
                    className="appearance-none pr-7 pl-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] uppercase tracking-wider text-muted-foreground outline-none hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    {pipelines.map(p => <option key={p} value={p} className="bg-zinc-900">{p}</option>)}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1 flex items-center justify-between relative z-10">
                <div className="w-1/2 h-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[{ name: "Aberto", value: stats.openCount }, { name: "Ganho", value: stats.wonCount }]} innerRadius="75%" outerRadius="95%" dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                        <Cell fill="#3b82f6" />
                        <Cell fill="#10b981" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                    <span className="text-3xl font-black tracking-tighter text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">{stats.totalCount}</span>
                  </div>
                </div>
                <div className="w-1/2 pl-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(0,102,255,0.5)]" /> 
                        Aberto
                      </div>
                      <span className="text-white">{stats.openCount}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(0,255,0,0.5)]" /> 
                        Ganho
                      </div>
                      <span className="text-white">{stats.wonCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BlurFade>

          {/* Valor de Oportunidade */}
          <BlurFade delay={0.2}>
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-5 h-72 flex flex-col group transition-all duration-300 hover:bg-white/[0.07]">
              <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/80 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-brand-orange)] shadow-[0_0_8px_rgba(255,102,0,0.8)]" />
                  Valor de Oportunidade
                </h3>
                <div className="relative">
                  <select 
                    value={selectedPipeline}
                    onChange={(e) => setSelectedPipeline(e.target.value)}
                    className="appearance-none pr-7 pl-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] uppercase tracking-wider text-muted-foreground outline-none hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    {pipelines.map(p => <option key={p} value={p} className="bg-zinc-900">{p}</option>)}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1 -ml-4 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: "GANHO", value: stats.wonVal }, { name: "ABERTO", value: stats.openVal }]} layout="vertical" margin={{ left: 40, right: 20, top: 10, bottom: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: "bold" }} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", color: "white", fontSize: "12px", fontWeight: "bold" }} itemStyle={{ color: "white" }} formatter={(val: any) => [formatCurrency(Number(val) || 0), "Valor"]} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                      {[{ name: "GANHO", value: stats.wonVal }, { name: "ABERTO", value: stats.openVal }].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === "GANHO" ? "#10b981" : "#3b82f6"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-2 pt-3 border-t border-white/5 relative z-10">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Receita Total</p>
                <p className="text-xl font-black tracking-tighter text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">{formatCurrency(stats.totalVal)}</p>
              </div>
            </div>
          </BlurFade>

          {/* Taxa de conversao */}
          <BlurFade delay={0.3}>
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-5 h-72 flex flex-col group transition-all duration-300 hover:bg-white/[0.07]">
              <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/80 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  Taxa de Conversão
                </h3>
                <div className="relative">
                  <select 
                    value={selectedPipeline}
                    onChange={(e) => setSelectedPipeline(e.target.value)}
                    className="appearance-none pr-7 pl-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] uppercase tracking-wider text-muted-foreground outline-none hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    {pipelines.map(p => <option key={p} value={p} className="bg-zinc-900">{p}</option>)}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1 relative flex items-center justify-center py-4 z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ name: "Ganho", value: stats.wonCount }, { name: "Perdido", value: stats.totalCount - stats.wonCount }]} innerRadius="85%" outerRadius="100%" dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                      <Cell fill="#3b82f6" />
                      <Cell fill="rgba(255,255,255,0.05)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black tracking-tighter text-[#3b82f6] drop-shadow-[0_0_12px_rgba(0,102,255,0.5)]">{stats.convRate}%</span>
                </div>
              </div>
              <div className="text-center mt-2 pt-3 border-t border-white/5 relative z-10">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Receita Ganha</p>
                <p className="text-xl font-black tracking-tighter text-[#10b981] drop-shadow-[0_0_12px_rgba(0,255,0,0.3)]">{formatCurrency(stats.wonVal)}</p>
              </div>
            </div>
          </BlurFade>

        </div>

        {/* Funil Widget */}
        <BlurFade delay={0.4}>
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-8 flex flex-col min-h-[500px]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-brand-blue)]/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6 relative z-10">
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/90 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-blue)]/20 flex items-center justify-center border border-[var(--color-brand-blue)]/30">
                  <Filter className="w-4 h-4 text-[var(--color-brand-blue)]" />
                </div>
                Funil de Vendas
              </h3>
              <select 
                value={selectedPipeline}
                onChange={(e) => setSelectedPipeline(e.target.value)}
                className="px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-white outline-none hover:bg-black/60 cursor-pointer shadow-sm transition-all focus:border-[var(--color-brand-blue)]/50 focus:ring-1 focus:ring-[var(--color-brand-blue)]/50"
              >
                {pipelines.map(p => <option key={p} value={p} className="bg-zinc-900">{p}</option>)}
              </select>
            </div>

            {selectedPipeline === "Todos os pipelines" ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground relative z-10 py-12">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                  <Filter className="w-8 h-8 opacity-40" />
                </div>
                <p className="text-sm font-medium tracking-wide">Selecione um pipeline específico para visualizar o funil</p>
              </div>
            ) : funnelData.length > 0 ? (
              <div className="flex-1 flex gap-12 relative z-10">
                {/* Funnel Bars */}
                <div className="flex-1 flex flex-col">
                  <span className="text-[10px] font-bold text-left mb-6 text-muted-foreground uppercase tracking-widest pl-5">Etapa do Pipeline</span>
                  <div className="flex-1 space-y-3">
                    {funnelData.map((stage, i) => {
                      const colorVars = ["#3b82f6", "#10b981", "#f97316", "#a855f7", "#ec4899", "#14b8a6"];
                      const stageColor = colorVars[i % colorVars.length];
                      return (
                        <div key={stage.name} className="relative h-14 flex items-center px-5 rounded-r-xl group transition-all duration-300 hover:scale-[1.01]" style={{
                          background: `linear-gradient(90deg, ${stageColor}40 0%, ${stageColor}80 100%)`,
                          border: `1px solid ${stageColor}60`,
                          borderLeft: `4px solid ${stageColor}`,
                          width: `${Math.max(stage.conversion, 15)}%`,
                          minWidth: "fit-content",
                          boxShadow: `0 4px 20px -5px ${stageColor}30`
                        }}>
                          <span className="text-white text-sm font-bold uppercase tracking-wider z-10 flex items-center gap-4 whitespace-nowrap">
                            <span className="drop-shadow-md">{stage.name}</span>
                            <span className="opacity-90 drop-shadow-md">{formatCurrency(stage.value)}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Conversion Stats */}
                <div className="w-64 flex gap-6">
                  <div className="flex-1 flex flex-col">
                    <span className="text-[10px] font-bold text-center mb-6 text-muted-foreground uppercase tracking-widest">Cumulativo</span>
                    <div className="flex-1 flex flex-col space-y-3">
                      {funnelData.map(stage => (
                        <div key={stage.name} className="h-14 flex items-center justify-center bg-white/5 border border-white/10 relative clip-arrow text-xs text-white font-black tracking-widest">
                          {stage.conversion}.00%
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <span className="text-[10px] font-bold text-center mb-6 leading-tight text-muted-foreground uppercase tracking-widest">Próxima Etapa</span>
                    <div className="flex-1 flex flex-col space-y-3">
                      {funnelData.map((stage, i) => {
                        const nextStage = funnelData[i + 1];
                        const nextConv = nextStage && stage.cumulative > 0 ? Math.round((nextStage.cumulative / stage.cumulative) * 100) : 100;
                        return (
                          <div key={stage.name} className="h-14 flex items-center justify-center bg-white/5 border border-white/10 relative clip-arrow text-xs text-[var(--color-brand-blue)] font-black tracking-widest drop-shadow-[0_0_8px_rgba(0,102,255,0.5)]">
                            {nextConv}.00%
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground relative z-10 py-12">
                <p className="text-sm font-medium tracking-wide">Nenhuma etapa encontrada neste pipeline</p>
              </div>
            )}
          </div>
        </BlurFade>

        {/* Global Styles for Funnel Arrows */}
        <style dangerouslySetInnerHTML={{__html: `
          .clip-arrow {
            clip-path: polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%, 10% 50%);
          }
        `}} />
      </div>
    </div>
  );
}
