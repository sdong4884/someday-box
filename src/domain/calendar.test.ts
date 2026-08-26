import { describe, expect, it } from "vitest";

import { buildCapsuleIcs, type CapsuleIcsInput } from "@/domain/calendar";

/** KST 2026-09-01 00:00 = UTC 2026-08-31 15:00. */
const OPEN_AT = new Date("2026-08-31T15:00:00.000Z");
const NOW = new Date("2026-08-26T01:23:45.000Z");

const BASE: CapsuleIcsInput = {
  slug: "FSeE0btpFJ",
  title: "졸업 10주년",
  openAt: OPEN_AT,
  url: "https://someday.box/c/FSeE0btpFJ",
  now: NOW,
};

const build = (patch: Partial<CapsuleIcsInput> = {}) =>
  buildCapsuleIcs({ ...BASE, ...patch });

/** 물리적인 줄 목록. 마지막 CRLF 때문에 생기는 빈 조각은 뺀다. */
const linesOf = (ics: string) => ics.split("\r\n").slice(0, -1);

/** 접힌 줄을 원래 한 줄로 되돌린다. */
const unfold = (ics: string) => ics.replace(/\r\n /g, "");

const octets = (value: string) => new TextEncoder().encode(value).length;

describe("buildCapsuleIcs", () => {
  describe("기본 필드", () => {
    const lines = linesOf(build());

    it("VCALENDAR 로 열고 닫는다", () => {
      expect(lines[0]).toBe("BEGIN:VCALENDAR");
      expect(lines.at(-1)).toBe("END:VCALENDAR");
    });

    it("VERSION 과 CALSCALE 이 있다", () => {
      expect(lines).toContain("VERSION:2.0");
      expect(lines).toContain("CALSCALE:GREGORIAN");
    });

    it("VEVENT 가 한 벌 들어 있다", () => {
      expect(lines).toContain("BEGIN:VEVENT");
      expect(lines).toContain("END:VEVENT");
    });

    // slug 로 고정해야 다시 받았을 때 캘린더가 일정을 두 개로 만들지 않는다.
    it("UID 는 slug 로 만든다", () => {
      expect(lines).toContain("UID:FSeE0btpFJ@someday-box");
    });

    it("SUMMARY 는 '{제목} 상자가 열리는 날' 이다", () => {
      expect(lines).toContain("SUMMARY:졸업 10주년 상자가 열리는 날");
    });

    it("DESCRIPTION 에 url 이 들어간다", () => {
      const description = unfold(build())
        .split("\r\n")
        .find((line) => line.startsWith("DESCRIPTION:졸업"));

      expect(description).toContain("https://someday.box/c/FSeE0btpFJ");
    });

    it("제목이 바뀌면 SUMMARY 도 따라간다", () => {
      expect(linesOf(build({ title: "우리 반" }))).toContain(
        "SUMMARY:우리 반 상자가 열리는 날",
      );
    });
  });

  describe("날짜 포맷", () => {
    const lines = linesOf(build());

    it("DTSTAMP 는 now 를 UTC 로 찍는다", () => {
      expect(lines).toContain("DTSTAMP:20260826T012345Z");
    });

    it("DTSTART 는 openAt 을 UTC 로 찍는다 — KST 자정이 전날 15:00Z 다", () => {
      expect(lines).toContain("DTSTART:20260831T150000Z");
    });

    it("DTEND 는 한 시간 뒤다", () => {
      expect(lines).toContain("DTEND:20260831T160000Z");
    });

    it("한 자리 수 월·일·시에 0 을 채운다", () => {
      const padded = linesOf(
        build({
          openAt: new Date("2027-01-02T03:04:05.000Z"),
          now: new Date("2027-01-02T03:04:05.000Z"),
        }),
      );

      expect(padded).toContain("DTSTART:20270102T030405Z");
      expect(padded).toContain("DTSTAMP:20270102T030405Z");
    });

    it("자정을 넘겨 끝나는 경우에도 DTEND 가 맞는다", () => {
      expect(
        linesOf(build({ openAt: new Date("2026-12-31T23:30:00.000Z") })),
      ).toContain("DTEND:20270101T003000Z");
    });
  });

  describe("텍스트 이스케이프", () => {
    it("쉼표를 이스케이프한다", () => {
      expect(linesOf(build({ title: "2027년, 우리에게" }))).toContain(
        "SUMMARY:2027년\\, 우리에게 상자가 열리는 날",
      );
    });

    it("세미콜론을 이스케이프한다", () => {
      expect(linesOf(build({ title: "가;나" }))).toContain(
        "SUMMARY:가\\;나 상자가 열리는 날",
      );
    });

    it("역슬래시를 이스케이프한다", () => {
      expect(linesOf(build({ title: "가\\나" }))).toContain(
        "SUMMARY:가\\\\나 상자가 열리는 날",
      );
    });

    it("줄바꿈을 \\n 으로 바꾼다", () => {
      expect(linesOf(build({ title: "가\n나" }))).toContain(
        "SUMMARY:가\\n나 상자가 열리는 날",
      );
    });

    /*
     * 역슬래시를 먼저 바꾸지 않으면, 쉼표 이스케이프가 만든 역슬래시가 다시 escape 되어
     * `\\,` 가 된다. 두 문자가 함께 있어야 순서가 드러난다.
     */
    it("역슬래시를 먼저 바꾼다 — 이미 넣은 이스케이프를 다시 건드리지 않는다", () => {
      expect(linesOf(build({ title: "a\\b,c" }))).toContain(
        "SUMMARY:a\\\\b\\,c 상자가 열리는 날",
      );
    });
  });

  describe("CRLF", () => {
    it("마지막 줄도 CRLF 로 끝난다", () => {
      expect(build().endsWith("\r\n")).toBe(true);
    });

    it("\\r 없는 개행이 하나도 없다", () => {
      const bare = build().match(/(?<!\r)\n/g) ?? [];

      expect(bare).toHaveLength(0);
    });

    it("제목의 줄바꿈이 실제 개행으로 새어 나오지 않는다", () => {
      const ics = build({ title: "가\n나" });

      expect((ics.match(/(?<!\r)\n/g) ?? []).length).toBe(0);
    });
  });

  describe("75옥텟 줄 접기", () => {
    const LONG_TITLE = "아주아주긴제목".repeat(12);
    const folded = build({ title: LONG_TITLE });

    it("모든 줄이 75옥텟 이하다", () => {
      for (const line of linesOf(folded)) {
        expect(octets(line)).toBeLessThanOrEqual(75);
      }
    });

    it("짧은 줄은 접지 않는다", () => {
      expect(linesOf(build())).toContain("BEGIN:VCALENDAR");
    });

    it("이어지는 줄은 스페이스로 시작한다", () => {
      const continuations = linesOf(folded).filter((l) => l.startsWith(" "));

      expect(continuations.length).toBeGreaterThan(0);
    });

    /*
     * 한글 한 자가 3바이트라 바이트로 그냥 자르면 글자가 깨진다. 접은 것을 도로 이어
     * 붙였을 때 원문이 그대로 나와야 시퀀스를 쪼개지 않았다는 뜻이다.
     */
    it("접었다 펴면 원문이 그대로 복원된다", () => {
      expect(unfold(folded)).toContain(`SUMMARY:${LONG_TITLE} 상자가 열리는 날`);
    });

    it("접힌 뒤에도 줄 수가 늘어날 뿐 내용은 같다", () => {
      expect(linesOf(folded).length).toBeGreaterThan(linesOf(build()).length);
    });
  });

  describe("VALARM", () => {
    const lines = linesOf(build());

    it("하루 전 알림이 VALARM 블록 안에 있다", () => {
      const start = lines.indexOf("BEGIN:VALARM");
      const end = lines.indexOf("END:VALARM");
      const trigger = lines.indexOf("TRIGGER:-P1D");

      expect(start).toBeGreaterThan(-1);
      expect(trigger).toBeGreaterThan(start);
      expect(trigger).toBeLessThan(end);
    });

    it("ACTION 이 DISPLAY 다", () => {
      expect(lines).toContain("ACTION:DISPLAY");
    });

    it("VALARM 은 VEVENT 안에 있다", () => {
      expect(lines.indexOf("BEGIN:VALARM")).toBeGreaterThan(
        lines.indexOf("BEGIN:VEVENT"),
      );
      expect(lines.indexOf("END:VALARM")).toBeLessThan(
        lines.indexOf("END:VEVENT"),
      );
    });
  });
});
