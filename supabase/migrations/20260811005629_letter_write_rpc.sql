-- T2: 편지 생성·수정 RPC
--
-- letters 는 T1(20260810031121)에서 SELECT 컬럼 권한만 열려 있고 INSERT/UPDATE 는
-- grant 도 policy 도 없다. 로그인이 없으므로(docs/decisions.md §4) 편지 소유권은
-- 닉네임 + 비밀번호로만 증명되고, 해싱·검증은 Postgres 안에서 끝나야 한다.
-- 그래서 쓰기 경로는 테이블 권한이 아니라 security definer RPC 두 개로만 연다.
--
-- 두 함수 모두 반환 타입에 password_hash 가 없다 (docs/decisions.md §4, §7).
-- 반환 컬럼은 src/lib/dbColumns.ts 의 LETTER_PUBLIC_COLUMN_KEYS 와 동일하게 맞춘다.
--
-- 실패는 예외 + 앱 전용 SQLSTATE 로 알린다. 성공하면 데이터만 돌려준다.
--   SB001  캡슐 없음 (slug 불일치)
--   SB002  인증 실패 (닉네임 없음 또는 비밀번호 불일치)
--   SB003  입력 기간 종료 (now() >= write_until)
--   SB004  닉네임 중복
--   SB005  비밀번호 형식 오류 (빈 값 또는 72바이트 초과)


-- ---------------------------------------------------------------------------
-- 0. 확장
-- ---------------------------------------------------------------------------

-- crypt() / gen_salt(). T1 에서 이미 켰지만 이 마이그레이션의 전제라 명시한다.
-- extensions 스키마에 설치되므로 search_path = '' 인 함수 안에서는 스키마를 한정해야 한다.
create extension if not exists pgcrypto with schema extensions;


-- ---------------------------------------------------------------------------
-- 1. create_letter
-- ---------------------------------------------------------------------------

-- 닉네임과 본문은 btrim 해서 저장한다. 테이블 CHECK 는 char_length(btrim(...)) 로
-- 검사하지만 저장은 원본이라, 트림하지 않으면 '진호' 와 '진호 ' 가 서로 다른 행이 되어
-- docs/decisions.md §9(캡슐 안 닉네임 유일)가 무너진다.
--
-- 길이 초과·미달은 letters_nickname_length / letters_content_length 제약에 맡긴다.
--
-- returns table 의 컬럼명이 letters 의 컬럼명과 같아 본문에서 모호해질 수 있다.
-- #variable_conflict use_column 으로 컬럼 쪽 해석을 고정한다. 변수는 전부 v_/p_ 접두사라
-- 컬럼으로 해석돼도 충돌하지 않는다.
create or replace function public.create_letter(
  p_slug     text,
  p_nickname text,
  p_content  text,
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
begin
  -- bcrypt 는 72바이트를 넘는 입력을 조용히 잘라내고, 빈 비밀번호도 crypt() 는 통과시킨다.
  -- 최소 길이 정책은 UI(zod) 몫으로 남기고, 여기서는 해싱이 무의미해지는 범위만 막는다.
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

  -- WRITING 상태에서만 작성할 수 있다. now() 는 트랜잭션 시각이라 한 호출 안에서 일관된다.
  if now() >= v_write_until then
    raise exception using
      errcode = 'SB003',
      message = '편지 입력 기간이 끝났습니다.';
  end if;

  begin
    return query
      insert into public.letters (capsule_id, nickname, content, password_hash)
      values (
        v_capsule_id,
        btrim(p_nickname),
        btrim(p_content),
        extensions.crypt(p_password, extensions.gen_salt('bf'))
      )
      returning
        letters.id,
        letters.capsule_id,
        letters.nickname,
        letters.content,
        letters.created_at,
        letters.updated_at;
  exception
    when unique_violation then
      raise exception using
        errcode = 'SB004',
        message = '이미 사용 중인 닉네임입니다.';
  end;
end;
$$;

comment on function public.create_letter(text, text, text, text) is
  '편지를 작성한다. 비밀번호는 bcrypt 로 해싱해 저장하고 해시는 반환하지 않는다. '
  '입력 마감(write_until) 이전에만 허용. 실패 시 SB001/SB003/SB004/SB005.';


-- ---------------------------------------------------------------------------
-- 2. update_letter
-- ---------------------------------------------------------------------------

-- 닉네임 + 비밀번호로 편지를 찾아 검증한 뒤 본문만 교체한다.
-- 닉네임·비밀번호 변경은 지원하지 않는다.
create or replace function public.update_letter(
  p_slug     text,
  p_nickname text,
  p_password text,
  p_content  text
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

  if now() >= v_write_until then
    raise exception using
      errcode = 'SB003',
      message = '편지 수정 기간이 끝났습니다.';
  end if;

  select l.id, l.password_hash
    into v_letter_id, v_hash
    from public.letters l
   where l.capsule_id = v_capsule_id
     and l.nickname = btrim(p_nickname);

  -- 닉네임이 없는 경우와 비밀번호가 틀린 경우를 구분하지 않는다. 닉네임 목록은
  -- get_capsule_summary 로 이미 공개되므로 열거 방지가 아니라 분기 단순화가 목적이다.
  if not found or v_hash <> extensions.crypt(p_password, v_hash) then
    raise exception using
      errcode = 'SB002',
      message = '닉네임 또는 비밀번호가 일치하지 않습니다.';
  end if;

  -- updated_at 은 letters_set_updated_at 트리거가 갱신한다.
  return query
    update public.letters
       set content = btrim(p_content)
     where letters.id = v_letter_id
    returning
      letters.id,
      letters.capsule_id,
      letters.nickname,
      letters.content,
      letters.created_at,
      letters.updated_at;
end;
$$;

comment on function public.update_letter(text, text, text, text) is
  '닉네임 + 비밀번호로 편지를 검증한 뒤 본문을 수정한다. 해시는 반환하지 않는다. '
  '입력 마감(write_until) 이전에만 허용. 실패 시 SB001/SB002/SB003/SB005.';


-- ---------------------------------------------------------------------------
-- 3. 권한
-- ---------------------------------------------------------------------------

-- T1 의 revoke all 로 이미 없는 상태다. 쓰기는 RPC 로만 연다는 의도를 코드에 남긴다.
revoke insert, update, delete on table public.letters from anon, authenticated;

-- 함수는 기본적으로 public 에 EXECUTE 가 부여되므로 회수 후 명시적으로 재부여한다.
revoke all on function public.create_letter(text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.update_letter(text, text, text, text)
  from public, anon, authenticated;

grant execute on function public.create_letter(text, text, text, text)
  to anon, authenticated;
grant execute on function public.update_letter(text, text, text, text)
  to anon, authenticated;

-- 20260810031725 와 같은 이유: db push 가 쓰는 역할에는 Supabase 의 default privileges 가
-- 걸려 있지 않아 postgres/service_role 도 명시적으로 부여해야 한다.
grant execute on function public.create_letter(text, text, text, text)
  to postgres, service_role;
grant execute on function public.update_letter(text, text, text, text)
  to postgres, service_role;


-- ---------------------------------------------------------------------------
-- 4. 스키마 캐시 리로드
-- ---------------------------------------------------------------------------

notify pgrst, 'reload schema';
