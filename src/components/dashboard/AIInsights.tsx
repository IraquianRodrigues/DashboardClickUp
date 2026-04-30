"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Brain, RefreshCw, Sparkles, Clock, AlertTriangle, TrendingUp, Lightbulb, Target } from "lucide-react";

interface InsightData {
  available: boolean;
  date?: string;
  generatedAt?: string;
  insights?: string;
  message?: string;
  metricsSummary?: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
    blocked: number;
  };
}

function parseInsightSections(text: string) {
  const sections: { icon: React.ReactNode; title: string; content: string }[] = [];

  const sectionPatterns = [
    { emoji: "🚨", icon: <AlertTriangle className="w-4 h-4 text-red-400" />, title: "Alertas Críticos" },
    { emoji: "📊", icon: <TrendingUp className="w-4 h-4 text-[var(--color-brand-blue)]" />, title: "Análise de Performance" },
    { emoji: "📈", icon: <TrendingUp className="w-4 h-4 text-[var(--color-brand-green)]" />, title: "Tendências e Padrões" },
    { emoji: "💡", icon: <Lightbulb className="w-4 h-4 text-yellow-400" />, title: "Recomendações do Dia" },
    { emoji: "🎯", icon: <Target className="w-4 h-4 text-[var(--color-brand-orange)]" />, title: "Foco do Dia" },
  ];

  // Try to split by section headers
  for (let i = 0; i < sectionPatterns.length; i++) {
    const pattern = sectionPatterns[i];
    const nextPattern = sectionPatterns[i + 1];

    const startIdx = text.indexOf(pattern.emoji);
    if (startIdx === -1) continue;

    let endIdx = text.length;
    if (nextPattern) {
      const nextIdx = text.indexOf(nextPattern.emoji, startIdx + 1);
      if (nextIdx !== -1) endIdx = nextIdx;
    }

    let content = text.substring(startIdx, endIdx).trim();
    // Remove the emoji and title header line
    const firstNewline = content.indexOf("\n");
    if (firstNewline !== -1) {
      content = content.substring(firstNewline + 1).trim();
    }

    if (content.length > 0) {
      sections.push({ icon: pattern.icon, title: pattern.title, content });
    }
  }

  // Fallback: if no sections found, show the entire text as one section
  if (sections.length === 0 && text.trim().length > 0) {
    sections.push({
      icon: <Sparkles className="w-4 h-4 text-[var(--color-brand-blue)]" />,
      title: "Análise do Dia",
      content: text.trim(),
    });
  }

  return sections;
}

export function AIInsights() {
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ai-insights?_t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch {
      setData({ available: false, message: "Erro ao carregar insights" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleTrigger = async () => {
    try {
      setTriggering(true);
      setData(prev => prev ? { ...prev, message: "Enviando dados para a IA..." } : { available: false, message: "Enviando dados para a IA..." });
      
      const res = await fetch("/api/ai-insights/trigger");
      
      if (res.ok) {
        setData(prev => prev ? { ...prev, message: "Processando insights com a IA (pode levar alguns segundos)..." } : { available: false, message: "Processando insights com a IA (pode levar alguns segundos)..." });
        
        // Start polling for results
        const pollInterval = setInterval(async () => {
          try {
            const checkRes = await fetch(`/api/ai-insights?_t=${Date.now()}`, { cache: "no-store" });
            const checkJson = await checkRes.json();
            
            // If we got a new insight (it's available and generated recently)
            if (checkJson.available) {
              const generated = new Date(checkJson.generatedAt).getTime();
              const now = new Date().getTime();
              // If generated in the last 2 minutes, it's our new insight
              if (now - generated < 120000) {
                setData(checkJson);
                setTriggering(false);
                clearInterval(pollInterval);
              }
            }
          } catch {
            // ignore fetch errors during polling
          }
        }, 5000);

        // Stop polling after 2 minutes to prevent infinite loops
        setTimeout(() => {
          clearInterval(pollInterval);
          setTriggering(false);
        }, 120000);

      } else {
        const errJson = await res.json().catch(() => null);
        console.error("Trigger errored:", errJson || res.status || res.statusText);
        const errorMessage = errJson?.error || res.statusText || (res.status === 504 ? "Timeout do servidor (504)" : "Erro desconhecido");
        setData(prev => ({
          available: false,
          message: `Erro ao gerar insights: ${errorMessage}`
        }));
        setTriggering(false);
      }
    } catch (err) {
      console.error("Trigger fetch error:", err);
      setData(prev => ({
        available: false,
        message: "Falha na comunicação com a API."
      }));
      setTriggering(false);
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-blue)]/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-[var(--color-brand-blue)] animate-pulse" />
          </div>
          <div>
            <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-60 bg-white/5 rounded animate-pulse mt-2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl">
      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-[var(--color-brand-blue)]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[var(--color-brand-green)]/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-blue)]/30 to-[var(--color-brand-green)]/20 flex items-center justify-center border border-[var(--color-brand-blue)]/30 shadow-[0_0_20px_rgba(0,102,255,0.15)]">
            <Brain className="w-5 h-5 text-[var(--color-brand-blue)] drop-shadow-[0_0_8px_rgba(0,102,255,0.8)]" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/80 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-[var(--color-brand-green)]" />
              Insights da IA
            </h3>
            {data?.available && data.generatedAt && (
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Gerado em {formatTime(data.generatedAt)}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleTrigger}
          disabled={triggering}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300",
            triggering
              ? "bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)]/50 cursor-wait"
              : "bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] border border-[var(--color-brand-blue)]/30 hover:bg-[var(--color-brand-blue)]/20 hover:shadow-[0_0_20px_rgba(0,102,255,0.2)]"
          )}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", triggering && "animate-spin")} />
          {triggering ? "Processando..." : "Gerar Insights"}
        </button>
      </div>

      {/* Content */}
      <div className="p-6 relative z-10">
        {!data?.available ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
              <Brain className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-1">
              {data?.message || "Nenhum insight disponível ainda"}
            </p>
            {!data?.message?.includes("Erro") && (
              <p className="text-[10px] text-muted-foreground/60 max-w-sm">
                Clique em &quot;Gerar Insights&quot; para enviar os dados ao Make, ou aguarde o relatório automático diário às 17:30.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {parseInsightSections(data.insights || "").map((section, idx) => (
              <div key={idx} className="group">
                <button
                  onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left",
                    expandedSection === idx
                      ? "bg-white/10 border border-white/10"
                      : "bg-white/5 border border-transparent hover:bg-white/8 hover:border-white/5"
                  )}
                >
                  <div className="p-1.5 rounded-lg bg-white/5">
                    {section.icon}
                  </div>
                  <span className="text-sm font-bold text-foreground/90 flex-1">{section.title}</span>
                  <span className={cn(
                    "text-xs text-muted-foreground transition-transform duration-300",
                    expandedSection === idx ? "rotate-180" : ""
                  )}>▾</span>
                </button>

                {expandedSection === idx && (
                  <div className="mt-2 px-4 py-4 bg-white/[0.02] rounded-xl border border-white/5 animate-in slide-in-from-top-2 duration-300">
                    <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
