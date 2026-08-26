/**
 * 공개일을 각자 캘린더에 담아가기 위한 .ics 생성 (docs/decisions.md §5).
 *
 * 시각은 전부 인자로 받는다 — 안에서 `new Date()` 를 부르면 DTSTAMP 를 테스트할 수 없다.
 */

export type CapsuleIcsInput = {
  slug: string;
  title: string;
  openAt: Date;
  url: string;
  now: Date;
};

const CRLF = "\r\n";
const MAX_OCTETS = 75;
const HOUR_MS = 60 * 60 * 1000;
const UID_DOMAIN = "someday-box";
const PRODID = "-//Someday Box//Capsule//KO";
const ALARM_TEXT = "내일 상자가 열려요.";

const pad = (value: number, length = 2) =>
  String(value).padStart(length, "0");

function formatIcsUtc(date: Date): string {
  return (
    `${pad(date.getUTCFullYear(), 4)}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/** 역슬래시를 먼저 바꾼다. 순서가 바뀌면 뒤에서 넣은 이스케이프가 다시 escape 된다. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

const encoder = new TextEncoder();

/**
 * RFC 5545 의 75**옥텟** 접기. 글자가 아니라 바이트로 센다 — 한글 한 자가 3바이트라
 * 글자 수로 세면 규격을 넘고, 바이트로 잘라도 시퀀스 중간을 끊으면 글자가 깨진다.
 */
function foldLine(line: string): string {
  if (encoder.encode(line).length <= MAX_OCTETS) return line;

  const parts: string[] = [];
  let current = "";
  let octets = 0;
  // 접힌 줄은 맨 앞의 스페이스 한 칸도 옥텟에 들어간다.
  let limit = MAX_OCTETS;

  for (const char of line) {
    const size = encoder.encode(char).length;

    if (octets + size > limit) {
      parts.push(current);
      current = "";
      octets = 0;
      limit = MAX_OCTETS - 1;
    }

    current += char;
    octets += size;
  }

  parts.push(current);

  return parts.join(`${CRLF} `);
}

export function buildCapsuleIcs(input: CapsuleIcsInput): string {
  const { slug, title, openAt, url, now } = input;

  const description = `${title} 상자가 열렸어요. 링크에서 편지를 확인해 보세요.\n${url}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    // slug 로 고정한다. 다시 받아도 캘린더가 같은 일정으로 보고 덮어쓴다.
    `UID:${slug}@${UID_DOMAIN}`,
    `DTSTAMP:${formatIcsUtc(now)}`,
    `DTSTART:${formatIcsUtc(openAt)}`,
    `DTEND:${formatIcsUtc(new Date(openAt.getTime() + HOUR_MS))}`,
    `SUMMARY:${escapeText(`${title} 상자가 열리는 날`)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `URL:${escapeText(url)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:-P1D",
    `DESCRIPTION:${escapeText(ALARM_TEXT)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(foldLine).join(CRLF) + CRLF;
}

const GOOGLE_RENDER_URL = "https://calendar.google.com/calendar/render";

/**
 * 구글 캘린더의 "일정 추가" 화면을 미리 채워 여는 링크. 저장은 사용자가 눌러야 한다 —
 * 확인 없이 남의 캘린더에 쓰려면 OAuth 가 필요하다.
 *
 * dates 는 .ics 의 DTSTART/DTEND 와 같은 값을 쓴다. 두 경로가 갈라지면 같은 캡슐이
 * 캘린더마다 다른 시각에 잡힌다.
 */
export function buildGoogleCalendarUrl(input: {
  title: string;
  openAt: Date;
  url: string;
}): string {
  const { title, openAt, url } = input;

  const start = formatIcsUtc(openAt);
  const end = formatIcsUtc(new Date(openAt.getTime() + HOUR_MS));

  const params = [
    "action=TEMPLATE",
    `text=${encodeURIComponent(`${title} 상자가 열리는 날`)}`,
    `dates=${start}%2F${end}`,
    `details=${encodeURIComponent(`${title} 상자가 열렸어요. 링크에서 편지를 확인해 보세요.\n${url}`)}`,
  ];

  return `${GOOGLE_RENDER_URL}?${params.join("&")}`;
}
