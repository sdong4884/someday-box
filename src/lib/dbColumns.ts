import type { Tables } from "@/types/database";

/**
 * anon 에 select 권한이 있는 컬럼. 마이그레이션의 GRANT 목록과 일치해야 한다.
 * (supabase/migrations/20260810031121_init_capsule_schema.sql)
 */
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
 * 조회 시 항상 이 상수를 쓴다.
 *
 * 해시 컬럼을 가리려고 컬럼 단위 GRANT 를 쓰기 때문에(docs/decisions.md §7),
 * supabase-js 의 기본 select() 가 보내는 `*` 는 전 컬럼 권한을 요구해
 * 42501 permission denied 로 실패한다.
 *
 * supabase-js 가 결과 타입을 추론하려면 리터럴이어야 해서 키 배열을 join 하지 않고
 * 문자열을 직접 적는다. 둘이 어긋나는 것은 dbColumns.test.ts 가 잡는다.
 */
export const CAPSULE_PUBLIC_COLUMNS =
  "id, slug, title, write_until, open_at, created_at" as const;

export const LETTER_PUBLIC_COLUMNS =
  "id, capsule_id, nickname, content, created_at, updated_at" as const;

/**
 * 생성된 Tables<> 에는 해시 컬럼이 그대로 들어있다 — `supabase gen types` 는
 * GRANT 가 아니라 테이블 구조를 반영하기 때문이다. 조회 결과에는 이 타입을 쓴다.
 */
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
