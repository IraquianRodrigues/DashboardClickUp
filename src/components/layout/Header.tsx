"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveIndicator } from "@/components/layout/LiveIndicator";

interface HeaderProps {
  title: string;
  subtitle?: string;
  lastUpdated: number;
  isFetching: boolean;
  onRefresh: () => void;
}

function LiveClock() {
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    function update() {
      const now = new Date();
      setTime(now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDate(now.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }));
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  return (
    <div className="hidden sm:flex flex-col items-end">
      <span className="text-sm font-bold tracking-tight tabular-nums text-foreground/90">{time}</span>
      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{date}</span>
    </div>
  );
}

export function Header({ title, subtitle, lastUpdated, isFetching, onRefresh }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      {/* Refresh progress bar */}
      {isFetching && (
        <div className="absolute top-0 left-0 right-0 h-[2px] z-50 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-transparent via-[var(--color-brand-blue)] to-transparent animate-[shimmer_1.5s_ease-in-out_infinite] w-1/3" />
        </div>
      )}

      <div className="flex items-center justify-between px-6 py-4">
        <div className="pl-12 lg:pl-0">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          <LiveClock />

          <div className="hidden sm:block w-px h-8 bg-border/50" />

          <LiveIndicator lastUpdated={lastUpdated} isFetching={isFetching} />

          <Button variant="outline" size="icon" onClick={onRefresh} disabled={isFetching}
            className="rounded-xl border-border/50 hover:bg-accent/50">
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </header>
  );
}
