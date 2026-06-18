# TripBite — 충북 여행지 토너먼트 + 다섯글자 편지 PWA

Next.js 15 App Router · React 19 · TypeScript · sessionID 단일 쿠키 인증 · TourAPI 연동 · 다국어 (ko/en) · PWA + Web Push

---

## 빠른 시작

```bash
npm install
cp .env.example .env.local        # 기본값 그대로 BE 미준비 시 mock 모드
npm run dev                       # http://localhost:3900
```

```bash
npm run build && npm start        # 프로덕션 빌드 (PWA 활성)
```

> 첫 셋업 / env 변수 / 환경별 차이 → [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)

### 로컬 포트

| 서비스          | URL                             | 비고                 |
| --------------- | ------------------------------- | -------------------- |
| FE dev          | http://localhost:3900           | `npm run dev`        |
| FE e2e          | http://localhost:3901           | Playwright webServer |
| BE NestJS       | http://localhost:3000           | 별도 실행            |
| BE Swagger      | http://localhost:3000/docs      | endpoint try-it      |
| BE OpenAPI JSON | http://localhost:3000/docs-json | orval source         |

BE 미준비 시 `NEXT_PUBLIC_USE_MSW=true` 로 mock 모드 (실 BE 띄우면 `false`).

---

## 스크립트

| 명령                            | 설명                                                  |
| ------------------------------- | ----------------------------------------------------- |
| `npm run dev`                   | dev 서버 (`predev` 가 BE Swagger → orval 자동)        |
| `npm run build`                 | 프로덕션 빌드 (`prebuild` 가 orval 자동)              |
| `npm start`                     | 프로덕션 서버                                         |
| `npm run dev:clean`             | `.next` 삭제 + dev 재시작 (middleware/env stale 해소) |
| `npm run type-check`            | `tsc --noEmit`                                        |
| `npm run lint`                  | ESLint (next + security 룰)                           |
| `npm test` / `npm run test:run` | Vitest watch / 1회                                    |
| `npm run test:e2e`              | Playwright 6 플랫폼                                   |
| `npm run size`                  | size-limit 번들 가드                                  |
| `npm run analyze`               | bundle analyzer 리포트                                |
| `npm run generate:api`          | BE Swagger → `src/api/generated/` (orval)             |
| `npm run build:icons`           | lucide → `public/icons.svg` sprite                    |
| `npm run be:check`              | BE 회귀 4종 일괄 (smoke + anon + onboarded + login)   |
| `npm run storybook`             | Storybook dev (`http://localhost:6006`)               |
| `npm run build-storybook`       | Storybook static build (CI 빌드 게이트)               |

---

## 스택

- **프레임워크**: Next.js 15 (App Router, RSC + Client)
- **상태**: TanStack Query (서버) + Zustand (클라) + react-hook-form/zod (폼)
- **데이터**: orval generated client + axios + MSW (mock)
- **스타일**: SCSS modules + CSS variables 토큰
- **i18n**: next-intl v4 (ko / en)
- **PWA**: next-pwa (Serwist) + Service Worker + Web Push
- **테스트**: Vitest 4 / Playwright (6 플랫폼) / axe-core / size-limit

전체 구조 / 데이터 흐름 / 진입점 → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 디렉토리 (요약)

```
src/
├── app/                  App Router (page / layout / sw.ts)
├── api/generated/        orval 자동 생성 (gitignore, prebuild)
├── components/
│   ├── ui/               primitive (Card/Chip/Button/TextField/MediaThumb/RadioGroup/...)
│   ├── layout/           SubHeader / BottomNav / SiteHeader
│   └── feedback/         AsyncSection / Skeleton / EmptyState
├── features/             도메인별 (auth/letter/tournament/notification/mypage/region/...)
├── services/api/         axios client + orval mutator + interceptors
├── i18n/                 next-intl + messages/{ko,en}.json
├── stores/               Zustand
├── mocks/                MSW handlers + seeds
├── middleware.ts         보호 경로 redirect
└── styles/               SCSS tokens (color/spacing/radius/motion/...)
```

자세히 → [docs/ARCHITECTURE.md §2](docs/ARCHITECTURE.md)

---

## 사이트맵

