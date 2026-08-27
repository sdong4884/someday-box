import type { ComponentProps, MouseEvent, ReactNode } from "react";

/**
 * 폼 화면의 입력창·버튼 생김새를 모아 둔 곳.
 *
 * 색은 globals.css 의 토큰만 쓴다. 임의 hex 금지 (CLAUDE.md 디자인).
 */

/**
 * 입력칸 껍데기의 공통 생김새. 텍스트 칸은 input 자신이 쓰고, 날짜 칸은 감싸는 div 가 쓴다.
 * 두 칸의 테두리·배경·여백이 갈라지지 않도록 한 군데서 낸다.
 *
 * 높이는 여기 없다 — textarea 가 제 높이를 따로 잡는다.
 */
const BOX_BASE =
  "w-full rounded-card border border-line bg-surface px-3.5 transition-colors";

const BOX_CLASS = `h-control ${BOX_BASE}`;

/**
 * 글자 크기를 16px(`text-base`) 아래로 내리지 않는다. iOS 사파리는 그보다 작은 입력창에
 * 포커스가 가면 화면을 확대해 버리는데, 카카오톡 인앱 브라우저도 같은 엔진이다.
 */
export const INPUT_CLASS = `${BOX_CLASS} text-base text-ink outline-none placeholder:text-ink-dim focus:border-accent disabled:bg-surface-muted disabled:text-ink-dim`;

/** `text-base` 는 INPUT_CLASS 와 같은 이유다 (iOS 확대 방지). */
export const TEXTAREA_CLASS = `${BOX_BASE} h-52 resize-none py-3 text-base leading-[1.6] text-ink outline-none placeholder:text-ink-dim focus:border-accent disabled:bg-surface-muted disabled:text-ink-dim`;

/**
 * 날짜 칸의 껍데기. 테두리·배경·높이를 input 이 아니라 이 div 가 그린다.
 *
 * iOS 사파리의 `input[type=date]` 는 UA 가 계산한 제 너비를 고집해서 `w-full` 을 줘도
 * 패딩·테두리만큼 칸이 화면 밖으로 삐져나온다 — 아이폰에서 가로 스크롤이 생겼던 원인이고,
 * 데스크톱 크롬에서는 재현되지 않는다. 껍데기가 폭을 잡고 입력창은 그 안에서 `min-w-0` 로
 * 줄어드는 자식이 되면, 어느 웹뷰가 무슨 너비를 주장하든 바깥으로 샐 수 없다.
 * `overflow-hidden` 이 마지막 방어선이다.
 *
 * 포커스는 `focus-within` 으로 안쪽 input 에서 받아 온다. 비활성 배경만 CSS 로 끌어오지
 * 않고 prop 으로 받는데(DateInput), `:has()` 를 구형 인앱 웹뷰까지 믿고 쓸 이유가 없어서다 —
 * 어차피 그 값을 이미 알고 있다.
 */
const DATE_BOX_CLASS = `${BOX_CLASS} relative flex items-center gap-2 overflow-hidden focus-within:border-accent`;

/**
 * 껍데기 안에 들어가는 날짜 입력창. 생김새는 껍데기가 가져갔으므로 배경·테두리가 없다.
 *
 * `appearance-none` 으로 UA 가 강제하는 제 사이즈를 놓게 하고, 네이티브 달력 아이콘은
 * 숨긴다 (아래 DateInput 주석 참고). `peer` 는 아이콘이 비활성 상태를 따라가기 위한 것.
 *
 * 커서는 포인터다 — 글자를 넣는 칸이 아니라 누르면 달력이 열리는 칸이다.
 */
const DATE_INPUT_CLASS =
  "peer min-w-0 flex-1 cursor-pointer appearance-none bg-transparent text-base text-ink outline-none disabled:cursor-default disabled:text-ink-dim [&::-webkit-calendar-picker-indicator]:hidden [&[data-empty]::-webkit-datetime-edit]:opacity-0";

