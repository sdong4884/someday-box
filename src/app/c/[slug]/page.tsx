import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCapsuleBySlug } from "@/features/capsule/api/getCapsule";
import { buildCapsuleMetadata } from "@/features/capsule/model/capsuleMetadata";
import { CapsuleScreen } from "@/features/capsule/ui/CapsuleScreen";
import { NOINDEX_ROBOTS, resolveSiteUrl } from "@/lib/siteMetadata";

export async function generateMetadata({
  params,
}: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;

  const capsule = await getCapsuleBySlug(slug).catch(() => null);

  // 조회가 흔들려도 색인 차단만은 남긴다.
  if (!capsule) return { robots: NOINDEX_ROBOTS };

  return buildCapsuleMetadata(capsule);
}

export default async function CapsulePage({ params }: PageProps<"/c/[slug]">) {
  const { slug } = await params;
  const capsule = await getCapsuleBySlug(slug);

  if (!capsule) notFound();

  return (
    <main className="flex flex-1 flex-col">
      <CapsuleScreen
        capsule={capsule}
        capsuleUrl={new URL(`/c/${slug}`, resolveSiteUrl(process.env)).toString()}
      />
    </main>
  );
}