```
[비인증]
  /login  /signup  /find-id  /forgot-password  /reset-password

[온보딩 미완료]
  /onboarding              컨셉 → 만 14세 → 위치

[인증 완료]
  /                        홈 (대시보드)
  /ranking                 여행지 랭킹 + Top5 + 시군
  /region  /region/[code]  시군 그리드 + 상세 (4탭: 전체/관광/축제/체험)
  /destination/[id]        여행지 상세 (Hero + WinnerDetailPanel)
  /tournament  /play  /result   토너먼트
  /letter (탭 4)  /compose  /sent  /[id]   다섯글자 편지
  /quiz                    여행 유형 테스트
  /mypage                  프로필 / 도장책 / 우승지
  /mypage/stamps           정밀 11 시군 지도
  /mypage/saved-tournaments  저장 우승지 전체
  /notifications           알림함 (cursor 무한스크롤)
  /settings                알림 / 계정 / 정책
  /policy/{terms,privacy,licenses}
```

**하단 네비 5탭**: 홈 / 랭킹 / 🏆 토너먼트 (가운데) / 편지 / 마이페이지

---

## 문서

| 문서                                                | 내용                                                                        |
| --------------------------------------------------- | --------------------------------------------------------------------------- |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)             | 스택 / 디렉토리 / 데이터 흐름 / 상태 / 인증 / PWA / i18n / 진입점 reference |
| [FEATURES.md](docs/FEATURES.md)                     | BE 인계 명세 (Auth §A + Notifications §B) — 정책 / 시나리오 / 발송 매핑     |
| [ENVIRONMENT.md](docs/ENVIRONMENT.md)               | 모든 env 변수 일람 + 환경별 매트릭스 + Vercel/GitHub 등록 + 트러블슈팅      |
| [DEPLOY.md](docs/DEPLOY.md)                         | main → production 승인 배포 + Vercel deploymentEnabled                      |
| [STYLES.md](docs/STYLES.md)                         | 디자인 토큰 + Primitive (Card/Button/TextField/MediaThumb/RadioGroup/...)   |
| [TESTING.md](docs/TESTING.md)                       | Vitest 250 cases / Playwright 6 플랫폼 / axe / 시각 회귀                    |
| [BACKLOG.md](docs/BACKLOG.md)                       | 후속 작업 백로그                                                            |
| [I18N_EDGE_CONFIG.md](docs/I18N_EDGE_CONFIG.md)     | i18n 외부 스토리지 마이그 계획 (운영 안정 후)                               |
| [MOCK_IN_PRODUCTION.md](docs/MOCK_IN_PRODUCTION.md) | 운영 mock 시나리오 (데모/QA)                                                |
| [PWA_VERIFICATION.md](docs/PWA_VERIFICATION.md)     | iOS PWA 실기기 매뉴얼 검증 체크리스트 (A~F 영역)                            |
| [STORYBOOK.md](docs/STORYBOOK.md)                   | Storybook 카탈로그 운영 가이드 (실행 / 추가 / CI)                           |
| [FIGMA_INTEGRATION.md](docs/FIGMA_INTEGRATION.md)   | Figma MCP → 코드 워크플로우 (토큰 매니페스트 / MCP 셋업 / 운영 룰)          |

API 명세 SoT: **BE Swagger** (`{API}/docs`) — orval 이 빌드 전 자동 fetch.

---

## 핵심 컨벤션

- **렌더링 속도 최우선** — SSR + cache. 깜빡임 회피 위해 미리 fetch X.
- **Dark / Light 두 모드 필수** — 새 컴포넌트는 토큰만 사용.
- **모바일 320px~ fluid 반응형** — `clamp()` 우선 (320 Fold/SE1 ~ desktop 부드러움). 단계별 `@media` 는 의도된 다른 비율에만.
- **a11y 기본** — `role` / `aria-*` / `label htmlFor=id` / focus ring 토큰.
- **commit-on-request-only** — 자동 git commit/push 금지. 사용자 명시 요청 시만.
- **문서 동시 갱신** — 코드 변경마다 영향 문서 같은 turn 에 갱신.

---

## 라이센스 / 기여

MIT (TBD). PR 환영 — main 브랜치로 직접 푸시 금지, `dev` 브랜치 경유.
