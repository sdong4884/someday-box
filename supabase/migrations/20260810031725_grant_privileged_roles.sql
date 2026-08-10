-- T1 후속: 서버 사이드 역할에 명시적으로 권한을 부여한다.
--
-- `supabase db push` 가 쓰는 마이그레이션 역할에는 Supabase 의 default privileges
-- (postgres/anon/authenticated/service_role 에 자동 GRANT)가 걸려 있지 않다.
-- 그래서 20260810031121 에서 만든 테이블은 anon 에게 직접 준 컬럼 SELECT 를 빼면
-- 어떤 역할도 권한이 없는 상태로 생성됐다.
--
-- anon/authenticated 의 최소 권한은 그대로 두고(해시 컬럼 비노출 유지),
-- 클라이언트에 내려가지 않는 역할에만 표준 수준의 권한을 복원한다.

grant all on table public.capsules to postgres, service_role;
grant all on table public.letters  to postgres, service_role;

grant execute on function public.generate_capsule_slug()      to postgres, service_role;
grant execute on function public.get_capsule_summary(text)    to postgres, service_role;

notify pgrst, 'reload schema';
