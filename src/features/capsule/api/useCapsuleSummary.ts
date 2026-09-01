"use client";

import { useQuery } from "@tanstack/react-query";

import { getCapsuleSummary } from "@/features/capsule/api/getCapsuleSummary";
import { capsuleKeys } from "@/features/capsule/api/queryKeys";

export function useCapsuleSummary(slug: string) {
  return useQuery({
    queryKey: capsuleKeys.summary(slug),
    queryFn: () => getCapsuleSummary(slug),
  });
}
