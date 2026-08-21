import type { CapsulePeriod } from "@/domain/capsule";
import type { CapsulePublic } from "@/lib/dbColumns";

export function getCapsulePeriod(capsule: CapsulePublic): CapsulePeriod {
  return {
    writeUntil: new Date(capsule.write_until),
    openAt: new Date(capsule.open_at),
  };
}
