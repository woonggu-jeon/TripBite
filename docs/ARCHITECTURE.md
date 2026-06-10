# TripBite FE 아키텍처

신규 개발자 / BE 인계 / 운영자가 코드베이스를 빨리 파악할 수 있도록 high‑level 구조와 진입점만 정리. 도메인 정책은 [FEATURES.md](./FEATURES.md), 디자인은 [STYLES.md](./STYLES.md), 테스트는 [TESTING.md](./TESTING.md), 배포는 [DEPLOY.md](./DEPLOY.md) 참고.

---

## 1. 스택

| 영역        | 기술                                                     |
| ----------- | -------------------------------------------------------- |
| 프레임워크  | Next.js 15 (App Router, RSC + Client)                    |
| 언어        | TypeScript / React 19                                    |
| 상태 (서버) | TanStack Query v5 + axios + orval generated client       |
| 상태 (클라) | Zustand (auth / UI / location)                           |
| 폼          | react-hook-form + zod                                    |
| 스타일      | SCSS modules + CSS variables (token)                     |
| i18n        | next-intl v4 (`ko` / `en`)                               |
| PWA         | next-pwa (Serwist) + Service Worker                      |
| Mock        | MSW 2.x (dev + 선택적 운영 mock)                         |
| 테스트      | Vitest 4 / Playwright 6-platform / axe-core / size-limit |
| 빌드/배포   | Vercel + GitHub Actions (승인 게이트)                    |

---

## 2. 디렉토리

```
src/
├── app/                          App Router (page / layout / loading / sw.ts)
│   ├── (main)/                   인증 후 메인 영역
│   ├── login/  signup/  ...      Auth 페이지
│   ├── policy/                   약관 / 개인정보 / 라이센스
│   ├── sw.ts                     Service Worker (Serwist)
│   ├── globals.scss              entry (token @use)
│   └── styles/                   토큰 / mixin / dark / responsive
├── api/
│   └── generated/                orval 자동 생성 (gitignore, prebuild)
├── components/
│   ├── ui/                       primitive (Card/Chip/Button/IconButton/
│   │                              PageSection/TextField/MediaThumb/
│   │                              RadioGroup/DestinationCard/ButtonGrid)
│   ├── layout/                   SubHeader / BottomNav / SiteHeader
│   ├── feedback/                 AsyncSection / Skeleton / EmptyState /
│   │                              ConfirmDialog / FullPageError / Toast
│   ├── forms/                    Toggle / Slider
│   ├── icon/                     lucide sprite 래퍼
│   └── image/                    OptimizedImage
├── features/                     도메인별 (api / hooks / components / schemas)
│   ├── auth/                     로그인 / 회원가입 / 비번 / FindId / Logout
│   ├── letter/                   다섯글자 편지 (compose / list / sent)
│   ├── tournament/               토너먼트 (setup / bracket / result / saved)
│   ├── notification/             인박스 / badge / push subscribe
│   ├── ranking/                  랭킹 / 여행유형 quiz
│   ├── mypage/                   프로필 / 도장책 / 우승지
│   ├── region/                   시군별 콘텐츠
│   ├── home/                     홈 위젯 (recommendation / festivals / latestLetter)
│   ├── onboarding/               온보딩 step (concept / age / location / nickname)
│   ├── settings/                 닉네임 / 비번 / 알림 / 탈퇴
│   ├── location/                 GPS + reverse geocoding
│   ├── theme/                    light / dark / system 토글
│   ├── pwa/                      install banner / SW update
│   ├── carousel/                 Embla wrap
│   └── i18n/                     LocaleSwitcher
├── services/
│   ├── api/
│   │   ├── client.ts             axios instance (baseURL + withCredentials)
│   │   ├── orval-mutator.ts      generated → Promise<DTO> unwrap
│   │   └── error-normalize.ts    BE code → 표준 message
│   └── interceptors/
│       └── auth.ts               401 → /login redirect + isAxiosError
├── i18n/
│   ├── request.ts                getRequestConfig (locale + messages)
│   ├── locale.ts                 cookie 기반 locale 결정
│   └── messages/
│       ├── ko.json               한국어 (30.7KB)
│       └── en.json               영어 (26.6KB)
├── stores/                       Zustand
│   ├── auth-store.ts             세션 user
│   ├── location-store.ts         resolved location (좌표 + label)
│   └── ui-store.ts               theme / toast / dialog 상태
├── hooks/                        공유 hook (use-intersection / use-share-card / ...)
├── lib/                          util (haptic / validation / secure-image-url / toast / ...)
├── mocks/                        MSW handlers (운영 mock 도 동일 사용)
│   ├── handlers.ts
│   ├── browser.ts                worker 등록
│   └── seeds/                    region / notifications / letters
├── middleware.ts                 보호 경로 redirect (PROTECTED_PATHS)
└── constants/                    regions / emoji-map / region-tone
```

