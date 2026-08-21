import { describe, expect, it } from "vitest";

import { getCapsuleStatus } from "@/domain/capsule";
import { getCapsulePeriod } from "@/features/capsule/model/capsulePeriod";
import type { CapsulePublic } from "@/lib/dbColumns";

const CAPSULE: CapsulePublic = {
  id: "5f6a3c1e-0b2d-4e8a-9c7b-1d3f5a7c9e1b",
  slug: "quiet-moon-4821",
  title: "2027년, 우리에게",
  write_until: "2027-01-01T00:00:00+00:00",
  open_at: "2027-03-01T00:00:00+00:00",
  created_at: "2026-08-21T02:30:00+00:00",
};

describe("getCapsulePeriod", () => {
  it("두 시각을 Date 로 되돌린다", () => {
    const period = getCapsulePeriod(CAPSULE);

    expect(period.writeUntil.getTime()).toBe(
      Date.parse("2027-01-01T00:00:00.000Z"),
    );
    expect(period.openAt.getTime()).toBe(
      Date.parse("2027-03-01T00:00:00.000Z"),
    );
  });

  it("+00:00 과 Z 를 같게 읽는다", () => {
    const withOffset = getCapsulePeriod(CAPSULE);
    const withZ = getCapsulePeriod({
      ...CAPSULE,
      write_until: "2027-01-01T00:00:00Z",
      open_at: "2027-03-01T00:00:00Z",
    });

    expect(withOffset.writeUntil.getTime()).toBe(withZ.writeUntil.getTime());
    expect(withOffset.openAt.getTime()).toBe(withZ.openAt.getTime());
  });

  it("KST 가 아닌 오프셋도 그대로 읽는다", () => {
    const period = getCapsulePeriod({
      ...CAPSULE,
      write_until: "2027-01-01T09:00:00+09:00",
    });

    expect(period.writeUntil.getTime()).toBe(
      Date.parse("2027-01-01T00:00:00.000Z"),
    );
  });

  it("getCapsuleStatus 에 그대로 넣을 수 있다", () => {
    const period = getCapsulePeriod(CAPSULE);

    expect(getCapsuleStatus(period, new Date("2026-12-31T00:00:00Z"))).toBe(
      "WRITING",
    );
    expect(getCapsuleStatus(period, new Date("2027-02-01T00:00:00Z"))).toBe(
      "LOCKED",
    );
    expect(getCapsuleStatus(period, new Date("2027-04-01T00:00:00Z"))).toBe(
      "OPENED",
    );
  });

  it("인자를 변형하지 않는다", () => {
    const capsule = { ...CAPSULE };

    getCapsulePeriod(capsule);

    expect(capsule).toEqual(CAPSULE);
  });
});
