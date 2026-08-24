import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCapsuleBySlug } from "@/features/capsule/api/getCapsule";
import { WriteLetterScreen } from "@/features/letter/ui/WriteLetterScreen";

export const metadata: Metadata = {
  title: "편지 쓰기 — Someday Box",
  robots: { index: false },
};

export default async function WriteLetterPage({
  params,
}: PageProps<"/c/[slug]/write">) {
  const { slug } = await params;
  const capsule = await getCapsuleBySlug(slug);

  if (!capsule) notFound();

  return (
    <main className="flex flex-1 flex-col">
      <WriteLetterScreen capsule={capsule} />
    </main>
  );
}
