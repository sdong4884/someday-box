"use client";

import { useQuery } from "@tanstack/react-query";

import { getCapsuleLetters } from "@/features/capsule/api/getCapsuleLetters";
import { capsuleKeys } from "@/features/capsule/api/queryKeys";

export function useCapsuleLetters(slug: string, capsuleId: string) {
  return useQuery({
    queryKey: capsuleKeys.letters(slug),
    queryFn: () => getCapsuleLetters(capsuleId),
  });
}
