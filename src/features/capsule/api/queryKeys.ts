/**
 * 캡슐 관련 쿼리 키.
 *
 * 키를 호출부마다 배열 리터럴로 적으면 오타 하나가 조용히 다른 캐시 항목을 만든다.
 * 무효화도 `capsuleKeys.all` 하나로 캡슐 전체를 걸 수 있게 접두사를 맞춰 둔다.
 *
 * slug 를 키에 넣는 이유: 한 브라우저가 여러 캡슐 링크를 오갈 수 있고, 그때 앞
 * 캡슐의 참여 현황이 그대로 보이면 안 된다.
 */
export const capsuleKeys = {
  all: ["capsule"] as const,
  summary: (slug: string) => [...capsuleKeys.all, slug, "summary"] as const,
  letters: (slug: string) => [...capsuleKeys.all, slug, "letters"] as const,
};
