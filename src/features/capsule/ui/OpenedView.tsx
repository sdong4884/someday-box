import { CapsuleSummary } from "@/features/capsule/ui/capsuleParts";
import type { CapsulePublic } from "@/lib/dbColumns";

export function OpenedView({ capsule }: { capsule: CapsulePublic }) {
  return <CapsuleSummary capsule={capsule} status="OPENED" />;
}
