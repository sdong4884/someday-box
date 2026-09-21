<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Codex 프로젝트 지침

## 먼저 읽을 문서

- 작업 시작 시 [CLAUDE.md](./CLAUDE.md)와 [README.md](./README.md)를 읽는다. 공통 개발 규칙·컨벤션·디자인 기준은 CLAUDE.md를 따른다.
- 설계 판단이 필요하면 [docs/decisions.md](./docs/decisions.md)를 확인한다.
- Codex에서는 아래 작업 방식이 CLAUDE.md의 작업 방식과 충돌할 경우 아래 규칙을 우선한다.
- 위 Next.js 자동 관리 블록은 유지하고, 프로젝트 지침은 블록 밖에서 관리한다.

## Codex 작업 방식

- 작업 시작 시 Git 상태와 diff를 확인하고, 기존 미커밋·미추적 변경을 보존한다.
- 읽기·분석은 진행하되, 모든 파일 수정 전에는 계획을 제시하고 사용자 승인을 받는다. 승인된 범위는 반복 확인 없이 진행한다.
- 범위 밖 버그·개선점은 수정하거나 자동으로 이슈를 등록하지 않는다. 먼저 보고하고 사용자가 요청할 때 GitHub 이슈로 등록한다.
- 새로운 의존성 도입, 모호하거나 충돌하는 요구는 CLAUDE.md에 따라 먼저 질문한다.

## 현재 코드 구조와 경계

- `src/app/`: App Router의 라우팅·서버 페이지·메타데이터·Route Handler.
- `src/features/capsule/`, `src/features/letter/`: 기능별 `api`·`model`·`ui`. 서버 페이지에서 초기 데이터를 조회하고, 클라이언트 UI에서 폼·상태별 화면·TanStack Query 상호작용을 처리한다.
- `src/domain/`: 캡슐 상태·KST 날짜·캘린더 관련 순수 함수.
- `src/shared/`: 시간 주입·토스트·공통 UI. `src/lib/`는 Supabase 연결·공개 컬럼·에러 처리 등을 담당한다.
- `supabase/migrations/`: 스키마·RLS·RPC. `src/types/database.ts`는 DB 타입을 정의한다.

상태 판정은 주입된 시각과 `getCapsuleStatus(period, now)`를 사용한다. 클라이언트의 현재 시각은 `shared/time`에서 공급하며, 개발용 시간 이동은 화면 확인용일 뿐 서버·DB의 실제 시각을 변경하지 않는다.

일반 편지 공개는 RLS가 제한한다. 공개 전 작성자 열람과 편지 작성·수정·삭제는 비밀번호를 처리하는 RPC 경로를 따른다. 프론트엔드의 상태 표시를 DB 권한 검증의 대체 수단으로 사용하지 않는다.

## 실행과 검증

- 패키지 매니저는 npm이다. 초기 설치는 `npm install`, 환경 설정은 `.env.example`을 참고해 `.env.local`에 Supabase URL·anon key를 채운다. 기존 환경 파일은 덮어쓰지 않는다.
- 개발 서버: `npm run dev`
- 프로덕션 빌드·실행: `npm run build`, `npm run start`
- 작업 완료 전 필수 검증: `npm run typecheck && npm run lint && npm test`
- 문서 변경도 참조 경로·명령어를 실제 저장소와 대조하고 `git diff --check`로 확인한다.

현재 Vitest는 Node 환경에서 `src/**/*.test.ts`를 실행한다. 타입 검사·린트·단위 테스트의 성공을 브라우저 UI나 실제 Supabase RLS·RPC 검증의 성공으로 간주하지 않는다. 완료 보고에는 실행한 검증, 결과, 검증하지 못한 범위를 구분해 적는다.
