# CLAUDE.md — TripBite FE

Claude Code 세션 시작 시 자동 로드되는 프로젝트 가이드. 새 작업 전 이 파일을 기준으로 삼는다.

## 목표

이 사이트를 **Figma 시안과 동일하게** 만든다. Figma fileKey: `Kjxpfmi9KqYGJTJEbj7ue6`.

## 작업 규칙 (사용자 지시 — 반드시 준수)

- **답변은 한국어로.**
- **피그마가 최우선.** 단 스페이싱만 4px 그리드로 맞춘다.
- **기존 문구(copy)는 임의로 바꾸지 않는다.** 대응하는 기존 요소가 없는 새 UI만 시안 문구 사용 가능. 시안과 문구가 다르면 먼저 물어본다.
- **PWA 설치 배너는 그대로 둔다.**
- `--content-max: 720px` 은 건드리지 않는다.
- `/region` 은 스코프에서 제외(기획 실수).
- 커밋·푸시는 사용자가 요청하거나 자율 위임했을 때 진행. 커밋 메시지는 Conventional Commits + `Co-Authored-By` 트레일러.

## 스택

- Next.js 15 App Router / React 19 / TypeScript
- SCSS Modules, next-intl(ko/en), zustand, TanStack Query v5
- 아이콘: **Figma 스프라이트**(`/public/icons.svg`, `src/components/icon`). lucide 신규 사용 금지 — `scripts/build-icons.mjs` 로 관리. 필요한 심볼이 없으면 스프라이트에 추가.

## 백엔드 (중요)

- 실 BE는 **Spring Boot** — `https://trip-bite.o-r.kr` (구 NestJS `TripBite-api` 아님. 브랜치 `feat/be-spring-migration` 이 그 마이그레이션).
- 응답은 `{ success, message, data }` 봉투. 어댑터가 `data` 를 벗겨 도메인 DTO로 매핑.
- 인증: 세션 쿠키 `JSESSIONID`(HttpOnly). 익명 요청에도 발급되므로 "쿠키=로그인"이 성립 안 함 → FE 마커 쿠키 `tripbite.authed` 로 게이팅, 실제 인가는 API 403.
- 유저 스코프 쿼리는 `useAuthedQueryEnabled()`(= `/me` 프로브의 `sessionResolved`) 후에만 발사.
- 커서 페이지네이션은 **id 내림차순(`id < cursor`)** — 첫 페이지는 cursor 를 보내지 않는다(0 보내면 빈 목록).
- `GET /destinations/random` 은 토너먼트 풀 겸용이라 `size<4` 면 409. 지역코드 enum은 소문자(`cheongju` …).

## 로컬 실행 / 환경 복구

```bash
npm install
# .env.local 생성 (gitignore — 새 PC/클론 시 필수):
#   NEXT_PUBLIC_API_URL=https://trip-bite.o-r.kr
#   NEXT_PUBLIC_USE_MSW=false
#   NEXT_PUBLIC_VAPID_PUBLIC_KEY=...   (푸시 쓸 때만; .env.example 참조)
npm run dev        # http://localhost:3000
```

- **`.env.local` 이 없으면** FE가 BE에 못 붙거나 구 BE를 찾는다. 클론 후 제일 먼저 만들 것.
- `NEXT_PUBLIC_CSP_ENFORCE=true` 로 CSP 강제 전환 가능(기본 Report-Only).

## 검증 방식

- 변경은 눈대중이 아니라 **실제 브라우저(headless Chrome + CDP)로 실측**해 확인한다(요소 크기·색·아이콘 use href·스크린샷). Figma 값은 `use_figma`/`get_screenshot` 으로 실측 후 대조.
- 커밋 전 게이트: `npx tsc --noEmit`, `npx vitest run`(≈225개), 관련 화면 렌더 확인.

## 하지 말 것 (사고 이력)

- **메인 레포에서 `next build` 금지** — dev 서버 render worker가 죽은 적 있음. 빌드 확인이 필요하면 sharp/OG 등 런타임 경로를 개별 검증.
- 프로세스 종료는 **리스닝 포트의 PID 트리만** kill. `*next*` 광역 필터 금지(워커까지 죽음).
- i18n 문자열 치환 시 `replace` 는 첫 일치만 바뀌므로, 같은 값이 여러 블록에 있으면 오염 확인.

## 남은 작업 (2026-08-12 기준)

- **F2 CSP enforce 전환** — 로컬 검증은 통과(켜도 안 깨짐). prod `/api/csp-report` 위반 로그 확인 후 env 한 줄로 전환.
- **BE 팀 티켓 3건** — 오류응답 내부구조 노출 / 세션쿠키 Secure·SameSite / 레이트리밋.
- **도장책 지도 비율** — 현재 SVG 800×903(0.885) vs 시안 288×380(0.758). 시안 에셋으로 교체 시 청주시 단일 path화로 내부경계 이슈도 해소(`/region` 과 공유하므로 함께 바뀜).
- **여행 궁합 문구 검수** — `constants/travel-types.ts` `TRAVEL_TYPE_MATCH` 의 explorer 외 3종은 임시 문구(기획 검수 대상).

## 시안과 의도적으로 다른 지점 (근거 있음)

- 설정 "차단한 사용자 관리" 행 제거(익명 서비스라 차단 대상 식별 불가, BE API 없음).
- 편지 보낸함 행 북마크 제거(내 편지 저장은 BE가 403).
- 텍스트 대비: 시안 `#B4B4B4`/초록 텍스트가 AA 미달인 곳은 `--color-muted`/`--color-primary-text-bold` 로 상향.