---

## 3. 데이터 흐름 (BE ↔ FE)

```
BE NestJS Swagger (/docs-json)
       │
       ▼ predev / prebuild  ──  npm run generate:api (orval)
src/api/generated/
       ├── auth/auth.ts            generated 함수 (axios 호출)
       ├── notifications/...       react-query hooks (useQuery / useMutation)
       ├── schemas/*.ts            DTO type
       └── *.msw.ts                MSW handler stub
       │
       ▼ wrap (feature 별)
src/features/<domain>/api/<endpoint>.ts
       │
       ▼ hook (router redirect / toast / invalidate)
src/features/<domain>/hooks/use-*.ts
       │
       ▼
src/features/<domain>/components/*.tsx   (RSC / Client)
       │
       ▼
사용자 브라우저
```

**mutator** (`src/services/api/orval-mutator.ts`) 가 `res.data` 자동 unwrap → generated 함수가 `Promise<DTO>` 직접 반환. interceptor (auth refresh / error-normalize / FormData multipart) 그대로 적용.

**BE Swagger 변경 워크플로**:

1. BE 가 `@ApiResponse({ type: XxxDto })` / `@ApiBody` / `@ApiProperty({ enum })` 명시
2. 로컬에서 `npm run generate:api` (또는 `npm run dev/build` 가 자동 호출)
3. type 에러로 영향 호출처 자동 발견 → wrap / hook / UI 갱신

---

## 4. 상태 관리 구분

| 종류             | 도구                          | 사용처                                              |
| ---------------- | ----------------------------- | --------------------------------------------------- |
| **서버 상태**    | TanStack Query                | 모든 API 응답 (캐시 / invalidate / refetch / 폴링)  |
| **클라 상태**    | Zustand                       | auth user / UI 토글 / location 좌표 / letter draft  |
| **폼 상태**      | react-hook-form + zod         | 모든 입력 폼 (auth 6종 / nickname / letter compose) |
| **i18n**         | next-intl                     | 서버 (`getTranslations`) / 클라 (`useTranslations`) |
| **URL**          | Next.js router + searchParams | `?redirect=` / `?theme=season` 등                   |
| **localStorage** | use-local-onboarding 등       | onboarding flag / 테마 명시 토글                    |

원칙: **서버에서 받는 데이터는 react-query, 그 외만 zustand**. 두 군데 다 두지 않음 (drift 방지).

---

## 5. 인증 (sessionID 모델)

