# Someday Box

타임 캡슐에서 착안해 특정 날짜에 열리는 편지를 남기는 서비스. 링크를 공유해 여러 명이 편지를 쓰고 만료일이 되면 공개된다.

## 스택

Next.js / TypeScript / TanStack Query / Zustand /
React Hook Form + Zod / Tailwind / Supabase / Vitest / Vercel

- 패키지 매니저는 npm
- **새로운 의존성을 임의로 추가하지 않고 필요성과 대안과 함께 먼저 물어볼 것**

## 명령어

```bash
npm run dev
npm run typecheck && npm run lint && npm test  # 작업 완료 전 반드시 통과
```

## 폴더 구조

```
src/
  domain/       # 순수 함수. React·Supabase·브라우저 API import 금지
```

나머지는 진행하면서 정한다

## 핵심 규칙

**1. 캡슐 상태는 3가지**
: `WRITING`(입력 가능) → `LOCKED`(잠김) → `OPENED`(공개)

**2. 상태 판정은 `domain/capsule.ts`의 순수 함수로만**
: `getCapsuleStatus(period, now)` 시각은 인자로 주입, 컴포넌트에서 `new Date()` 직접 호출 금지

**3. 만료 전 열람 차단은 RLS가 담당**
: 새 테이블 생성 시 `enable RLS` + `grant` + `policy` 세 개가 한 세트

**4. 모바일 퍼스트**
: 주 유입은 카카오톡 인앱 브라우저이기 때문에 `100vh` 대신 `100dvh`

## 작업 방식

```
브랜치 → 계획 승인 → 구현 + 테스트 → 검증 → PR → 리뷰 → squash merge
```

- 모호하거나 서로 충돌하는 내용은 임의로 결정하지 말고 질문할 것
- 범위 밖의 버그·개선점은 고치지 말고 GitHub 이슈로 등록할 것
- 구현 방향이 애매하면 `docs/decisions.md`를 먼저 확인할 것
- `npm run typecheck && npm run lint && npm test` 셋 중 하나라도 실패하면 작업은 완료된 것이 아니라고 판단

## 컨벤션

- 커밋 : Conventional Commits
  - type: feat / fix / refactor / test / chore / docs
  - scope: capsule / letter / domain / shared / (애매하면 생략)
- 파일명 : 컴포넌트는 PascalCase, 나머지는 camelCase
- 타입은 `any` 대신 `unknown` + 타입 가드

## 하지 말 것

- `git push --force`, `git reset --hard`
- 설정값이나 비밀값 코드에 하드코딩
- 테스트를 통과시키려고 테스트를 약화시키기
