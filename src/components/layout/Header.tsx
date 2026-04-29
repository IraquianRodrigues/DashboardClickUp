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

export function Header({ title, subtitle, lastUpdated, isFetching, onRefresh }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
      </div>
    </header>
  );
}
