-- #20: 작성 마감일 하루 차이 — 기간 제약을 write_until <= open_at 으로 완화
--
-- 고른 날짜 D 를 D 의 KST 00:00 으로 저장하면 D 하루를 통째로 못 쓴다. 상태 판정이
-- now < write_until 일 때만 WRITING 이라, D 00:00 이 되는 순간 이미 잠기기 때문이다.
-- 폼 힌트는 "이 날짜까지만 편지를 남길 수 있어요" 라고 약속하고 있었으므로 코드를
-- 문구에 맞춘다 — 앱이 D+1 의 KST 00:00 을 저장하도록 바꿨다
-- (src/domain/capsule.ts 의 writeUntilFromKstDate).
--
-- 그 결과 "12/25 까지 쓰고 12/26 에 열림" 이 write_until = open_at = 12/26 00:00 KST
-- 가 된다. 인접한 두 날짜는 가장 자연스러운 조합인데 기존 CHECK 의 strict `<` 가 이를
-- 거부한다. 그래서 같은 순간을 허용한다 — 작성이 멈추는 순간 곧바로 열리는 캡슐이고,
-- getCapsuleStatus 는 이때 LOCKED 없이 WRITING 에서 OPENED 로 넘어간다.
--
-- created_at < write_until 은 그대로 둔다. 만든 순간 이미 잠긴 캡슐은 여전히 막는다.
--
-- 기존 행은 손대지 않는다. 지금 있는 것은 시각이 KST 자정도 아닌 테스트 데이터뿐이라
-- 옮겨서 얻을 것이 없다.


-- ---------------------------------------------------------------------------
-- 1. capsules_period_order
-- ---------------------------------------------------------------------------

alter table public.capsules
  drop constraint capsules_period_order;

alter table public.capsules
  add constraint capsules_period_order
  check (created_at < write_until and write_until <= open_at);


-- ---------------------------------------------------------------------------
-- 2. create_capsule
-- ---------------------------------------------------------------------------

-- 본문은 20260814112913 과 같고 순서 검사만 `>=` → `>` 로 바뀐다. CHECK 가 같은 순간을
-- 허용하는데 RPC 가 계속 거부하면 폼이 통과시킨 값을 서버가 SB008 로 되돌려보낸다.
-- SB008 의 의미("공개일이 작성 마감일보다 앞")는 그대로다.
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

  if p_write_until > p_open_at then
    raise exception using
      errcode = 'SB008',
      message = '만료일은 입력 마감일보다 앞설 수 없습니다.';
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
-- 3. 권한
-- ---------------------------------------------------------------------------

-- create or replace 는 기존 ACL 을 보존하므로 재부여가 필수는 아니다. 다만 이 파일만
-- 읽어도 누가 호출할 수 있는지 알 수 있도록 20260814112913 과 같은 내용을 다시 적는다.
revoke all on function public.create_capsule(text, timestamptz, timestamptz)
  from public, anon, authenticated;

grant execute on function public.create_capsule(text, timestamptz, timestamptz)
  to anon, authenticated;

grant execute on function public.create_capsule(text, timestamptz, timestamptz)
  to postgres, service_role;


-- ---------------------------------------------------------------------------
-- 4. 스키마 캐시 리로드
-- ---------------------------------------------------------------------------

notify pgrst, 'reload schema';
