"use client";

import { Header } from "@/components/layout/Header";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { BlurFade } from "@/components/ui/blur-fade";

const INIT_TIME = Date.now();

export default function AIInsightsPage() {
  return (
    <div className="min-h-screen dashboard-grid-bg">
      <Header title="Insights IA" subtitle="Análise inteligente das suas tarefas" lastUpdated={INIT_TIME} isFetching={false} onRefresh={() => {}} />

      <div className="p-6 space-y-6">
        <BlurFade delay={0.1}>
          <AIInsights />
        </BlurFade>
      </div>
    </div>
  );
}
