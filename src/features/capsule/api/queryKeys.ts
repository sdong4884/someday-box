/** slug 를 키에 넣어야 한 브라우저로 여러 캡슐을 오갈 때 앞 캡슐 현황이 남지 않는다. */
export const capsuleKeys = {
  all: ["capsule"] as const,
  summary: (slug: string) => [...capsuleKeys.all, slug, "summary"] as const,
  letters: (slug: string) => [...capsuleKeys.all, slug, "letters"] as const,
};
