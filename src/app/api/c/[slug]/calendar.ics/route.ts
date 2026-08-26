import { notFound } from "next/navigation";

import { buildCapsuleIcs } from "@/domain/calendar";
import { getCapsuleBySlug } from "@/features/capsule/api/getCapsule";
import { resolveSiteUrl } from "@/lib/siteMetadata";

/**
 * 클라이언트 Blob 다운로드 대신 라우트로 내려준다 — 카카오톡 인앱 브라우저에서
 * Blob 다운로드가 막히는 경우가 있다.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/c/[slug]/calendar.ics">,
) {
  const { slug } = await params;
  const capsule = await getCapsuleBySlug(slug);

  if (!capsule) notFound();

  const ics = buildCapsuleIcs({
    slug,
    title: capsule.title,
    openAt: new Date(capsule.open_at),
    url: new URL(`/c/${slug}`, resolveSiteUrl(process.env)).toString(),
    now: new Date(),
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // slug 는 URL-safe 64자 알파벳이라 따옴표를 깨뜨릴 문자가 없다.
      "Content-Disposition": `attachment; filename="someday-box-${slug}.ics"`,
      // DTSTAMP 가 요청마다 달라 캐시가 의미 없다.
      "Cache-Control": "no-store",
    },
  });
}
