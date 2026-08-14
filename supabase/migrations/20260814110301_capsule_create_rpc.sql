-- T7: 캡슐 생성 RPC
--
-- capsules 는 T1(20260810031121)에서 SELECT 컬럼 권한만 열려 있고 INSERT 는 grant 도
-- policy 도 없다. 여기서도 테이블 권한은 열지 않는다 — slug 를 클라이언트가 지정할 수
-- 없어야 하고(docs/decisions.md §8), 기간 규칙도 서버가 최종 판정해야 하기 때문에
-- 쓰기 경로는 security definer RPC 하나로만 연다.
--
-- 함수 소유자는 capsules 의 소유자와 같은 역할이라 RLS 를 적용받지 않는다.
-- create_letter(20260811005629)가 letters 에 INSERT 하는 것과 같은 구조다.
--
-- 실패는 예외 + 앱 전용 SQLSTATE 로 알린다. T2 의 SB00x 체계를 이어서 쓴다.
--   SB006  제목 길이 오류 (btrim 후 1~20자 아님)
--   SB007  날짜가 과거 (write_until 또는 open_at 이 현재 시각 이전)
--   SB008  기간 순서 오류 (write_until >= open_at)
--   SB009  만료일 상한 초과 (open_at > now() + 10년)
--
-- 폼(src/features/capsule/model/createCapsuleSchema.ts)이 같은 규칙을 먼저 거르지만,
-- 그건 문구를 보여주기 위한 앞단이고 판정은 여기서 한 번 더 한다.


-- ---------------------------------------------------------------------------
-- 1. admin_password_hash 를 nullable 로
-- ---------------------------------------------------------------------------

-- 관리 기능(캡슐 삭제·수정)은 MVP 범위에서 뺐다. 컬럼은 나중에 되살릴 여지를 남겨
-- 그대로 두되, 값 없이 캡슐을 만들 수 있어야 하므로 NOT NULL 만 푼다.
alter table public.capsules
  alter column admin_password_hash drop not null;

comment on column public.capsules.admin_password_hash is
  '관리자 비밀번호 해시. MVP 에서는 관리 기능이 없어 항상 null 이다. '
  'anon/authenticated 에 SELECT 권한을 주지 않는다.';


-- ---------------------------------------------------------------------------
-- 2. create_capsule
-- ---------------------------------------------------------------------------

-- slug 는 INSERT 목록에서 뺀다. capsules.slug 의 DEFAULT 인 generate_capsule_slug()
-- 가 값을 만들고, 그래야 클라이언트가 slug 를 선점할 경로가 생기지 않는다.
--
-- 제목은 btrim 해서 저장한다. 테이블 CHECK 는 char_length(btrim(title)) 로 보지만
-- 저장은 원본이라, 트림하지 않으면 앞뒤 공백이 그대로 화면에 나온다.
--
-- 길이 상한은 20자다. 테이블의 capsules_title_length 는 1~60자로 더 느슨하지만
-- 적용된 마이그레이션은 고치지 않으므로, 실질 상한은 이 함수와 폼의 20자다
-- (CAPSULE_TITLE_MAX_LENGTH). 좁은 쪽이 먼저 걸리므로 CHECK 와 충돌하지 않는다.
--
-- 날짜 비교의 now() 는 트랜잭션 시각이라 검증과 INSERT 가 같은 시각을 본다.
-- created_at 도 같은 now() 라서 capsules_period_order / capsules_open_at_max 가
-- 여기서 통과시킨 값을 다시 거부하는 일은 없다.
create or replace function public.create_capsule(
  p_title       text,
  p_write_until timestamptz,
  p_open_at     timestamptz
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_title text := btrim(coalesce(p_title, ''));
  v_slug  text;
begin
  if char_length(v_title) not between 1 and 20 then
    raise exception using
      errcode = 'SB006',
      message = '제목은 1~20자여야 합니다.';
  end if;

  -- null 을 따로 걸러낸다. null 을 비교에 넣으면 조건이 null 이 되어 검증을 그대로
  -- 통과하고, NOT NULL 위반(23502)이라는 엉뚱한 코드로 실패한다.
  if p_write_until is null or p_write_until <= now() then
    raise exception using
      errcode = 'SB007',
      message = '입력 마감일은 현재 시각 이후여야 합니다.';
  end if;

  if p_open_at is null or p_open_at <= now() then
    raise exception using
      errcode = 'SB007',
      message = '만료일은 현재 시각 이후여야 합니다.';
  end if;

  if p_write_until >= p_open_at then
    raise exception using
      errcode = 'SB008',
      message = '만료일은 입력 마감일보다 뒤여야 합니다.';
  end if;

  if p_open_at > now() + interval '10 years' then
    raise exception using
      errcode = 'SB009',
      message = '만료일은 10년 이내여야 합니다.';
  end if;

  insert into public.capsules (title, write_until, open_at)
  values (v_title, p_write_until, p_open_at)
  returning slug into v_slug;

  return v_slug;
end;
$$;

comment on function public.create_capsule(text, timestamptz, timestamptz) is
  '캡슐을 생성하고 공유용 slug 를 반환한다. slug 는 DB DEFAULT 가 만들고 '
  'admin_password_hash 는 null 이다. 실패 시 SB006/SB007/SB008/SB009.';


-- ---------------------------------------------------------------------------
-- 3. 권한
-- ---------------------------------------------------------------------------

-- T1 의 revoke all 로 이미 없는 상태다. 쓰기는 RPC 로만 연다는 의도를 코드에 남긴다.
revoke insert, update, delete on table public.capsules from anon, authenticated;

-- 함수는 기본적으로 public 에 EXECUTE 가 부여되므로 회수 후 명시적으로 재부여한다.
revoke all on function public.create_capsule(text, timestamptz, timestamptz)
  from public, anon, authenticated;

grant execute on function public.create_capsule(text, timestamptz, timestamptz)
  to anon, authenticated;

-- 20260810031725 와 같은 이유: db push 가 쓰는 역할에는 Supabase 의 default privileges 가
-- 걸려 있지 않아 postgres/service_role 도 명시적으로 부여해야 한다.
grant execute on function public.create_capsule(text, timestamptz, timestamptz)
  to postgres, service_role;


-- ---------------------------------------------------------------------------
-- 4. 스키마 캐시 리로드
-- ---------------------------------------------------------------------------

notify pgrst, 'reload schema';
