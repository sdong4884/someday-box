import { notFound } from "next/navigation";

import { getCapsuleBySlug } from "@/features/capsule/api/getCapsule";
import { CapsuleScreen } from "@/features/capsule/ui/CapsuleScreen";

export default async function CapsulePage({
  params,
}: PageProps<"/c/[slug]">) {
  const { slug } = await params;
  const capsule = await getCapsuleBySlug(slug);

  if (!capsule) notFound();

  return (
    <main className="flex flex-1 flex-col px-5 py-6">
      <CapsuleScreen capsule={capsule} />
    </main>
  );
}
