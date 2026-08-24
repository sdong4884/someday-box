"use client";

import { useQuery } from "@tanstack/react-query";

import { getCapsuleSummary } from "@/features/capsule/api/getCapsuleSummary";
import { capsuleKeys } from "@/features/capsule/api/queryKeys";

/**
 * 참여 현황 조회.
 *
 * WRITING 과 LOCKED 가 함께 쓴다 — 두 화면 모두 "지금 몇 명이 남겼는지"를 보여주고,
 * RPC 는 잠긴 뒤에도 개수·닉네임까지는 답한다. 그래서 화면 안이 아니라 여기에 둔다.
 *
 * staleTime·retry 는 app/providers.tsx 의 기본값을 그대로 쓴다. 편지 수가 몇 초
 * 늦어도 되는 값이라 따로 조일 이유가 없다.
 */
export function useCapsuleSummary(slug: string) {
  return useQuery({
    queryKey: capsuleKeys.summary(slug),
    queryFn: () => getCapsuleSummary(slug),
  });
}
