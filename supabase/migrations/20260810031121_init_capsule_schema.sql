-- T1: capsules / letters 스키마와 RLS 정책
--
-- 만료 전 열람 차단은 DB가 담당한다 (docs/decisions.md §2).
-- 테이블마다 `enable RLS` + `grant` + `policy` 를 한 세트로 건다 (CLAUDE.md 핵심 규칙 3).
--
-- 두 종류의 비밀번호 해시(capsules.admin_password_hash, letters.password_hash)는
-- 컬럼 단위 GRANT 에서 제외해 클라이언트로 내려가지 않게 한다 (docs/decisions.md §4).


-- ---------------------------------------------------------------------------
-- 0. 확장
-- ---------------------------------------------------------------------------

-- gen_random_bytes() (slug 생성). 후속 작업의 crypt()/gen_salt() 도 여기 얹힌다.
-- gen_random_uuid() 는 PG13+ 내장이라 확장이 필요 없다.
create extension if not exists pgcrypto with schema extensions;


-- ---------------------------------------------------------------------------
-- 1. slug 생성 함수
-- ---------------------------------------------------------------------------

-- URL-safe 64자 알파벳: 256 % 64 = 0 이라 modulo bias 가 없다.
-- 10자 = 60비트. 충돌 확률은 무시할 수준이지만, unique 위반으로 캡슐 생성이
-- 실패하는 것보다 재시도가 낫다.
create or replace function public.generate_capsule_slug()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text :=
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  candidate text;
begin
  loop
    select string_agg(
             substr(alphabet, (get_byte(bytes, i) % 64) + 1, 1), '' order by i)
      into candidate
      from (select extensions.gen_random_bytes(10) as bytes) s,
           generate_series(0, 9) as i;

    exit when not exists (select 1 from public.capsules where slug = candidate);
  end loop;

  return candidate;
end;
$$;

comment on function public.generate_capsule_slug() is
  '링크 공유용 slug 를 생성한다. URL-safe 64자 알파벳 10자리(60비트), 충돌 시 재시도.';


-- ---------------------------------------------------------------------------
-- 2. capsules
-- ---------------------------------------------------------------------------

create table public.capsules (
  id                  uuid        primary key default gen_random_uuid(),
  slug                text        not null unique default public.generate_capsule_slug(),
  title               text        not null,
  admin_password_hash text        not null,
  write_until         timestamptz not null,
  open_at             timestamptz not null,
  created_at          timestamptz not null default now(),

  -- docs/decisions.md §6: 입력 마감일 < 만료일, 둘 다 생성일 이후, 만료일 상한 10년.
  -- now() 대신 created_at 을 기준으로 써서 제약이 immutable 하게 유지된다.
  constraint capsules_title_length  check (char_length(btrim(title)) between 1 and 60),
  constraint capsules_period_order  check (created_at < write_until and write_until < open_at),
  constraint capsules_open_at_max   check (open_at <= created_at + interval '10 years')
);

comment on column public.capsules.admin_password_hash is
  '관리자 비밀번호 해시. anon/authenticated 에 SELECT 권한을 주지 않는다.';


-- ---------------------------------------------------------------------------
-- 3. letters
-- ---------------------------------------------------------------------------

create table public.letters (
  id            uuid        primary key default gen_random_uuid(),
  capsule_id    uuid        not null references public.capsules(id) on delete cascade,
  nickname      text        not null,
  content       text        not null,
  password_hash text        not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint letters_nickname_length check (char_length(btrim(nickname)) between 1 and 20),
  constraint letters_content_length  check (char_length(btrim(content))  between 1 and 2000),
  -- 편지 수정은 닉네임 + 비밀번호로 검증하므로 (docs/decisions.md §4)
  -- 캡슐 안에서 닉네임이 편지를 식별해야 한다.
  constraint letters_nickname_unique unique (capsule_id, nickname)
);

create index letters_capsule_id_idx on public.letters (capsule_id);

comment on column public.letters.password_hash is
  '편지 수정용 비밀번호 해시. anon/authenticated 에 SELECT 권한을 주지 않는다.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger letters_set_updated_at
  before update on public.letters
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 4. capsules — enable RLS + grant + policy
-- ---------------------------------------------------------------------------

alter table public.capsules enable row level security;

-- Supabase 는 public 스키마 신규 테이블에 anon/authenticated 전체 권한을 기본 부여한다.
-- 반드시 회수한 뒤 필요한 컬럼만 다시 준다.
revoke all on table public.capsules from anon, authenticated;

-- admin_password_hash 제외. Postgres 는 WHERE 절이 참조하는 컬럼에도 SELECT 권한을
-- 요구하므로 ?admin_password_hash=eq.… 같은 필터로 값을 캐는 경로도 함께 막힌다.
grant select (id, slug, title, write_until, open_at, created_at)
  on table public.capsules to anon, authenticated;

-- 잠김 화면에 제목과 D-day 를 보여야 하므로 행 자체는 전부 공개한다.
create policy "capsules_select_public"
  on public.capsules for select
  to anon, authenticated
  using (true);


-- ---------------------------------------------------------------------------
-- 5. letters — enable RLS + grant + policy
-- ---------------------------------------------------------------------------

alter table public.letters enable row level security;

revoke all on table public.letters from anon, authenticated;

-- password_hash 제외 — 공개 이후에도 클라이언트로 내려가지 않는다.
grant select (id, capsule_id, nickname, content, created_at, updated_at)
  on table public.letters to anon, authenticated;

-- 만료 전에는 행 자체가 보이지 않는다. now() 는 트랜잭션 시각이라 한 쿼리 안에서
-- 일관되며, 서브쿼리는 capsules 의 공개 정책과 컬럼 권한 안에서 통과한다.
create policy "letters_select_after_open"
  on public.letters for select
  to anon, authenticated
  using (
    exists (
      select 1
        from public.capsules c
       where c.id = letters.capsule_id
         and now() >= c.open_at
    )
  );

-- INSERT/UPDATE/DELETE 는 grant 도 policy 도 없다 → anon 은 전부 거부된다.
-- 편지 작성·수정 경로는 후속 작업에서 연다.


-- ---------------------------------------------------------------------------
-- 6. get_capsule_summary
-- ---------------------------------------------------------------------------

-- 잠김 상태에서도 참여 현황을 보여주기 위한 함수. letters 의 SELECT 정책을
-- 우회해야 하므로 security definer 이고, 그래서 content 는 절대 반환하지 않는다.
create or replace function public.get_capsule_summary(p_slug text)
returns table (letter_count integer, nicknames text[])
language sql
stable
security definer
set search_path = ''
as $$
  select count(l.id)::int,
         coalesce(
           array_agg(l.nickname order by l.created_at)
             filter (where l.id is not null),
           '{}'::text[])
    from public.capsules c
    left join public.letters l on l.capsule_id = c.id
   where c.slug = p_slug
   group by c.id;
$$;

comment on function public.get_capsule_summary(text) is
  '캡슐의 편지 개수와 닉네임 목록만 반환한다. 잠김 상태에서도 호출 가능하며 content 는 반환하지 않는다.';

-- 함수는 기본적으로 public 에 EXECUTE 가 부여되므로 회수 후 명시적으로 재부여한다.
revoke all on function public.get_capsule_summary(text) from public, anon, authenticated;
grant execute on function public.get_capsule_summary(text) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 7. 스키마 캐시 리로드
-- ---------------------------------------------------------------------------

-- 컬럼 단위 권한 변경을 PostgREST 가 즉시 반영하도록.
notify pgrst, 'reload schema';
