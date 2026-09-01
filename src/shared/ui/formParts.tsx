import type { ComponentProps, MouseEvent, ReactNode } from "react";

/** 높이는 여기 없다 — textarea 가 제 높이를 따로 잡는다. */
const BOX_BASE =
  "w-full rounded-card border border-line bg-surface px-3.5 transition-colors";

const BOX_CLASS = `h-control ${BOX_BASE}`;

/** `text-base`(16px) 아래로 내리지 않는다 — iOS 는 그보다 작은 입력창에 포커스가 가면 확대한다. */
export const INPUT_CLASS = `${BOX_CLASS} text-base text-ink outline-none placeholder:text-ink-dim focus:border-accent disabled:bg-surface-muted disabled:text-ink-dim`;

/** `text-base` 는 INPUT_CLASS 와 같은 이유다 (iOS 확대 방지). */
export const TEXTAREA_CLASS = `${BOX_BASE} h-52 resize-none py-3 text-base leading-[1.6] text-ink outline-none placeholder:text-ink-dim focus:border-accent disabled:bg-surface-muted disabled:text-ink-dim`;

/**
 * 폭을 input 이 아니라 이 껍데기가 잡는다. iOS 사파리의 `input[type=date]` 는 UA 가 계산한
 * 제 너비를 고집해 `w-full` 을 줘도 화면 밖으로 삐져나온다 — 아이폰 가로 스크롤의 원인이었고
 * 데스크톱 크롬에서는 재현되지 않는다. `overflow-hidden` 이 마지막 방어선이다.
 */
const DATE_BOX_CLASS = `${BOX_CLASS} relative flex items-center gap-2 overflow-hidden focus-within:border-accent`;

/** `appearance-none` 과 `min-w-0` 가 UA 가 강제하는 제 사이즈를 놓게 한다 (DATE_BOX_CLASS 참고). */
const DATE_INPUT_CLASS =
  "peer min-w-0 flex-1 cursor-pointer appearance-none bg-transparent text-base text-ink outline-none disabled:cursor-default disabled:text-ink-dim [&::-webkit-calendar-picker-indicator]:hidden [&[data-empty]::-webkit-datetime-edit]:opacity-0";

/**
 * `placeholder` 속성은 `type="date"` 에서 무시되므로 직접 그린다. UA 기본 문구는 크롬만
 * 그리고 iOS 는 비워 두므로, UA 쪽을 가리고 이 문구 하나로 통일한다.
 *
 * 파이어폭스에는 `::-webkit-datetime-edit` 가 없어 겹쳐 보인다 — 모바일 전용이라 넘어간다.
 */
const DATE_PLACEHOLDER = "연도-월-일";

/** 탭은 입력창이 받아야 하므로 이벤트를 통과시킨다. */
const DATE_PLACEHOLDER_CLASS =
  "pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-base text-ink-dim";

/**
 * 구형 인앱 웹뷰에는 showPicker 가 없고, 제스처 없이 불리면 NotAllowedError 를 던진다.
 * 둘 다 삼킨다 — 칸을 누르면 브라우저가 여는 기본 동작이 그대로 남는다.
 */
function openDatePicker(event: MouseEvent<HTMLDivElement>) {
  const input = event.currentTarget.querySelector("input");

  if (!input || input.disabled || typeof input.showPicker !== "function") return;

  try {
    input.showPicker();
  } catch {
    // 위 주석 참고. 삼켜도 기본 동작이 남는다.
  }
}

/**
 * 달력 아이콘을 직접 그린다 — iOS 사파리는 `::-webkit-calendar-picker-indicator` 를 아예
 * 그리지 않아, 네이티브에 맡기면 모바일에서 날짜 칸이 빈 상자로 보인다.
 *
 * `type`·`className` 은 받지 않는다. 껍데기와 입력창이 짝이라는 전제를 호출부가 깨면 넘침이
 * 되돌아온다. `isEmpty` 를 호출부에서 받는 것은 RHF 비제어라 여기서 값을 알 수 없어서다.
 */
export function DateInput({
  isEmpty = false,
  ...props
}: Omit<ComponentProps<"input">, "type" | "className"> & {
  isEmpty?: boolean;
}) {
  const boxClass = props.disabled
    ? `${DATE_BOX_CLASS} bg-surface-muted`
    : `${DATE_BOX_CLASS} cursor-pointer`;

  return (
    <div className={boxClass} onClick={openDatePicker}>
      <input
        {...props}
        type="date"
        data-empty={isEmpty || undefined}
        className={DATE_INPUT_CLASS}
      />
      {isEmpty && <span className={DATE_PLACEHOLDER_CLASS}>{DATE_PLACEHOLDER}</span>}
      <CalendarIcon />
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden="true"
      className="pointer-events-none size-5 shrink-0 text-accent-soft peer-disabled:text-ink-dim"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export const LABEL_CLASS = "text-sm text-ink-muted";
export const HINT_CLASS = "text-xs text-ink-dim";
export const ERROR_CLASS = "text-xs text-danger";

const HEADER_BUTTON_CLASS =
  "-mx-2 min-h-control px-2 text-sm transition-opacity disabled:opacity-40";

/** 제출 버튼이 `type="submit"` 이라 이 헤더는 `<form>` 안에 들어가야 한다. */
export function ScreenHeader({
  title,
  submitLabel,
  submitDisabled,
  onCancel,
}: {
  title: string;
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
        {title}
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

/** 에러가 나도 안내문은 지우지 않는다 — 고치는 동안에도 그 칸이 무엇인지 알아야 한다. */
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

/** Field 와 짝이다 — id 규칙을 한 곳에서 내야 aria 연결이 어긋나지 않는다. */
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