/**
 * 빈 날짜 칸에 보일 문구.
 *
 * `placeholder` 속성은 `type="date"` 에서 무시되므로 직접 그린다. 데스크톱 크롬은 UA
 * 기본값(`연도. 월. 일.`)을 그리는데 iOS 는 빈 칸을 그냥 비워 두기 때문에, UA 문구는
 * 가리고(`[&[data-empty]::-webkit-datetime-edit]:opacity-0`) 우리 문구 하나로 통일한다.
 *
 * 알려진 한계: 파이어폭스에는 `::-webkit-datetime-edit` 가 없어 UA 문구와 겹쳐 보인다.
 * 이 앱은 모바일 전용이고 대상(iOS 사파리·안드로이드 크롬·카카오 인앱)이 전부 WebKit/Blink
 * 라 @supports 분기까지 만들지 않는다.
 */
const DATE_PLACEHOLDER = "연도-월-일";

/** 입력창 위에 겹쳐 놓는다. 탭은 입력창이 받아야 하므로 이벤트를 통과시킨다. */
const DATE_PLACEHOLDER_CLASS =
  "pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-base text-ink-dim";

/**
 * 껍데기 아무 곳이나 눌러도 날짜 피커를 연다.
 *
 * 입력창에만 걸면 아이콘과 우측 여백을 눌렀을 때 아무 일도 일어나지 않는다 — 아이콘은
 * 이벤트를 통과시키므로 클릭이 껍데기로 떨어지기 때문이다. 모바일에서 표적이 작아
 * 그쪽을 누르기 쉬운데, 그때 달력이 안 열리면 고장으로 보인다.
 *
 * 구형 인앱 웹뷰에는 showPicker 가 없을 수 있고 상태에 따라 던지기도 한다
 * (제스처 없이 불리면 NotAllowedError). 둘 다 삼킨다 — 실패해도 칸을 누르면 브라우저가
 * 여는 기본 동작이 그대로 남으므로 잃는 것이 없다.
 */
function openDatePicker(event: MouseEvent<HTMLDivElement>) {
  const input = event.currentTarget.querySelector("input");

  if (!input || input.disabled || typeof input.showPicker !== "function") return;

  try {
    input.showPicker();
  } catch {
    // 열지 못해도 화면은 그대로 동작한다.
  }
}

/**
 * 날짜 칸. 껍데기·입력창·아이콘을 한 벌로 묶는다.
 *
 * 달력 아이콘을 직접 그리는 이유: iOS 사파리는
 * `::-webkit-calendar-picker-indicator` 를 아예 그리지 않고 데스크톱 크롬은 그린다.
 * 그대로 두면 기기마다 아이콘이 있다 없다 해서, 정작 주 유입 경로인 모바일에서 날짜 칸이
 * 빈 상자로 보인다. 그래서 네이티브 쪽은 숨기고 우리 SVG 하나로 통일한다. 여는 동작은
 * 껍데기가 받으므로 아이콘은 표시만 맡는다.
 *
 * `type`·`className` 은 받지 않는다 — 껍데기와 입력창이 짝이라는 전제를 호출부가 깨면
 * 넘침이 되돌아온다.
 *
 * `isEmpty` 는 호출부가 알려 준다. 폼은 RHF 로 값을 비제어로 다루므로 입력창에 `value` 를
 * 넘길 수 없고, 값을 아는 쪽은 `useWatch` 를 든 호출부다.
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

/** 날짜 칸의 달력 표시. 탭은 입력창이 받아야 하므로 이벤트를 통과시킨다. */
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

/**
 * 상단 바. 가운데 제목이 좌우 버튼의 글자 수에 밀리지 않도록 3등분 그리드로 둔다.
 *
 * `생성` 은 `type="submit"` 이라 폼에 따로 배선할 것이 없다. 그래서 이 헤더는 `<form>`
 * 안에 들어간다.
 */
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
