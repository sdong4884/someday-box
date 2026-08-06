# Someday Box

타임 캡슐에서 착안해 특정 날짜에 열리는 편지를 남기는 서비스.
링크를 공유해 여러 명이 편지를 쓰고, 만료일이 되면 공개된다.

## 시작하기

```bash
npm install
cp .env.example .env.local   # Supabase 연동 시작 시 값 채우기
npm run dev
```

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run typecheck` | 타입 검사 |
| `npm run lint` | ESLint |
| `npm test` | Vitest 1회 실행 |
| `npm run test:watch` | Vitest watch |

작업 완료 전 `npm run typecheck && npm run lint && npm test` 를 모두 통과해야 한다.

## 구조

```
src/
  app/          # Next.js App Router
  domain/       # 순수 함수. React·Supabase·브라우저 API import 금지 (ESLint로 강제)
```

## 문서

- 작업 규칙: [CLAUDE.md](./CLAUDE.md)
- 설계 결정과 배경: [docs/decisions.md](./docs/decisions.md)
