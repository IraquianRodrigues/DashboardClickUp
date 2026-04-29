"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Monitor, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveIndicator } from "@/components/layout/LiveIndicator";

interface HeaderProps {
  title: string;
  subtitle?: string;
  lastUpdated: number;
  isFetching: boolean;
  onRefresh: () => void;
}

export function Header({ title, subtitle, lastUpdated, isFetching, onRefresh }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const enterTvMode = () => {
    document.documentElement.classList.add("tv-mode");
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-border bg-background">
      <div className="pl-12 lg:pl-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <LiveIndicator lastUpdated={lastUpdated} isFetching={isFetching} />

        <Button variant="outline" size="icon" onClick={onRefresh} disabled={isFetching}
          className="rounded-xl border-border/50 hover:bg-accent/50">
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>

        <Button variant="outline" size="icon" onClick={enterTvMode} title="Modo TV / Operação"
          className="rounded-xl border-[var(--color-brand-blue)]/50 text-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/10 hover:text-[var(--color-brand-blue)]">
          <Monitor className="w-4 h-4 drop-shadow-[0_0_8px_rgba(0,102,255,0.8)]" />
        </Button>
      </div>
    </header>
  );
}
