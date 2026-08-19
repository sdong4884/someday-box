import type { MouseEvent, ReactNode } from "react";

/**
 * 이 화면의 입력창·버튼 생김새를 모아 둔 곳.
 *
 * 아직 앱 공용(`shared/ui`)으로 올리지 않는다. 지금 이걸 나눠 쓰는 건 "재사용"이 아니라
 * 마운트 게이트 때문에 같은 뼈대를 폼과 비활성 셸에 두 번 그려야 해서다. 공용 API 는
 * 두 번째 사용처(편지 작성 폼)를 보고 정한다.
 *
 * 색은 globals.css 의 토큰만 쓴다. 임의 hex 금지 (CLAUDE.md 디자인).
 */

/**
 * 글자 크기를 16px(`text-base`) 아래로 내리지 않는다. iOS 사파리는 그보다 작은 입력창에
 * 포커스가 가면 화면을 확대해 버리는데, 카카오톡 인앱 브라우저도 같은 엔진이다.
 */
export const INPUT_CLASS =
  "h-control w-full rounded-card border border-line bg-surface px-3.5 text-base text-ink outline-none transition-colors placeholder:text-ink-dim focus:border-accent disabled:bg-surface-muted disabled:text-ink-dim";

/**
 * 날짜 칸. 커서만 다르다 — 글자를 넣는 칸이 아니라 누르면 달력이 열리는 칸이다.
 * 텍스트 칸(제목)은 캐럿이 맞으므로 INPUT_CLASS 에 넣지 않는다.
 */
export const DATE_INPUT_CLASS = `${INPUT_CLASS} cursor-pointer disabled:cursor-default`;

/**
 * 입력칸 아무 곳이나 눌러도 날짜 피커를 연다.
 *
 * 기본 동작은 우측의 작은 달력 아이콘을 정확히 눌러야 열리는 것이라 모바일에서 표적이
 * 너무 작다. showPicker() 는 표준 API 이고, 클릭이 사용자 제스처라 호출 조건을 만족한다.
 *
 * 구형 인앱 웹뷰에는 이 메서드가 없을 수 있고 상태에 따라 던지기도 한다
 * (제스처 없이 불리면 NotAllowedError). 둘 다 삼킨다 — 실패해도 아이콘을 누르는 원래
 * 동작이 그대로 남으므로 잃는 것이 없다.
 *
 * CSS 로 ::-webkit-calendar-picker-indicator 를 칸 전체로 늘리는 방법도 있지만
 * webkit 전용이라 쓰지 않는다.
 */
export function openDatePicker(event: MouseEvent<HTMLInputElement>) {
  const input = event.currentTarget;

  if (typeof input.showPicker !== "function") return;

  try {
    input.showPicker();
  } catch {
    // 열지 못해도 화면은 그대로 동작한다.
  }
}

export const LABEL_CLASS = "text-sm text-ink-muted";
export const HINT_CLASS = "text-xs text-ink-dim";
export const ERROR_CLASS = "text-xs text-danger";

const HEADER_BUTTON_CLASS =
  "-mx-2 min-h-control px-2 text-sm transition-opacity disabled:opacity-40";

/**
 * 상단 바. 가운데 제목이 좌우 버튼의 글자 수에 밀리지 않도록 3등분 그리드로 둔다.
 *
 * `생성` 은 `type="submit"` 이라 폼에 따로 배선할 것이 없다. 그래서 이 헤더는 `<form>`
 * 안에 들어간다.
 */
export function ScreenHeader({
  submitLabel,
  submitDisabled,
  onCancel,
}: {
  submitLabel: string;
  submitDisabled: boolean;
  onCancel?: () => void;
}) {
  return (
    <header className="grid grid-cols-3 items-center border-b border-line px-3 py-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={!onCancel}
        className={`${HEADER_BUTTON_CLASS} justify-self-start text-ink-muted`}
      >
        취소
      </button>

      <h1 className="justify-self-center text-base font-semibold text-ink">
        새 캡슐
      </h1>

      <button
        type="submit"
        disabled={submitDisabled}
        className={`${HEADER_BUTTON_CLASS} justify-self-end font-semibold text-accent-soft`}
      >
        {submitLabel}
      </button>
    </header>
  );
}

/**
 * 입력칸 하나. 라벨·안내문·에러의 자리와 연결(`htmlFor`, `aria-describedby`)을 맡는다.
 *
 * 에러가 나도 안내문은 지우지 않는다. 안내문은 그 칸이 무엇인지 설명하는 문장이라
 * 고치는 동안에도 필요하다.
 */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>

      {children}

      {hint && (
        <p id={hintId(id)} className={HINT_CLASS}>
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId(id)} className={ERROR_CLASS}>
          {error}
        </p>
      )}
    </div>
  );
}

const hintId = (id: string) => `${id}-hint`;
const errorId = (id: string) => `${id}-error`;

/**
 * 입력 요소에 그대로 펼쳐 넣는 접근성 속성.
 *
 * 안내문과 에러를 모두 가리키므로 스크린 리더가 "무엇을 넣는 칸인지"와 "무엇이 잘못됐는지"를
 * 함께 읽는다. Field 와 짝이라 id 규칙이 어긋날 일이 없다.
 */
export function fieldAria({
  id,
  hint,
  error,
}: {
  id: string;
  hint?: string;
  error?: string;
}) {
  const describedBy = [hint && hintId(id), error && errorId(id)]
    .filter(Boolean)
    .join(" ");

  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy || undefined,
  } as const;
}
