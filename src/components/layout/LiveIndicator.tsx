"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

interface LiveIndicatorProps {
  lastUpdated: number;
  isFetching: boolean;
  intervalMs?: number;
}

export function LiveIndicator({ lastUpdated, isFetching, intervalMs = 30000 }: LiveIndicatorProps) {
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [nextRefreshIn, setNextRefreshIn] = useState(intervalMs / 1000);

  useEffect(() => {
    const timer = setInterval(() => {
      if (lastUpdated > 0) {
        const elapsed = Math.floor((Date.now() - lastUpdated) / 1000);
        setSecondsAgo(elapsed);
        setNextRefreshIn(Math.max(0, Math.floor((intervalMs - (Date.now() - lastUpdated)) / 1000)));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated, intervalMs]);

  if (isFetching) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-xs text-blue-400 font-medium">Atualizando...</span>
      </div>
    );
  }

  const isStale = secondsAgo > 60;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors",
      isStale
        ? "bg-yellow-500/10 border-yellow-500/20"
        : "bg-emerald-500/10 border-emerald-500/20"
    )}>
      {isStale ? (
        <WifiOff className="w-3 h-3 text-yellow-400" />
      ) : (
        <>
          <div className="relative w-2 h-2">
            <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
            <div className="relative w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <Wifi className="w-3 h-3 text-emerald-400" />
        </>
      )}
      <span className={cn("text-xs font-medium", isStale ? "text-yellow-400" : "text-emerald-400")}>
        {nextRefreshIn > 0 ? `${nextRefreshIn}s` : "agora"}
      </span>
    </div>
  );
}
