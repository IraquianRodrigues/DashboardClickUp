"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClickUpMember } from "@/types/clickup";

async function fetchMembers(): Promise<ClickUpMember[]> {
  const res = await fetch("/api/clickup/members");
  if (!res.ok) throw new Error("Failed to fetch members");
  const data = await res.json();
  return data.members;
}

export function useMembers() {
  return useQuery({
    queryKey: ["clickup-members"],
    queryFn: fetchMembers,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
