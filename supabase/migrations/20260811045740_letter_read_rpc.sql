-- T2 후속: 편지 열람 RPC
--
-- 20260811005629 는 생성·수정만 열었다. 그런데 letters_select_after_open 정책이
-- open_at 이전에는 행 자체를 가리므로, 작성자가 수정 화면에서 자기 편지 내용을
-- 먼저 확인할 방법이 없었다. get_capsule_summary 는 닉네임 목록만 주고,
-- update_letter 는 덮어쓴 뒤에야 반환하므로 둘 다 열람 경로가 되지 못한다.
--
-- 그래서 읽기도 security definer RPC 로만 연다. 검증 절차는 update_letter 와 동일하고
-- UPDATE 대신 SELECT 만 한다. 반환 타입에 password_hash 는 없다 (docs/decisions.md §4, §7).
--
-- 에러 코드는 20260811005629 의 것을 그대로 쓴다.
--   SB001  캡슐 없음 (slug 불일치)
--   SB002  인증 실패 (닉네임 없음 또는 비밀번호 불일치)
--   SB003  입력 기간 종료 (now() >= write_until)
--   SB005  비밀번호 형식 오류 (빈 값 또는 72바이트 초과)


-- ---------------------------------------------------------------------------
-- 1. get_letter
-- ---------------------------------------------------------------------------

-- 읽기 전용이지만 stable 이 아니라 volatile 이다. PostgREST 는 stable 함수에 GET 을
-- 허용하는데, 그러면 비밀번호가 URL 쿼리스트링에 실려 액세스 로그·브라우저 히스토리·
-- 리퍼러에 남는다. volatile 로 두면 POST 로만 호출된다.
create or replace function public.get_letter(
  p_slug     text,
  p_nickname text,
  p_password text
)
returns table (
  id         uuid,
  capsule_id uuid,
  nickname   text,
  content    text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_capsule_id  uuid;
  v_write_until timestamptz;
  v_letter_id   uuid;
  v_hash        text;
begin
  if octet_length(coalesce(p_password, '')) not between 1 and 72 then
    raise exception using
      errcode = 'SB005',
      message = '비밀번호 형식이 올바르지 않습니다.';
  end if;

  select c.id, c.write_until
    into v_capsule_id, v_write_until
    from public.capsules c
   where c.slug = p_slug;

  if not found then
    raise exception using
      errcode = 'SB001',
      message = '캡슐을 찾을 수 없습니다.';
  end if;

  -- 열람도 WRITING 구간에서만 허용한다. 잠긴 뒤에는 작성자 본인도 볼 수 없다
  -- (docs/decisions.md §2 "만료 전에는 아무도 못 본다").
  if now() >= v_write_until then
    raise exception using
      errcode = 'SB003',
      message = '편지 열람 기간이 끝났습니다.';
  end if;

  select l.id, l.password_hash
    into v_letter_id, v_hash
    from public.letters l
   where l.capsule_id = v_capsule_id
     and l.nickname = btrim(p_nickname);

  if not found or v_hash <> extensions.crypt(p_password, v_hash) then
    raise exception using
      errcode = 'SB002',
      message = '닉네임 또는 비밀번호가 일치하지 않습니다.';
  end if;

  return query
    select l.id, l.capsule_id, l.nickname, l.content, l.created_at, l.updated_at
      from public.letters l
     where l.id = v_letter_id;
end;
$$;

comment on function public.get_letter(text, text, text) is
  '닉네임 + 비밀번호로 검증한 뒤 편지 본문을 반환한다. 해시는 반환하지 않는다. '
  '입력 마감(write_until) 이전에만 허용. 실패 시 SB001/SB002/SB003/SB005.';


-- ---------------------------------------------------------------------------
-- 2. 권한
-- ---------------------------------------------------------------------------

revoke all on function public.get_letter(text, text, text)
  from public, anon, authenticated;

grant execute on function public.get_letter(text, text, text)
  to anon, authenticated;

-- 20260810031725 와 같은 이유: db push 가 쓰는 역할에는 Supabase 의 default privileges 가
-- 걸려 있지 않아 postgres/service_role 도 명시적으로 부여해야 한다.
grant execute on function public.get_letter(text, text, text)
  to postgres, service_role;


-- ---------------------------------------------------------------------------
-- 3. 스키마 캐시 리로드
-- ---------------------------------------------------------------------------

notify pgrst, 'reload schema';
