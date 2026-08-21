import { cache } from "react";

import { CAPSULE_PUBLIC_COLUMNS, type CapsulePublic } from "@/lib/dbColumns";
import { supabase } from "@/lib/supabase";

/** generateMetadata 와 페이지가 같은 요청에서 함께 부른다. cache 가 조회를 1회로 묶는다. */
export const getCapsuleBySlug = cache(
  async (slug: string): Promise<CapsulePublic | null> => {
    const { data, error } = await supabase
      .from("capsules")
      .select(CAPSULE_PUBLIC_COLUMNS)
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;

    return data;
  },
);
