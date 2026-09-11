-- 편지 삭제 RPC
--
-- letters 는 T1(20260810031121)에서 SELECT 컬럼 권한만 열려 있고 DELETE 는 grant 도
-- policy 도 없다. 삭제도 쓰기라 T2(20260811005629)와 같은 구조를 따른다 — 테이블
-- 권한이 아니라 security definer RPC 하나로만 연다.
--
-- 소유권 증명은 update_letter 와 동일하게 닉네임 + 비밀번호다 (docs/decisions.md §4).
-- 새 에러코드를 만들지 않고 T2 의 SB00x 를 그대로 쓴다.
--   SB001  캡슐 없음 (slug 불일치)
--   SB002  인증 실패 (닉네임 없음 또는 비밀번호 불일치)
--   SB003  입력 기간 종료 (now() >= write_until)
--   SB005  비밀번호 형식 오류 (빈 값 또는 72바이트 초과)
--
-- 행을 남기지 않고 지운다. letters_nickname_unique 가 함께 풀려 같은 닉네임으로
-- 다시 쓸 수 있다.


-- ---------------------------------------------------------------------------
-- 1. delete_letter
-- ---------------------------------------------------------------------------

-- 반환은 지운 편지의 id 하나뿐이다. 본문은 돌려주지 않는다 — 호출부가 쓸 일이 없고,
-- 삭제 응답에 원문을 실을 이유도 없다.
create or replace function public.delete_letter(
  p_slug     text,
  p_nickname text,
  p_password text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_capsule_id  uuid;
  v_write_until timestamptz;
  v_letter_id   uuid;
  v_hash        text;
begin
  -- bcrypt 는 72바이트를 넘는 입력을 조용히 잘라내고, 빈 비밀번호도 crypt() 는 통과시킨다.
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

  -- 잠긴 뒤에는 지울 수 없다. 작성·수정·열람과 같은 기준이다.
  if now() >= v_write_until then
    raise exception using
      errcode = 'SB003',
      message = '편지 입력 기간이 끝났습니다.';
  end if;

  select l.id, l.password_hash
    into v_letter_id, v_hash
    from public.letters l
   where l.capsule_id = v_capsule_id
     and l.nickname = btrim(p_nickname);

  -- update_letter 와 같은 이유로 닉네임 없음과 비밀번호 불일치를 구분하지 않는다.
  if not found or v_hash <> extensions.crypt(p_password, v_hash) then
    raise exception using
      errcode = 'SB002',
      message = '닉네임 또는 비밀번호가 일치하지 않습니다.';
  end if;

  delete from public.letters l
   where l.id = v_letter_id;

  return v_letter_id;
end;
$$;

comment on function public.delete_letter(text, text, text) is
  '닉네임 + 비밀번호로 편지를 검증한 뒤 삭제하고 지운 id 를 반환한다. '
  '입력 마감(write_until) 이전에만 허용. 실패 시 SB001/SB002/SB003/SB005.';


-- ---------------------------------------------------------------------------
-- 2. 권한
-- ---------------------------------------------------------------------------

-- T1 의 revoke all 로 이미 없는 상태다. 삭제도 RPC 로만 연다는 의도를 코드에 남긴다.
revoke insert, update, delete on table public.letters from anon, authenticated;

-- 함수는 기본적으로 public 에 EXECUTE 가 부여되므로 회수 후 명시적으로 재부여한다.
revoke all on function public.delete_letter(text, text, text)
  from public, anon, authenticated;

grant execute on function public.delete_letter(text, text, text)
  to anon, authenticated;

-- 20260810031725 와 같은 이유: db push 가 쓰는 역할에는 Supabase 의 default privileges 가
-- 걸려 있지 않아 postgres/service_role 도 명시적으로 부여해야 한다.
grant execute on function public.delete_letter(text, text, text)
  to postgres, service_role;


-- ---------------------------------------------------------------------------
-- 3. 스키마 캐시 리로드
-- ---------------------------------------------------------------------------

notify pgrst, 'reload schema';
