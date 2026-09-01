import type { Tables } from "@/types/database";

/** 마이그레이션의 GRANT 목록과 일치해야 한다. */
export const CAPSULE_PUBLIC_COLUMN_KEYS = [
  "id",
  "slug",
  "title",
  "write_until",
  "open_at",
  "created_at",
] as const;

export const LETTER_PUBLIC_COLUMN_KEYS = [
  "id",
  "capsule_id",
  "nickname",
  "content",
  "created_at",
  "updated_at",
] as const;

/**
 * 조회 시 항상 이 상수를 쓴다. 컬럼 단위 GRANT 때문에(docs/decisions.md §7)
 * `select('*')` 는 42501 permission denied 로 실패한다.
 *
 * 키 배열을 join 하지 않는 것은 supabase-js 의 타입 추론이 리터럴을 요구해서다.
 */
export const CAPSULE_PUBLIC_COLUMNS =
  "id, slug, title, write_until, open_at, created_at" as const;

export const LETTER_PUBLIC_COLUMNS =
  "id, capsule_id, nickname, content, created_at, updated_at" as const;

/** `supabase gen types` 는 GRANT 가 아니라 테이블 구조를 반영해 해시 컬럼까지 담는다. */
export type CapsulePublic = Pick<
  Tables<"capsules">,
  (typeof CAPSULE_PUBLIC_COLUMN_KEYS)[number]
>;

export type LetterPublic = Pick<
  Tables<"letters">,
  (typeof LETTER_PUBLIC_COLUMN_KEYS)[number]
>;

/** 해시 컬럼이 공개 목록에 섞이면 여기서 컴파일이 깨진다. */
type NonSecret<T, S extends keyof T> = Exclude<keyof T, S>;

const _capsuleKeysAreNonSecret: NonSecret<
  Tables<"capsules">,
  "admin_password_hash"
>[] = [...CAPSULE_PUBLIC_COLUMN_KEYS];

const _letterKeysAreNonSecret: NonSecret<
  Tables<"letters">,
  "password_hash"
>[] = [...LETTER_PUBLIC_COLUMN_KEYS];

void _capsuleKeysAreNonSecret;
void _letterKeysAreNonSecret;
