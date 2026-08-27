/**
 * 저장 중 화면 조작을 막는다.
 *
 * 버튼만 비활성화하면 입력칸·취소가 그대로 눌리고, RHF 가 검증을 도는 동안에는 아직
 * 제출 플래그가 서지 않아 더블탭이 두 번 들어간다. create_capsule 은 중복 방지 장치가
 * 없어 그 경우 캡슐이 두 개 생긴다.
 */
export function LoadingOverlay({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-bg/80 backdrop-blur-sm"
    >
      <span
        aria-hidden="true"
        className="size-8 animate-spin rounded-full border-2 border-line-strong border-t-accent"
      />
      <p className="text-sm text-ink-muted">{label}</p>
    </div>
  );
}