- 단일 cookie `SID` (HttpOnly + SameSite=Lax + Secure)
- middleware (`src/middleware.ts`) 가 `PROTECTED_PATHS` (/mypage, /settings, /letter, /letters, /notifications) 진입 시 SID 검증 → 미인증 시 `/login?redirect=` 푸시
- 401 interceptor (`src/services/interceptors/auth.ts`) — 즉시 `/login` redirect, auth 페이지에서는 skip (루프 회피)
- `useAuthStore` (`src/stores/auth-store.ts`) — `setAuth(user)` / `clearAuth()`
- 자세한 정책 / 시나리오 → [FEATURES.md §A](./FEATURES.md#a-인증--세션-auth)

---

## 6. PWA / Service Worker

- next-pwa (Serwist) — disabled in dev (`NEXT_PUBLIC_SW_DEV=true` 강제 시 활성)
- SW 소스: `src/app/sw.ts`
- runtimeCaching = GET 패턴만 (Pretendard 폰트 1년 / TourAPI 이미지 30일 / 일반 이미지 7일 / SVG sprite 1년)
- **POST 가로채기 X** — multipart `/me/avatar` / 푸시 구독 등 그대로 통과
- Push handler (`sw.ts:132`) + notification click (`postMessage NAVIGATE`)
- 자세한 push 흐름 → [FEATURES.md §B](./FEATURES.md#b-알림-notifications--web-push)

---

## 7. i18n

- 진입: `src/i18n/request.ts` — `getRequestConfig(async ({ locale }) => ...)`
- locale 결정: `readLocaleFromCookie()` (`src/i18n/locale.ts`)
- messages SoT: `src/i18n/messages/{ko,en}.json` (현재 bundle 내)
- timeZone: `Asia/Seoul` (서버/클라 hydration 불일치 방지)
- 운영 안정 후 Vercel Edge Config 마이그 계획 → [I18N_EDGE_CONFIG.md](./I18N_EDGE_CONFIG.md)

---

## 8. 디자인 시스템

- primitive: `src/components/ui/*` (Card / Chip / Button / IconButton / PageSection / TextField / MediaThumb / RadioGroup / DestinationCard / ButtonGrid)
- 토큰: `src/app/styles/tokens/*.scss` (color / typography / spacing / radius / shadow / motion / aspect / z-index / emoji)
- dark / responsive: `_dark.scss` / `_responsive.scss` (360 / 320 단계)
- 자세히 → [STYLES.md](./STYLES.md)

원칙: raw 값 (hex / rgba / cubic-bezier) 직접 작성 금지. token 만 참조.

---

## 9. 빌드 / 배포

```
git push (dev)        → vercel.json deploymentEnabled.dev=false → skip
git push (main)       → GitHub Actions deploy.yml
                          ↓ build (lint + type-check + test + build + size)
                          ↓ deploy job — Required Reviewer 승인
                          ↓ Vercel Deploy Hook
                          ↓ 운영 반영 (1~3분)
```

- `predev` / `prebuild` → `npm run generate:api` (BE Swagger fetch 자동)
- Vercel env: `OPENAPI_URL` / `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_USE_MSW=false` / ...
- 자세히 → [DEPLOY.md](./DEPLOY.md)

---

## 10. 테스트

| 종류      | 도구                  | 갯수                    | 실행               |
| --------- | --------------------- | ----------------------- | ------------------ |
| 단위      | Vitest 4 + RTL        | 148 / 24 files          | `npm test`         |
| E2E       | Playwright            | 6 플랫폼 × 70+          | `npm run test:e2e` |
| a11y      | axe-core (Playwright) | per page                | e2e 안에 포함      |
| 시각 회귀 | toHaveScreenshot      | per route × theme       | e2e 안에 포함      |
| Bundle    | size-limit            | Shared 150KB / 전체 2MB | `npm run size`     |

자세히 → [TESTING.md](./TESTING.md)

---

## 11. 진입점 빠른 reference

| 작업                        | 위치                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------- |
| 새 페이지 추가              | `src/app/(main)/<route>/page.tsx`                                                  |
| 새 BE API 사용              | BE Swagger 갱신 → `npm run generate:api` → `src/features/<domain>/api/*` 에서 wrap |
| 새 i18n 키                  | `src/i18n/messages/{ko,en}.json`                                                   |
| 새 컴포넌트                 | feature local 또는 `src/components/ui/` (primitive)                                |
| 새 store                    | `src/stores/<name>-store.ts` (Zustand)                                             |
| 새 mock                     | `src/mocks/handlers.ts` (BE 미 구현 시 / dev 시나리오 재현)                        |
| 디자인 토큰                 | `src/app/styles/tokens/_*.scss`                                                    |
| 새 디자인 mixin             | `src/app/styles/_mixins.scss`                                                      |
| 새 protected route          | `src/middleware.ts` 의 `PROTECTED_PATHS`                                           |
| Push notification type 추가 | FEATURES §B-1 + `NotificationsClient.TYPE_ICON` + BE generated                     |
| 환경변수 (FE)               | Vercel Dashboard (Settings → Environment Variables)                                |
| 환경변수 (CI)               | GitHub Repo → Settings → Secrets / Variables                                       |

---

## 12. 핵심 컨벤션

- **렌더링 속도 최우선** — SSR + cache. 깜빡임 회피 위해 미리 fetch X (다음 페이지 prefetch 는 OK).
- **Dark / Light 두 모드 필수** — 새 컴포넌트는 토큰만 사용.
- **모바일 320px~ 반응형** — 모든 UI 가 320 (Fold/SE1) ~ desktop 까지 부드럽게. `clamp()` 우선, 단계별 `@media` 는 의도된 다른 비율(예: aspect-ratio)에만.
- **a11y 기본** — `role` / `aria-*` / `label htmlFor=id` / focus ring 토큰 사용.
- **commit-on-request-only** — 자동 git commit / push 금지. 사용자 명시 요청 시만.
- **문서 동시 갱신** — 코드 변경마다 영향 문서 (BACKLOG / STYLES / TESTING / FEATURES) 같은 turn 에 갱신.

---

## 13. 향후 계획

- BE 운영 진입 (Oracle Cloud / Railway 검토 중)
- Vercel production branch = `main` 으로 변경 + Edge Config i18n 도입 (조건 만족 시)
- CSP enforce (현재 report-only) / rate limit BE 측 / 정책 본문 법무 검토
- Vercel Analytics 마운트 완료 (web vitals + 페이지뷰). 에러 추적 도구 (Sentry 등) 는 의도적 미도입 — bundle +80KB / 개인정보 처리 부담 회피
