import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCapsuleBySlug } from "@/features/capsule/api/getCapsule";
import { buildCapsuleDescription } from "@/features/capsule/model/capsuleMetadata";
import { getCapsulePeriod } from "@/features/capsule/model/capsulePeriod";
import { CapsuleScreen } from "@/features/capsule/ui/CapsuleScreen";
import { OG_DEFAULTS, resolveSiteUrl } from "@/lib/siteMetadata";

export async function generateMetadata({
  params,
}: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;

  const capsule = await getCapsuleBySlug(slug).catch(() => null);

  if (!capsule) return {};

  const description = buildCapsuleDescription(getCapsulePeriod(capsule));

  return {
    title: capsule.title,
    description,
    openGraph: {
      ...OG_DEFAULTS,
      title: capsule.title,
      description,
      url: `/c/${slug}`,
    },
  };
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
