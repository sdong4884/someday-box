-- T7 후속: create_capsule 의 에러 코드 분리
--
-- 20260814110301 은 검증 규칙이 5개인데 코드는 4개였다. 두 날짜의 과거 검사가 SB007 을
-- 함께 썼기 때문이다. 캡슐 생성 폼은 실패 문구를 해당 입력칸에 붙여야 하는데, SB007
-- 하나로는 입력 마감일과 만료일 중 어느 쪽이 문제인지 구분할 수 없다.
--
-- 그래서 SB007 의 의미를 write_until 쪽으로 좁히고, open_at 과거에는 SB010 을 새로 준다.
-- SB006/SB008/SB009 는 의미가 그대로다.
--
-- 함수 시그니처는 바뀌지 않으므로 src/types/database.ts 는 재생성하지 않아도 된다.
--
-- 분리 후의 최종 표 (괄호는 폼 필드):
--   SB006  제목 길이 오류 (btrim 후 1~20자 아님)            title
--   SB007  입력 마감일이 현재 시각 이전 (null 포함)          writeUntil
--   SB008  기간 순서 오류 (write_until >= open_at)          openAt
--   SB009  만료일 상한 초과 (open_at > now() + 10년)         openAt
--   SB010  만료일이 현재 시각 이전 (null 포함) — 신규        openAt
--
-- 검증 순서는 20260814110301 그대로 둔다 (제목 → 입력 마감일 과거 → 만료일 과거 →
-- 순서 → 10년). 그래서 번호 순서와 검증 순서가 어긋나는데, 이미 적용된 마이그레이션의
-- 코드 의미를 그대로 두는 쪽을 택한 결과다.


-- ---------------------------------------------------------------------------
-- 1. create_capsule
-- ---------------------------------------------------------------------------

-- 본문은 20260814110301 과 같고 만료일 과거 분기의 errcode 만 SB007 → SB010 이다.
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
      errcode = 'SB010',
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
  'admin_password_hash 는 null 이다. 실패 시 SB006/SB007/SB008/SB009/SB010.';


-- ---------------------------------------------------------------------------
-- 2. 권한
-- ---------------------------------------------------------------------------

-- create or replace 는 기존 ACL 을 보존하므로 재부여가 필수는 아니다. 다만 이 파일만
-- 읽어도 누가 호출할 수 있는지 알 수 있도록 20260814110301 과 같은 내용을 다시 적는다.
revoke all on function public.create_capsule(text, timestamptz, timestamptz)
  from public, anon, authenticated;

grant execute on function public.create_capsule(text, timestamptz, timestamptz)
  to anon, authenticated;

grant execute on function public.create_capsule(text, timestamptz, timestamptz)
  to postgres, service_role;


-- ---------------------------------------------------------------------------
-- 3. 스키마 캐시 리로드
-- ---------------------------------------------------------------------------

notify pgrst, 'reload schema';
