# Next.js 15 + PWA + JWT Cookie Auth — Travel App

> 충청북도 여행지 토너먼트 + 다섯글자 편지 PWA
>
> Next.js 15 App Router · Cookie 기반 JWT · TourAPI 연동 · 다국어 · 위치/날씨 · 무한스크롤 · 차트 · 캐러셀

---

## 빠른 시작

```bash
npm install
cp .env.example .env.local
npm run dev
```

```bash
npm run build && npm start   # 프로덕션 (PWA 활성)
```

---

## 스크립트

| 명령                   | 설명                                    |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | 개발 서버                               |
| `npm run build`        | 프로덕션 빌드                           |
| `npm start`            | 프로덕션 서버                           |
| `npm run lint`         | ESLint                                  |
| `npm run type-check`   | `tsc --noEmit`                          |
| `npm run format`       | Prettier 일괄 포맷                      |
| `npm run generate:api` | OpenAPI → `src/generated/api` 코드 생성 |

---

## 사이트맵 (v2)

```
[비인증]
  /login

[인증, 온보딩 미완료]
  /onboarding              3-step (컨셉 / 위치 / 닉네임)

[인증 + 온보딩 완료]
  /                        홈 (대시보드)
  /ranking                 여행지 랭킹
  /region                  충북 11개 시군 지도
  /region/[code]           시군 상세 (관광지/축제/체험 탭)
  /tournament              토너먼트 설정
  /tournament/play           ↳ 일러스트 → 지도 → 1:1 매치
  /tournament/result         ↳ 우승지 + 행운의 색 + 사다리타기
  /letter                  편지 메인 (받은/보낸)
  /letter/compose            ↳ 5글자 작성
  /letter/[id]               ↳ 원고지 상세
  /quiz                    여행 유형 테스트
  /mypage                  마이페이지 (도장깨기 포함)
  /settings                설정 (4섹션)
```

**하단 네비 5탭**: 홈 / 랭킹 / **🏆 토너먼트 (가운데 강조)** / 편지 / 마이페이지

---

## App Router 구조

```
src/app/
 ├─ layout.tsx                     Root (Providers + NextIntlClientProvider)
 ├─ error.tsx / not-found.tsx / loading.tsx
 ├─ (auth)/                        헤더/네비 없음
 │   ├─ login/page.tsx
 │   └─ onboarding/page.tsx
 └─ (main)/                        하단 네비 5탭 공통 그룹
     ├─ layout.tsx                 AppHeader + BottomNav
     ├─ page.tsx                   홈
     ├─ ranking/
     ├─ region/  +  [code]/
     ├─ tournament/  +  play/  +  result/
     ├─ letter/     +  compose/  +  [id]/
     ├─ quiz/
     ├─ mypage/
     └─ settings/
```

---

## Feature 모듈

```
src/features/
 ├─ auth/              로그인 / 로그아웃 / /me / AuthBootstrap
 ├─ onboarding/        3-step 온보딩
 ├─ user/              사용자 프로필
 ├─ tournament/        토너먼트 (Zustand 멀티스텝 store)
 ├─ letter/            다섯글자 편지 (5글자 zod 검증)
 ├─ ranking/           랭킹 + 여행 유형 테스트
 ├─ quiz/              여행 유형 테스트 (별도 페이지)
 ├─ region/            충북 11개 시군 (TourAPI 프록시)
 ├─ weather/           위치 기반 날씨
 ├─ location/          Geolocation + Permissions API + IP fallback
 ├─ mypage/            마이페이지 + 도장깨기
 ├─ notification/      Web Push + 인앱 알림함
 ├─ settings/          알림/계정/정책/액션 4섹션
 ├─ i18n/              LanguageSwitcher
 ├─ chart/             Recharts wrapper (dynamic import)
 ├─ carousel/          Embla wrapper (dynamic import)
 └─ list/              InfiniteList (IntersectionObserver)
```

---

## 렌더링 성능 전략 ⚡

이 프로젝트는 **첫 페인트 빠름** 을 1순위로 둡니다.

### 1. Server Component 기본

모든 `page.tsx` 는 `async` Server Component. `getTranslations`, 백엔드 호출은 서버에서.
인터랙션 부분만 `_components/*Client.tsx` 로 분리.

### 2. 동적 import (무거운 모듈)

`src/lib/dynamic.ts` 의 `clientOnly()` 헬퍼로 일관 적용.

| 모듈           | 크기   | 분리 위치                                       |
| -------------- | ------ | ----------------------------------------------- |
| recharts       | ~100KB | `features/chart/components/*Impl.tsx`           |
| embla-carousel | ~10KB  | `features/carousel/components/CarouselImpl.tsx` |

차트/캐러셀이 없는 페이지는 코드를 다운로드하지 않음.

### 3. Layout 재마운트 방지

`(main)/layout.tsx` 의 헤더/네비는 sticky/fixed. 페이지 전환 시 콘텐츠만 transition.

### 4. 캐시 정책 (`src/lib/cache.ts`)

리소스별 staleTime / gcTime 표준화. 모든 hook 에서 `...CACHE.normal` 식으로 import.

| 프로파일 | staleTime  | 용도                              |
| -------- | ---------- | --------------------------------- |
| static   | 1d         | 충북 시군 메타, quiz 질문         |
| slow     | 30m        | TourAPI 콘텐츠, 시군 summary      |
| normal   | 5m         | 랭킹, 인기 차트                   |
| user     | 2m         | 마이페이지, /me                   |
| realtime | 30s + 폴링 | 편지 도착, 알림                   |
| session  | ∞          | 토너먼트 후보 (한 세션 동안 고정) |
| weather  | 15m        | 날씨                              |

### 5. PWA Runtime Caching (`next.config.js`)

| 패턴             | 전략                 | 보관 |
| ---------------- | -------------------- | ---- |
| TourAPI 이미지   | CacheFirst           | 30일 |
| 기타 이미지      | StaleWhileRevalidate | 7일  |
| `_next/static/*` | CacheFirst           | 1년  |

오프라인 환경에서도 이미 본 콘텐츠는 즉시 표시.

### 6. 이미지

- `<OptimizedImage />` (`src/components/image/`): blur placeholder + lazy + AVIF/WebP
- `next.config.js`: TourAPI 도메인 허용, deviceSizes/imageSizes 최소화
- LCP 이미지(시군 상세 hero)에만 `priority`
- `sizes` 정확히 지정 → 해상도 최적화

### 7. 아이콘

- `lucide-react` named import (tree-shake)
- `next.config.js` 의 `optimizePackageImports: ['lucide-react', ...]` 로 자동 최적화
- 브랜드 아이콘은 SVG sprite 또는 단일 SVG 컴포넌트로

### 8. 무한스크롤

`@/features/list` — `useInfiniteList` + `<InfiniteList>` (IntersectionObserver 기반)

```tsx
const { items, fetchNext, hasNext, isFetchingNext } = useInfiniteList({
  queryKey: ['letters', 'received'],
  queryFn: ({ pageParam }) => letterApi.listReceivedPage({ cursor: pageParam }),
  cache: 'realtime',
});

<InfiniteList
  items={items}
  hasNext={hasNext}
  isFetchingNext={isFetchingNext}
  onReachEnd={fetchNext}
  keyExtractor={(letter) => letter.id}
  renderItem={(letter) => <LetterCard letter={letter} />}
/>;
```

- **virtualization 없음** (1,000개 미만 리스트엔 충분)
- `rootMargin: 200px` 으로 끝 도달 전 prefetch → 끊김 없는 스크롤
- 다음 페이지 fetching 중 Skeleton 자동 표시

### 9. Skeleton + Suspense

`src/components/feedback/Skeleton.tsx` — 순수 CSS shimmer, `prefers-reduced-motion` 존중.
동적 import의 loading fallback, InfiniteList의 페이지 로딩, 위젯 placeholder에 일관 사용.

### 10. 위젯 단위 fetching

홈/마이페이지의 각 위젯은 자체 `useQuery` → waterfall 회피.
위젯별 fixed height로 CLS 0.

---

## 다국어 (i18n)

쿠키 기반 (`NEXT_LOCALE`). URL 변경 없이 실시간 전환.
자세한 사용법은 `/settings` 페이지의 언어 토글 또는 `src/features/i18n/components/LanguageSwitcher.tsx` 참고.

새 언어 추가:

1. `src/i18n/config.ts` 의 `locales` 에 코드 추가
2. `src/i18n/messages/{code}.json` 작성 (ko.json 구조 미러)
3. `localeLabels` 에 표시명 추가

---

## 인증

- **일반 이메일/비밀번호 로그인만** — 소셜 OAuth(kakao/google/naver) 없음. `next-auth`/`@auth/core`/소셜 SDK 불필요.
- HttpOnly Cookie (access/refresh). 프론트는 토큰 직접 관리 X (`jwt-decode` 등 클라이언트 토큰 라이브러리 불필요).
- `services/api/client.ts` — `withCredentials: true` axios
- `services/interceptors/auth.ts` — 401 → `/auth/refresh` 자동, 동시 401 단일 promise 공유
- `middleware.ts` — 쿠키 존재 여부만 체크 (`/login`만 PUBLIC_ONLY, 그 외 미인증 시 `/login` 리다이렉트)
- `AuthBootstrap` — `GET /me` → store hydrate. `isOnboarded === false` 면 `/onboarding` 으로, 완료 사용자가 `/onboarding` 진입 시 `/` 로 redirect

---

## 위치 권한

`@/features/location`:

- Permissions API 로 prompt 없이 권한 상태 추적 (`usePermissionState`)
- `getCurrentPosition` 은 사용자 명시적 동작 직후에만 (iOS 정책) — `useGeolocation.request()`, mount 자동 호출 X
- 거부 시 `/location/ip` (IP geolocation) 자동 fallback — `useResolveLocation` 이 GPS→IP 체인 처리
- 좌표 → 주소 변환은 백엔드 `/location/reverse` (Kakao/Naver Maps 프록시)
- resolve 결과는 `stores/location-store.ts` 에 저장 → 온보딩 step2 / 편지 작성 간 공유 (재요청 방지)

**통합 지점**:

- 온보딩 step2 (`LocationStep`): `granted` 자동 resolve / `prompt`·`unsupported` 사전 안내(`LocationPermissionPrompt`) / `denied` 안내+건너뛰기 분기. 결과로 `onboarding.location_allowed`/`skipped` analytics 호출
- 편지 작성 (`LetterComposeForm`): store에 좌표 있으면 표시+변경, 없으면 prompt. 제출 시 `SendLetterRequest.location` 에 포함 (없으면 omit → 백엔드 IP 추론)

---

## 백엔드 엔드포인트 체크리스트

| 영역                    | 엔드포인트                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------- | ---------- |
| Auth                    | `POST /auth/login` `POST /auth/logout` `POST /auth/refresh` `GET /me` `POST /me/complete-onboarding`                                                  |
| User                    | `PATCH /mypage/profile`                                                                                                                               |
| Letter                  | `POST /letters` `GET /letters/{received,sent,liked,saved}` `GET /letters/:id` `POST /letters/:id/like` `POST /letters/:id/save` `DELETE /letters/:id` |
| Tournament              | `GET /destinations/random` `POST /tournaments` `GET/POST/DELETE /mypage/tournaments` `GET /mypage/tournament-history`                                 |
| Region (TourAPI 프록시) | `GET /regions/:code/summary` `GET /regions/:code/contents?type=` `GET /regions/ongoing-festivals`                                                     |
| Ranking                 | `GET /rankings?type=weekly-winners                                                                                                                    | recommended | hidden-gems | by-region` |
| Quiz                    | `GET /quiz/questions` `POST /quiz/submit` `GET /quiz/me`                                                                                              |
| MyPage                  | `GET /mypage` `GET /mypage/stamps`                                                                                                                    |
| Location                | `POST /location/reverse` `GET /location/ip`                                                                                                           |
| Weather                 | `GET /weather/current`                                                                                                                                |
| Notification            | `GET /notifications` `POST /notifications/:id/read` `POST /notifications/read-all` `POST /notifications/subscribe` `POST /notifications/unsubscribe`  |
| Settings                | `GET /settings` `PATCH /settings/notifications`                                                                                                       |

---

## 백엔드 미준비 시 검증 — MSW

`NEXT_PUBLIC_USE_MSW=true` 토글로 dev에서 백엔드 없이 핵심 흐름을 mock 응답으로 검증.

### 사용법

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080    # 실 백엔드 (rewrites destination)
NEXT_PUBLIC_USE_MSW=true                     # MSW 활성화
```

```bash
npm run dev
```

### 동작 원리

Service worker는 same-origin scope만 가로챔 → cross-origin 백엔드 호출은 MSW가 못 잡음. MSW 모드에서만 다음이 활성화:

- `next.config.js` rewrites: `/api/backend/:path*` → `NEXT_PUBLIC_API_URL/:path*` proxy
- `services/api/client.ts`: axios `baseURL = '/api/backend'` (same-origin)
- `src/mocks/handlers.ts`: 같은 path prefix로 URL 매칭

MSW가 잡지 못한 path는 `onUnhandledRequest: 'bypass'`로 destination(실 백엔드)에 도달.

### 현재 mock된 엔드포인트

| 영역          | 엔드포인트                                                       |
| ------------- | ---------------------------------------------------------------- |
| Auth          | POST `/auth/{login,logout,refresh}`, GET `/me`                   |
| Onboarding    | POST `/me/complete-onboarding`                                   |
| Location      | POST `/location/reverse`, GET `/location/ip`                     |
| Weather       | GET `/weather/current`                                           |
| Letters       | POST `/letters`, GET `/letters/{received,sent,liked,saved,/:id}` |
| Region        | GET `/regions/:code/contents`                                    |
| Tournament    | GET `/mypage/tournament-history`                                 |
| Notifications | GET `/notifications`                                             |

핸들러 추가는 `src/mocks/handlers.ts`. seed 데이터는 `src/mocks/seeds/`.

### 검증 시나리오

| 페이지             | 확인                                                             |
| ------------------ | ---------------------------------------------------------------- |
| `/onboarding`      | 3 step 전체 (concept → location 분기 → nickname → mock complete) |
| `/letter/compose`  | 위치 자동 채우기 + 5글자 보내기 → mock 201                       |
| `/letter`          | mock 받은 편지 30개 페이지네이션                                 |
| `/region/cheongju` | mock 관광지/축제/체험 탭                                         |

DevTools Network에서 `mockServiceWorker.js` "intercepted" 로그 확인.

### 위치 권한 시나리오 5종

| 케이스                | 결과                                                          |
| --------------------- | ------------------------------------------------------------- |
| 'granted' (이전 허용) | mount 즉시 자동 resolve → mock reverse → 다음 step            |
| 'prompt' + OS 허용    | mock reverse → 다음 step                                      |
| 'prompt' + OS 거부    | useResolveLocation이 mock `/location/ip` fallback → 다음 step |
| 'denied'              | 안내 + 건너뛰기만, `track('onboarding.location_skipped')`     |
| GPS + IP 모두 실패    | `track('onboarding.location_skipped')` + 다음 step            |

---

## Vercel 배포 가이드

### 환경 변수 설정 (Project → Settings → Environment Variables)

| 변수                           | 값                            | 비고                                                          |
| ------------------------------ | ----------------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`          | `https://api.your-domain.com` | 필수 — CSP `connect-src` 에 자동 포함                         |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID 공개키                  | Web Push 사용 시만                                            |
| `NEXT_PUBLIC_APP_VERSION`      | `$VERCEL_GIT_COMMIT_SHA`      | 시스템 변수 참조 가능. `/api/health`, `/settings` 하단에 노출 |
| `NEXT_PUBLIC_SENTRY_DSN`       | Sentry DSN                    | Sentry 도입 시만                                              |
| `SENTRY_AUTH_TOKEN`            | (Secret)                      | 빌드 시 source map 업로드용                                   |

### 빌드 설정

기본값 그대로 OK:

- Framework Preset: **Next.js** (자동 감지)
- Build Command: `npm run build`
- Install Command: `npm install`
- Output Directory: `.next` (자동)
- Node Version: **22.x** (Settings → General → Node.js Version)

### 알려진 트러블슈팅

#### 1) `husky: command not found` 빌드 실패

**증상**:

```
sh: line 1: husky: command not found
npm error code 127
Error: Command "npm install" exited with 127
```

**원인**: `prepare` lifecycle 이 husky 실행 시도 → 일부 환경에서 실패.

**해결** (이미 적용됨):

- `package.json` 의 `"prepare": "husky || true"` — 실패해도 install 계속
- `husky` 가 `devDependencies` 에 등록됨

#### 2) `Image with src "..." has invalid hostname`

`next.config.js` 의 `images.remotePatterns` 에 도메인이 등록되어 있어야 함:

```js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'tong.visitkorea.or.kr' },
    // 새 도메인 추가 시 여기에
  ],
}
```

#### 3) `Module not found: Can't resolve '@/...'`

`tsconfig.json` 의 `paths` 가 빌드 환경에서 안 잡힐 때.

```json
"paths": {
  "@/*": ["./src/*"]
}
```

및 `next.config.js` 에 별도 webpack alias 불필요 (Next.js 가 자동 처리).

#### 4) CSP 위반 콘솔 경고가 너무 많음

현재 `Content-Security-Policy-Report-Only` 모드라 차단은 안 함. 운영 안정화 후 `Content-Security-Policy` 로 전환:

```js
// next.config.js
{ key: 'Content-Security-Policy', value: csp }   // Report-Only 제거
```

#### 5) 첫 진입 시 Pretendard 깜빡임 (FOUT)

`font-display: swap` 동작 — 시스템 폰트로 즉시 표시 후 Pretendard 로 교체. 정상 동작이지만 거슬리면:

- self-host 마이그레이션 후 `next/font/local` 의 `display: 'optional'` 사용 (1회 fetch 후 미준비면 fallback 유지)

### Preview 배포 활용

PR 마다 자동 preview URL 생성 → Lighthouse / 디자인 리뷰 / 모바일 실기기 테스트 권장.

```
PR #123 → https://your-app-git-feature-branch.vercel.app
```

#### 6) 환경 변수 누락으로 인한 런타임 에러

`NEXT_PUBLIC_API_URL` 미설정 시 `axios baseURL` 이 undefined → 모든 API 호출 실패.
배포 직후 `/api/health` 가 200 OK 반환하는지, 홈 페이지가 빈 상태로 안 뜨는지 확인.

---

## 사전 체크리스트

- [ ] GitHub repo + Vercel 연결
- [ ] CORS: `Access-Control-Allow-Credentials: true` + 정확한 origin
- [ ] Set-Cookie: `HttpOnly; Secure; SameSite=Lax` (cross-origin이면 `SameSite=None; Secure`)
- [ ] TourAPI 키 (백엔드)
- [ ] Kakao/Naver Maps 키 (reverseGeocode, 백엔드)
- [ ] 기상청 또는 OpenWeatherMap 키 (백엔드)
- [ ] (선택) VAPID 키 페어
- [ ] `public/icons/` 아이콘 교체 (현재는 플레이스홀더)

---

## 🔒 보안 (Security)

### 적용된 보호 (코드에 반영됨)

| 영역                | 내용                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------- |
| 토큰 저장           | **HttpOnly Cookie** — XSS로 탈취 불가능. `localStorage`/`sessionStorage` 금지          |
| API 키 분리         | TourAPI/Maps/Weather 모두 백엔드 프록시 — 클라이언트에 키 노출 X                       |
| VAPID 분리          | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (public) / `VAPID_PRIVATE_KEY` (server-only)            |
| 입력 검증           | Zod 스키마 (로그인/편지/닉네임) + grapheme 단위 길이 + zero-width/HTML 특수문자 차단   |
| XSS 자동 escape     | React JSX 기본 동작. `dangerouslySetInnerHTML` 사용 금지                               |
| 401 race            | axios interceptor 가 단일 refresh promise 공유                                         |
| 외부 이미지         | `next.config.js` `remotePatterns` 화이트리스트                                         |
| 보안 헤더           | HSTS / X-Content-Type-Options / X-Frame-Options / Referrer-Policy / Permissions-Policy |
| CSP                 | Report-Only 모드로 시작 — 운영 안정화 후 enforce                                       |
| 로그아웃 cache 정리 | `clearAllCaches()` 로 SW 캐시 비움 (다음 사용자 격리)                                  |
| Env 타입 안전       | `src/types/env.d.ts` — `NEXT_PUBLIC_*` 만 자동완성                                     |
| CI 의존성 점검      | `npm audit --audit-level=high` + Dependabot                                            |

### 보안 헤더 (`next.config.js` `headers()`)

모든 응답에 적용:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options:    nosniff
X-Frame-Options:           DENY
Referrer-Policy:           strict-origin-when-cross-origin
Permissions-Policy:        geolocation=(self), notifications=(self),
                           camera=(), microphone=(), payment=(), interest-cohort=()
```

권한 정책은 **사용하는 것만 self**, 나머지는 모두 **빈 괄호로 명시적 거부**.

### Content Security Policy (CSP)

현재는 `Content-Security-Policy-Report-Only` — 위반을 차단하지 않고 보고만 받음.

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://tong.visitkorea.or.kr;
font-src 'self' data:;
connect-src 'self' <NEXT_PUBLIC_API_URL> https://*.sentry.io;
worker-src 'self';
manifest-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

#### 단계별 강화 로드맵

1. **현재**: Report-Only — 운영 환경에서 위반 보고 모니터링
2. **1주 후**: 보고가 안정되면 `Content-Security-Policy` 로 전환 (enforce)
3. **추후**: middleware 에서 nonce 발급 → `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'` → inline-script 의존 제거 가능 시 `'unsafe-inline'` 삭제

#### nonce 패턴 예시 (운영 안정화 후)

```ts
// middleware.ts 안에서
const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
const csp = `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; ...`;
response.headers.set('Content-Security-Policy', csp);
response.headers.set('x-nonce', nonce);

// Server Component 에서
import { headers } from 'next/headers';
const nonce = (await headers()).get('x-nonce') ?? '';
<Script nonce={nonce} ... />
```

### CSRF 방어 (백엔드 협의 필요)

HttpOnly Cookie 는 XSS는 막지만 **CSRF에는 자동으로 방어되지 않음**. 3-Layer 방어 권장:

**Layer 1 — SameSite 쿠키 (백엔드)**

```
Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Lax
```

대부분의 CSRF 케이스 자동 차단. cross-origin 인증이 필요한 경우만 `SameSite=None`.

**Layer 2 — Origin/Referer 검증 (백엔드 미들웨어)**
모든 state-changing 요청 (POST/PUT/DELETE/PATCH) 에서 `Origin` 헤더 화이트리스트 검증.

**Layer 3 — CSRF Double-Submit Token (민감 작업만)**
회원 탈퇴, 비밀번호 변경, 차단 해제 등 고위험 작업에 적용:

```
1) 백엔드: GET /csrf-token → 응답 body + 별도 쿠키에 토큰 set
2) 프론트: 요청 시 X-CSRF-Token 헤더에 그대로 첨부
3) 백엔드: 헤더 === 쿠키 일치 검증
```

axios interceptor 에 자동 첨부 패턴 적용 가능.

### Rate Limiting (백엔드)

프론트는 막을 수 없음. 백엔드에서 반드시 구현:

| 엔드포인트               | 권장 limit                             |
| ------------------------ | -------------------------------------- |
| `POST /auth/login`       | 분당 5회 / IP                          |
| `POST /auth/refresh`     | 분당 30회 / 토큰                       |
| `POST /letters`          | 시간당 20회 / 사용자                   |
| `POST /letters/:id/like` | 분당 60회 / 사용자                     |
| `POST /tournaments`      | 시간당 50회 / 사용자                   |
| `POST /location/reverse` | 분당 30회 / 사용자 (TourAPI 호출 비용) |
| `POST /quiz/submit`      | 분당 5회 / 사용자                      |

권장 구현: **@upstash/ratelimit + Vercel Edge Middleware** 또는 백엔드 측 Redis 기반.

### 입력 검증 패턴

#### 닉네임 (`features/onboarding/schemas/nickname.ts`)

- 길이 1~10자 (grapheme 단위)
- 허용 문자: `[가-힣a-zA-Z0-9_]` 만
- zero-width / 제어문자 / HTML 특수문자 차단
- homograph 공격 (위장 닉네임) 차단

#### 편지 본문 (`features/letter/schemas/letter.ts`)

- 1~5자 (grapheme 단위)
- 공백만 입력 금지
- zero-width / 제어문자 / HTML 특수문자 차단

#### 백엔드 측 책임

- 비속어 사전 매칭 후 reject
- 중복 닉네임 정책
- 출력 시 escape (이중 안전망)

### 환경 변수 안전

```bash
# .env.example
# === Public (NEXT_PUBLIC_*) — 브라우저 번들에 그대로 포함됨 ===
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
NEXT_PUBLIC_SENTRY_DSN=

# === Server-only — 절대 NEXT_PUBLIC_ 붙이지 말 것 ===
VAPID_PRIVATE_KEY=
SENTRY_AUTH_TOKEN=
```

타입 안전: `src/types/env.d.ts` 가 `process.env.*` 자동완성 + 누락 변수 컴파일 에러로 잡힘.

⚠️ **절대 하지 말 것**:

- API 키, 비밀번호, 토큰을 `NEXT_PUBLIC_*` 에 넣기
- `localStorage` 에 access_token 저장
- `.env.local` 을 git 에 커밋
- 백엔드 secret을 클라이언트 fetch 호출에 포함

### Sentry 데이터 스크러빙 (도입 시)

Sentry는 무심코 PII가 새는 가장 흔한 경로. `sentry.client.config.ts`:

```ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  beforeSend(event) {
    // URL 쿼리에서 토큰류 파라미터 제거
    if (event.request?.url) {
      event.request.url = event.request.url.replace(
        /([?&])(token|code|access_token|refresh_token)=[^&]*/gi,
        '$1$2=***',
      );
    }
    // body에 비밀번호/토큰 포함되면 제거
    if (event.request?.data && typeof event.request.data === 'object') {
      const data = event.request.data as Record<string, unknown>;
      ['password', 'token', 'refresh_token', 'access_token'].forEach((k) => {
        if (k in data) data[k] = '***';
      });
    }
    return event;
  },
  initialScope: { user: undefined }, // 사용자 식별이 꼭 필요할 때만 ID 설정
});
```

### Service Worker / PWA 보안

| 항목                       | 정책                                                                      |
| -------------------------- | ------------------------------------------------------------------------- |
| API 응답 캐시              | **금지** — 사용자별 데이터 누설 위험. `runtimeCaching` 에 API 패턴 없음 ✓ |
| 이미지 캐시                | TourAPI 30일, 기타 7일 (응답에 인증 정보 없음)                            |
| 정적 자원                  | `_next/static/*` 1년 immutable                                            |
| 로그아웃 시                | `clearAllCaches()` 호출 — 다음 사용자 격리 ✓                              |
| 권한 요청                  | `getCurrentPosition` 은 사용자 액션 직후만 (iOS 정책) ✓                   |
| `LocationPermissionPrompt` | 브라우저 prompt 전 사전 안내 → 거부율 감소                                |

### XSS 방어 체크리스트

- [x] React JSX 자동 escape 활용
- [x] `dangerouslySetInnerHTML` 사용 안 함 (코드베이스 grep 정기 점검)
- [x] 닉네임/편지에 HTML 특수문자/zero-width 차단
- [x] CSP 적용 (Report-Only → enforce 예정)
- [x] 외부 이미지 도메인 화이트리스트
- [ ] 마크다운 렌더링 추가 시 → **DOMPurify** 필수

### 컨텐츠 안전 (백엔드 책임)

- **비속어 필터** — 닉네임/편지/유형 테스트 답변에 적용
- **차단 사용자 ACL** — `/settings` 의 차단 목록과 연동 (편지 수신 거부)
- **신고 기능** — 편지 상세에 "신고" 추가 검토 (사이트맵 v3 후보)
- **부적절 컨텐츠 자동 검출** — Google Perspective API 등 (선택)

### 의존성 & 공급망 보안

`.github/workflows/ci.yml`:

- `npm ci` — lockfile 정합성 검증
- `npm audit --audit-level=high` — high 이상 취약점 발견 시 빌드 실패
- `actions/dependency-review-action@v4` — PR 단위 취약점 차단 + 라이선스 화이트리스트

`.github/dependabot.yml`:

- 매주 월요일 자동 PR
- patch 업데이트 묶음, minor 묶음
- 보안 알림은 즉시 별도 PR

```bash
# 로컬에서 점검
npm audit
npx license-checker --production \
  --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;0BSD;CC0-1.0"

# 시크릿 누출 검사 (도입 시)
npx gitleaks detect
```

GitHub Secret Scanning (무료) 활성화 권장 — repo settings에서 토글.

### 컴플라이언스 (한국 법령)

대상 법령: **개인정보보호법(PIPA)**, **위치정보의 보호 및 이용 등에 관한 법률**, **정보통신망법**

#### 회원가입 시 동의 항목 (`features/onboarding/components/ConsentBlock.tsx`)

- [필수] 만 14세 이상 확인
- [필수] 이용약관 동의 → `/policy/terms`
- [필수] 개인정보처리방침 동의 → `/policy/privacy`
- [선택] 위치정보 수집·이용 동의 (위치정보법 별도 동의)
- [선택] 마케팅 정보 수신 동의 (정보통신망법)

**원칙**: 필수/선택 명확히 분리, "전체 동의" 가 필수만 강제하지 않음.

#### 정적 페이지 (자리잡이만 만들어 둠 — 법무 검토 후 본문 교체)

- `/policy/terms` — 이용약관
- `/policy/privacy` — 개인정보처리방침 (수집 항목/목적/보유 기간/제3자 제공/처리 위탁/이용자 권리)
- `/policy/licenses` — 오픈소스 라이선스

#### 약관 버전 관리

- 백엔드 user 레코드에 `termsVersion`, `privacyVersion` 저장
- 약관 업데이트 시 버전 증가 → `AuthBootstrap` 에서 비교 → 변경된 사용자에게 재동의 UI 노출

#### 회원 탈퇴 정책 (백엔드 협의)

- soft delete (30일 유예) 권장
- 보낸 편지 처리: 익명 처리 후 보존? 함께 삭제? — 정책 결정 필요
- 즉시 삭제 + 관련 법령 보존 의무 데이터만 별도 보관

#### 데이터 이전성 (선택)

- 본인 정보 export 기능 — GDPR 시 필수, PIPA 시 권장
- `GET /me/export` → JSON 다운로드

### 운영 전 체크리스트

- [ ] 보안 헤더 운영 환경에서 동작 확인 (`securityheaders.com` A+ 목표)
- [ ] CSP Report-Only 위반 1주 모니터링 → enforce 전환
- [ ] 백엔드 CSRF Layer 1 (`SameSite=Lax`) 적용
- [ ] 백엔드 CSRF Layer 2 (Origin 검증) 적용
- [ ] 백엔드 Rate limit 위 표대로 적용
- [ ] Sentry 도입 시 `beforeSend` 스크러빙 적용
- [ ] 약관/개인정보처리방침 본문 법무 검토
- [ ] `ConsentBlock` 을 회원가입 흐름에 통합
- [ ] Dependabot 활성화 + GitHub Secret Scanning 활성화
- [ ] `npm audit` PR 단계에서 통과 확인
- [ ] 위치정보 처리방침에 "쿼리 파라미터로만 사용, 저장하지 않음" 명시

### 정기 점검 (출시 후)

- 월 1회: `npm audit` + Dependabot PR merge
- 분기 1회: CSP 위반 보고서 리뷰
- 연 1회: 약관/처리방침 갱신 검토 + 의존성 메이저 업데이트 검토

---

## 추가 권장 라이브러리 (로드맵)

현재 `package.json` 에는 들어있지 않지만, 운영 품질과 테스트 자동화를 위해 단계적으로 추가하면 좋은 라이브러리 목록입니다. **런타임 추가는 60KB 미만** (gzip 합산, 대부분 동적 로드 가능), **테스트 도구는 0KB** (devDependencies).

### 도입 현황 (구현 반영)

아래 로드맵 중 **도입 완료**된 항목:

| 라이브러리               | 상태    | 통합 위치                                                  |
| ------------------------ | ------- | ---------------------------------------------------------- |
| `@next/bundle-analyzer`  | ✅ 도입 | `next.config.js` — `ANALYZE=true npm run build`            |
| `@vercel/speed-insights` | ✅ 도입 | `providers.tsx` `<SpeedInsights />` + CSP connect-src 등록 |
| `plaiceholder` + `sharp` | ✅ 도입 | `src/lib/blur.ts` — 외부 이미지 LQIP 서버 헬퍼             |
| `lucide-static`          | ✅ 도입 | `npm run build:icons` → `public/icons.svg` (19 icons)      |
| `msw`                    | ✅ 도입 | `src/mocks/*` 활성화 + same-origin proxy (위 MSW 섹션)     |

**미도입 — 아키텍처 우선순위 순**:

- 🔴 `vitest` + `@testing-library/{react,user-event,jest-dom}` + `happy-dom` + `@vitest/coverage-v8` — 유닛/컴포넌트 테스트 (`src/mocks/server.ts`만 준비됨, 설정 0%)
- 🔴 `sonner` — toast 렌더러 (`ui-store` 큐에 어댑터 연결 필요, 현재 피드백 미표시)
- 🟡 `@playwright/test` — E2E (MSW 핸들러 공유)
- 🟡 `@sentry/nextjs` — 에러 추적 (`NEXT_PUBLIC_APP_VERSION` release 태깅)
- 🟡 `@vercel/analytics` — page view/이벤트 (speed-insights와 별개, `analytics` 추상화의 provider로 연결)

**일반 로그인만 → 추가 안 함**:

- `next-auth` / `@auth/core` / kakao·google·naver SDK — 소셜 OAuth 없음
- `jwt-decode` 등 클라이언트 토큰 라이브러리 — HttpOnly Cookie라 프론트가 토큰 비취급
- 추가 상태관리(redux 등) — zustand로 충분

**이번 구현으로 추가된 아키텍처 모듈** (라이브러리 외):

- `src/stores/location-store.ts` — resolve된 위치를 세션 동안 공유 (재요청 방지)
- `src/lib/blur.ts` — 외부 이미지 LQIP(base64) 생성, React `cache()` + fetch 7일 revalidate
- `services/interceptors/timing.ts` 운영 송신 — slow/error API를 `analytics` 의 `api.slow`/`api.error` 이벤트로 (pathname만, query 제거)
- `.github/workflows/lighthouse.yml` + `lighthouserc.json` — PR/main 성능 회귀 CI (baseline 단계 warn)
- `package.json` `overrides` — `serialize-javascript`/`postcss` 보안 패치 (transitive)

### 🔴 즉시 추가 — 런타임

| 라이브러리          | 크기  | 용도                                                                                                       |
| ------------------- | ----- | ---------------------------------------------------------------------------------------------------------- |
| **sonner**          | ~5KB  | Toast UI. `ui-store.ts` 의 toast 상태에 실제 렌더 연결. 저장/전송 피드백.                                  |
| **motion**          | ~18KB | 토너먼트 카드 전환, 사다리타기 경로, 도장깨기 모션, 페이지 transition. `motion/react` 진입으로 tree-shake. |
| **canvas-confetti** | ~5KB  | 우승 결과 컨페티. PWA 게임감 ↑.                                                                            |

```bash
npm i sonner motion canvas-confetti
npm i -D @types/canvas-confetti
```

설치 후:

- `app/layout.tsx` 의 `<Providers>` 안에 `<Toaster richColors position="top-center" />` 추가
- `ui-store.ts` 의 `showToast` 가 `sonner` 의 `toast()` 를 호출하도록 어댑터화

### 🔴 즉시 추가 — 개발/운영

| 라이브러리                | 종류          | 용도                                                                  |
| ------------------------- | ------------- | --------------------------------------------------------------------- |
| **msw**                   | dev           | API mocking — 백엔드 미준비 상태 개발 + 테스트에서 동일 핸들러 재사용 |
| **@sentry/nextjs**        | runtime ~30KB | 운영 환경 에러 추적. App Router/RSC 모두 캐치.                        |
| **@next/bundle-analyzer** | dev           | "가볍게" 목표 검증. recharts/embla 분리 여부 확인.                    |

```bash
npm i -D msw @next/bundle-analyzer
npm i @sentry/nextjs
npx msw init public/ --save        # service worker 등록
npx @sentry/wizard@latest -i nextjs # Sentry 자동 설정
```

#### MSW 구조 (테스트와 공유)

```
src/mocks/
 ├─ handlers.ts        REST 핸들러 (TourAPI/auth/letter 등 mock)
 ├─ server.ts          for vitest (setupServer)
 └─ browser.ts         for dev (setupWorker)
```

`next.config.js` 에는 `withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })` 를 추가하고 `ANALYZE=true npm run build` 로 시각화 리포트 생성.

---

### 🟡 자동 테스트 스택 (전부 devDependencies, 런타임 영향 0)

#### Unit + Component 테스트

| 라이브러리                      | 용도                                               |
| ------------------------------- | -------------------------------------------------- |
| **vitest**                      | jest 대비 2~3배 빠름. Vite 기반이라 TS/ESM 설정 0. |
| **@vitejs/plugin-react**        | vitest의 React JSX 지원                            |
| **@testing-library/react**      | 컴포넌트 테스트 표준                               |
| **@testing-library/user-event** | 실사용자처럼 클릭/타이핑                           |
| **@testing-library/jest-dom**   | `toBeInTheDocument()` 등 매처                      |
| **happy-dom**                   | jsdom보다 빠른 DOM 환경 (Vitest 공식 권장)         |
| **@vitest/coverage-v8**         | V8 native coverage                                 |

```bash
npm i -D vitest @vitejs/plugin-react @testing-library/react \
  @testing-library/user-event @testing-library/jest-dom \
  happy-dom @vitest/coverage-v8
```

`vitest.config.ts` (프로젝트 루트):

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['src/generated/**', 'src/i18n/messages/**', '**/*.module.scss'],
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
});
```

`vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './src/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

`scripts` 추가:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

#### E2E 테스트

| 라이브러리           | 용도                                                            |
| -------------------- | --------------------------------------------------------------- |
| **@playwright/test** | 멀티브라우저 E2E. iOS/Android 뷰포트 프리셋. 비디오/trace 자동. |

```bash
npm i -D @playwright/test
npx playwright install --with-deps
```

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'npm run build && npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

E2E 핵심 시나리오 (`e2e/` 하위):

- `auth.spec.ts` — 로그인 → 온보딩 3step → 홈
- `tournament.spec.ts` — 테마 선택 → 매치업 → 우승 → 저장
- `letter.spec.ts` — 5글자 작성 → 보내기 → 받은 편지 좋아요
- `i18n.spec.ts` — 언어 전환 시 라벨 즉시 갱신
- `pwa.spec.ts` — 오프라인 캐시 동작

`scripts`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

#### 테스트 시 통합 포인트

기존 스택과의 통합 패턴:

**next-intl** — 메시지 주입 래퍼:

```tsx
// test-utils.tsx
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/i18n/messages/ko.json';

export function renderWithIntl(ui: React.ReactElement, locale = 'ko') {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}
```

**TanStack Query** — 테스트마다 새 QueryClient (`retry: false`):

```tsx
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}
```

**Zustand** — 각 테스트 전 store reset:

```ts
beforeEach(() => {
  useAuthStore.setState({ isAuthenticated: false, user: undefined });
});
```

**MSW** — vitest의 setup과 Playwright의 globalSetup에서 **동일 핸들러 공유**:

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
export const handlers = [
  http.get('*/me', () =>
    HttpResponse.json({ id: '1', nickname: '테스터', isOnboarded: true }),
  ),
  // ...
];
```

#### CI 통합

`.github/workflows/ci.yml` 에 추가:

```yaml
- run: npm run test:run
- run: npm run test:coverage
- uses: actions/upload-artifact@v4
  with:
    name: coverage
    path: coverage/
    retention-days: 7

- run: npx playwright install --with-deps chromium
- run: npm run test:e2e
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 7
```

---

### 🟢 빠르게 가치 있음

| 라이브러리                     | 용도                                                                        |
| ------------------------------ | --------------------------------------------------------------------------- |
| **plaiceholder + sharp**       | build-time blur placeholder 생성. TourAPI hero 이미지 LCP 개선. 런타임 0KB. |
| **@use-gesture/react** (~10KB) | 편지 카드 스와이프 삭제, 도장맵 핀치 줌. Embla 보완.                        |

```bash
npm i -D plaiceholder sharp
npm i @use-gesture/react
```

---

### ⚪ 상황 발생 시 추가 (지금은 X)

| 라이브러리                  | 트리거                                             |
| --------------------------- | -------------------------------------------------- |
| **@tanstack/react-virtual** | 편지함 1,000개 이상 누적 시                        |
| **xstate**                  | 토너먼트 패자부활/동률 등 복잡한 상태 머신 필요 시 |
| **next-themes**             | 사용자 토글 다크모드                               |
| **storybook**               | 컴포넌트 카탈로그 필요 시 (PWA에선 보통 사치)      |

---

### ⛔ Next.js 내장으로 충분 — 추가 안 함

- **공유 카드 이미지** → `next/og` (`ImageResponse`). html2canvas 불필요.
- **상대 시간 / 숫자 포맷** → next-intl 의 `useFormatter()`. date-fns/dayjs 불필요.
- **약관 페이지** → Server Component JSX. react-markdown 불필요.
- **햅틱/사운드** → `navigator.vibrate()`, Web Audio API 직접.

---

### 🎨 토너먼트 흩날림 효과 — 라이브러리 추가 X

벚꽃/물방울/단풍/눈꽃 파티클은 **커스텀 Canvas (~50줄)** 로 직접 구현 권장:

- 의존성 0KB
- 60fps 보장 (GPU 가속)
- 4계절별 모양/색/낙하속도 파라미터화

위치: `features/tournament/components/FallingParticles.tsx`

tsparticles(50KB+) 는 토너먼트 페이지 진입을 무겁게 함. motion + DOM 노드 N개는 reflow 비용. → **Canvas 가 최적해**.

---

### 단계별 도입 권장 순서

1. **Phase 1 (개발 시작 시)** — msw + @next/bundle-analyzer + 테스트 스택 (vitest + playwright)
2. **Phase 2 (UI 본격 구현)** — sonner + motion + canvas-confetti
3. **Phase 3 (베타 직전)** — @sentry/nextjs + plaiceholder
4. **Phase 4 (필요 시)** — @use-gesture/react, react-virtual 등

---

## 향후 도입 보류

복잡도는 필요할 때만 추가:
Turborepo / Micro Frontend / Redux / GraphQL / Kubernetes / @tanstack/react-virtual

---

## 아키텍처 확장 (UX / 운영 / 협업)

사이트맵 v2 위에 얹은 횡단 관심사 모음. 모든 영역이 "작은 코드, 큰 효과" 원칙.

### 디자인 토큰 (`src/app/globals.scss`)

| 카테고리   | 토큰                                                                                   |
| ---------- | -------------------------------------------------------------------------------------- |
| Color      | `--color-bg / fg / muted / border / primary / primary-fg / danger / success / warning` |
| Spacing    | `--space-1` ~ `--space-12` (4px 그리드)                                                |
| Radius     | `--radius-sm / md / lg / xl / full`                                                    |
| Typography | `--text-xs ~ 3xl`                                                                      |
| Icon size  | `--icon-sm / md / lg / xl` (의미별 사이즈 통일)                                        |
| Z-index    | `--z-base / elevated / header / bottom-nav / dropdown / banner / modal / toast`        |
| Elevation  | `--shadow-sm / md / lg`                                                                |
| Layout     | `--content-max / header-h / bottom-nav-h`                                              |

다크모드는 `prefers-color-scheme` 자동 — 사용자 토글은 향후 `next-themes` 도입 시.

### Cross-cutting hooks (`src/hooks/`)

| 훅                            | 용도                                                            |
| ----------------------------- | --------------------------------------------------------------- |
| `use-keyboard`                | Esc 닫기, cmd+k 등 단축키. input 안에선 무시 (modifier 없을 때) |
| `use-focus-trap`              | 모달 안에 포커스 가두기 + 닫힐 때 이전 포커스 복원              |
| `use-unsaved-changes-warning` | 편지/온보딩 작성 중 페이지 떠나기 전 `beforeunload` 경고        |
| `use-form-error`              | axios 에러 → RHF `setError` 자동 매핑 (필드 + 루트)             |
| `use-scroll-restoration`      | 무한스크롤 위치 보존/복원 (뒤로가기 시)                         |
| `use-intersection`            | IntersectionObserver 추상화 (rootMargin 200px)                  |
| `use-confirm`                 | Promise 기반 확인 다이얼로그 (큐 + ui-store)                    |

### Cross-cutting utilities (`src/lib/`)

| 모듈       | 용도                                                                               |
| ---------- | ---------------------------------------------------------------------------------- |
| `haptic`   | `navigator.vibrate` 추상화. tap/success/warning/longPress. reduced-motion 자동 off |
| `version`  | `APP_VERSION` 노출 (settings 하단, /api/health 응답, Sentry release)               |
| `toast`    | `toast.success/error/info/warning` — ui-store push 어댑터                          |
| `sw-cache` | `clearAllCaches()` — 로그아웃 시 사용자 격리                                       |
| `cache`    | TanStack Query 캐시 프로파일 7종                                                   |
| `dynamic`  | `clientOnly()` / `ssrLazy()` 동적 import 헬퍼                                      |

### 표준 피드백 컴포넌트 (`src/components/feedback/`)

| 컴포넌트        | 사용처                                                                   |
| --------------- | ------------------------------------------------------------------------ |
| `Skeleton`      | 로딩 자리잡이 (CSS shimmer, reduced-motion 존중)                         |
| `EmptyState`    | 편지함 / 토너먼트 기록 / 시군 탭 / 알림 — 4~5군데 일관 사용              |
| `Toaster`       | ui-store 의 toast 큐 렌더. BottomNav 위에 위치                           |
| `ConfirmDialog` | 회원 탈퇴 / 편지 삭제 / 우승지 삭제 / 차단 해제                          |
| `SegmentError`  | 세그먼트별 `error.tsx` 의 공통 UI — `export { SegmentError as default }` |

### 세그먼트별 error boundary

```
src/app/(main)/
 ├─ tournament/error.tsx
 ├─ letter/error.tsx
 ├─ quiz/error.tsx
 ├─ ranking/error.tsx
 ├─ region/error.tsx
 ├─ mypage/error.tsx
 └─ settings/error.tsx
```

각 파일은 한 줄: `export { SegmentError as default } from '@/components/feedback/SegmentError';`

에러 발생 시 **헤더/네비/홈은 살아있고 해당 세그먼트만 reset** → 사용자 부분 복구.

### Analytics 추상화 (`src/features/analytics/`)

```tsx
import { track } from '@/features/analytics';

track('tournament.completed', { winnerId, category, duration_ms: 12_345 });
track('letter.sent', { length: 5 });
```

- `types/index.ts` 의 `TrackEventMap` 가 이벤트 사전. 새 이벤트 추가 시 여기 등록 → typo 컴파일 에러로 잡힘
- 기본 provider: dev=console, prod=noop
- 실제 도구 (Vercel Analytics / GA / Mixpanel) 도입 시 `providers/vercel.ts` 추가 → 호출부 변경 X
- `usePageView` 가 라우트 변경 시 자동으로 `page.viewed` 전송 (Providers 안에 마운트됨)
- PII (email/nickname/좌표) payload 금지

### PWA 운영 (`src/features/pwa/`)

| 컴포넌트              | 동작                                                                           |
| --------------------- | ------------------------------------------------------------------------------ |
| `PwaUpdateBanner`     | 새 SW 감지 → "새 버전이 있어요" → 클릭 시 skipWaiting + reload                 |
| `OfflineBanner`       | 온라인/오프라인 토글. SW 캐시된 콘텐츠는 그대로 표시                           |
| `InstallPromptBanner` | `beforeinstallprompt` 캡처 → 적절한 시점에 노출. dismiss는 sessionStorage 기억 |

모두 `Providers` 안에 마운트되어 어디서든 동작.

### 운영 라우트

- **`GET /api/health`** — `{ ok, version, timestamp }`. Edge runtime. Vercel uptime / 외부 monitor / 버그 리포트 시 버전 확인
- **`/offline`** — SW fallback 페이지. 캐시 안 된 페이지에 오프라인 진입 시
- **`/dev/components`** — 컴포넌트 카탈로그. dev 환경에서만 접근 (운영에선 `notFound()`)

### 버전 노출

```bash
# 빌드 시점에 주입
NEXT_PUBLIC_APP_VERSION=$(git rev-parse --short HEAD) npm run build

# Vercel
NEXT_PUBLIC_APP_VERSION=$VERCEL_GIT_COMMIT_SHA
```

- `/settings` 페이지 하단에 표시
- `/api/health` 응답에 포함
- Sentry release 태그로 활용 (도입 시)

### Mocks (`src/mocks/`)

```
mocks/
 ├─ handlers.ts        REST 핸들러 (msw 도입 후 활성화 — 예시 주석 포함)
 ├─ server.ts          vitest용 setupServer 자리
 ├─ browser.ts         dev용 setupWorker 자리
 └─ seeds/
     ├─ regions.ts        11시군 × 5 = 55개
     ├─ letters.ts        받은 편지 30개 (페이지네이션 테스트)
     ├─ tournament.ts     기록 15개
     └─ notifications.ts  7개 (안 읽음 3 + 읽음 4)
```

msw 설치 후 `handlers.ts` 의 예시 주석을 활성화하면 동일 핸들러를 dev / vitest / playwright 가 공유.

### 협업 자동화 (`.husky/`, `.github/`)

| 파일                                        | 목적                                                             |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `.husky/pre-commit`                         | `lint-staged` 실행 — 변경 파일만 lint + format                   |
| `.husky/commit-msg`                         | `commitlint` — Conventional Commits 강제                         |
| `.lintstagedrc.json`                        | `*.{ts,tsx}` → ESLint+Prettier, `*.{md,scss,json}` → Prettier    |
| `commitlint.config.js`                      | type enum: feat/fix/refactor/perf/style/docs/test/chore/ci/build |
| `.github/PULL_REQUEST_TEMPLATE.md`          | 변경 요약 / 영역 / 테스트 / 스크린샷 / 영향 범위                 |
| `.github/ISSUE_TEMPLATE/bug_report.md`      | 재현 단계 / 환경 / 버전                                          |
| `.github/ISSUE_TEMPLATE/feature_request.md` | 문제 / 해결책 / 대안                                             |
| `.github/CODEOWNERS`                        | 보안/인증 영역 자동 리뷰어 지정                                  |

설치 후 한 번:

```bash
npm install            # postinstall에서 husky 자동 초기화
git add .husky/        # hook 파일 권한 보존
```

### 패턴 가이드

#### Optimistic update (좋아요/저장)

```tsx
useMutation({
  onMutate: async (id) => {
    await qc.cancelQueries({ queryKey });
    const prev = qc.getQueryData(queryKey);
    qc.setQueryData(queryKey, optimistic); // 즉시 반영
    return { prev };
  },
  onError: (_e, _v, ctx) => qc.setQueryData(queryKey, ctx?.prev), // 롤백
  onSettled: () => qc.invalidateQueries({ queryKey }),
});
```

#### 회원 탈퇴 / 편지 삭제 패턴

```tsx
const confirm = useConfirm();

async function onWithdraw() {
  const ok = await confirm({
    title: '정말 탈퇴할까요?',
    description: '저장한 우승지와 보낸 편지가 모두 삭제돼요.',
    confirmLabel: '탈퇴',
    destructive: true,
  });
  if (!ok) return;
  withdraw.mutate(undefined, {
    onSuccess: () => toast.success('탈퇴되었어요'),
  });
}
```

#### 무한스크롤 + 스크롤 복원

```tsx
function LetterboxReceived() {
  useScrollRestoration();
  const { items, fetchNext, hasNext, isFetchingNext } = useInfiniteList({
    queryKey: ['letters', 'received'],
    queryFn: ({ pageParam }) => letterApi.listReceivedPage({ cursor: pageParam }),
    cache: 'realtime',
  });
  return (
    <InfiniteList items={items} hasNext={hasNext} isFetchingNext={isFetchingNext}
      onReachEnd={fetchNext} keyExtractor={(l) => l.id}
      renderItem={(l) => <LetterCard letter={l} />}
      emptyState={<EmptyState icon={<Mail />} title={...} />}
    />
  );
}
```

### 새로 추가된 i18n 키

```
common.tryAgain
consent.{all,age14,terms,privacy,location,marketing}
pwa.update.{message,apply}
pwa.offline.{title,message}
pwa.install.{title,description,install,later,iosGuide}
onboarding.nickname.errors.{tooShort,tooLong,invalidChars,invisibleChar,controlChar}
letter.compose.errors.invalidChar
```

---

## 환경별 호환성 매트릭스

| 영역                      | Desktop Web | Android Web/PWA |  iOS Safari  |       iOS PWA       |
| ------------------------- | :---------: | :-------------: | :----------: | :-----------------: |
| 기본 라우팅/UI            |     ✅      |       ✅        |      ✅      |         ✅          |
| Service Worker / 캐시     |     ✅      |       ✅        |      ✅      |         ✅          |
| Web Push                  |     ✅      |       ✅        |   ⚠️ 16.4+   | ⚠️ 16.4+ standalone |
| `beforeinstallprompt`     |     ✅      |       ✅        |      ❌      |         ❌          |
| `navigator.vibrate`       |   ⚠️ 일부   |       ✅        |      ❌      |         ❌          |
| Geolocation               |     ✅      |       ✅        |      ✅      |         ✅          |
| 권한 재요청 (거부 후)     |  ✅ 설정→   |    ✅ 설정→     | ❌ OS 설정만 |    ❌ OS 설정만     |
| 100dvh                    |     ✅      |       ✅        |    ✅ 16+    |       ✅ 16+        |
| Background → 복귀 시 상태 |     ✅      |  ⚠️ 일부 폐기   | ⚠️ 폐기 흔함 |   🚨 빠르게 폐기    |

### 플랫폼 quirks 대응 (코드에 적용됨)

- **iOS PWA 상태 휘발성** → 토너먼트 store가 `zustand persist` + `sessionStorage` 자동 백업 (탭 종료 시만 휘발)
- **iOS `beforeinstallprompt` 미지원** → `InstallPromptBanner` 가 iOS Safari 감지 시 "공유 → 홈 화면에 추가" 안내 텍스트로 분기 (`lib/platform.ts`)
- **iOS `vibrate` 미지원** → `lib/haptic` 가 silent no-op
- **iOS 주소창 변동** → `globals.scss` 의 `min-height: 100dvh` + 페이지별 `100dvh` 사용
- **`prefers-reduced-motion`** → 햅틱, shimmer, banner slide, dialog animate 모두 자동 off

### 운영 전 검증 체크리스트

- [ ] **iOS Safari 17+ 실기기** 테스트 (시뮬레이터 X)
- [ ] **iOS PWA 설치 후 백그라운드 ↔ 복귀** 시나리오:
  - [ ] 토너먼트 1:1 매치 도중 다른 앱 → 복귀 시 진행도 유지
  - [ ] 편지 작성 중 다른 앱 → 복귀 (form 보존은 별도 작업 필요)
  - [ ] 무한스크롤 위치 복원
- [ ] **iOS PWA 푸시 알림** 실 발송 (16.4+ standalone)
- [ ] **느린 3G** Chrome DevTools 시뮬레이션 — 첫 페인트 3초 이내
- [ ] **Lighthouse Mobile** Performance 90+ 확보
- [ ] `securityheaders.com` A+ 확인
- [ ] **WebPageTest** 실측 (모바일 4G)

---

## 아이콘 — SVG Sprite 시스템

### 왜 sprite인가

| 방식                          | 누적 비용 (15 아이콘)            | 추가 비용     |
| ----------------------------- | -------------------------------- | ------------- |
| `lucide-react` named import   | ~15KB (각 모듈 오버헤드)         | 새 아이콘마다 |
| **SVG sprite (`<use href>`)** | **~5KB (sprite + 컴포넌트 1개)** | **0KB**       |

페이지마다 5~10개씩 누적되면 차이가 커집니다. PWA 환경에선 sprite가 SW로 캐시되어 첫 진입만 비용.

### 사용

```tsx
import { Icon } from '@/components/Icon';

<Icon name="home" size="md" />
<Icon name="trophy" size={26} aria-label={t('nav.tournament')} />
```

`IconName` 타입에 등록된 이름만 자동완성 + typo 컴파일 에러.

### Sprite 빌드

자주 쓰는 아이콘 19종은 `public/icons.svg` 에 하드코딩되어 바로 동작합니다. 운영용으로는 정확한 lucide 패스를 자동 추출하는 빌드 스크립트 사용:

```bash
npm i -D lucide-static
npm run build:icons   # scripts/build-icons.mjs → public/icons.svg 생성
```

새 아이콘 추가 절차:

1. `scripts/build-icons.mjs` 의 `ICONS` 배열에 추가
2. `src/components/Icon/Icon.tsx` 의 `IconName` 에 추가
3. `npm run build:icons` 실행

### 마이그레이션 현황

| 컴포넌트                        | 상태                                    |
| ------------------------------- | --------------------------------------- |
| `BottomNav`                     | ✅ Icon                                 |
| `AppHeader`                     | ✅ Icon                                 |
| `Toaster`                       | ✅ Icon                                 |
| `SubHeader` (chevron-left)      | 🟡 점진 마이그레이션                    |
| `SegmentError`, `EmptyState` 외 | 🟡 호출부에서 `<Icon />` 으로 점진 교체 |

자주 보이는 영역 (네비/헤더/토스트) 먼저 sprite화 → 메인 번들에서 lucide-react 의 해당 아이콘들 제거됨.

### Lucide-react 와 공존

드물게 쓰는 아이콘은 `lucide-react` 그대로 사용해도 OK. `optimizePackageImports: ['lucide-react']` 가 자동으로 사용 부분만 import.

---

## 이미지 — 네트워크 패킷 최소화

### 적용된 최적화

| 영역             | 설정                                                    |
| ---------------- | ------------------------------------------------------- |
| 포맷 우선순위    | AVIF → WebP → 원본                                      |
| Quality 기본값   | 75 (시각 차이 거의 없음, 30% 절감)                      |
| Device sizes     | 360 / 640 / 750 / 828 / 1080 / 1200 / 1920              |
| 외부 이미지 캐시 | TourAPI 30일 CacheFirst, 기타 7일 SWR                   |
| Resource hints   | `preconnect` + `dns-prefetch` to TourAPI (`layout.tsx`) |
| Blur placeholder | 1px 회색 fallback (호출부에서 `blurDataURL` 지정 권장)  |
| `priority`       | LCP 후보 (시군 hero, 토너먼트 우승지 메인) 에만         |

### 호출 패턴

```tsx
// LCP — priority + fill
<OptimizedImage src={hero} alt={title} priority fill sizes="100vw" />

// 카드 썸네일 — 고정 크기
<OptimizedImage src={thumb} alt={title} width={120} height={120} sizes="120px" />

// 리스트 — 반응형
<OptimizedImage
  src={url} alt={title} fill
  sizes="(max-width: 600px) 100vw, 50vw"
/>
```

### TourAPI 이미지 — 백엔드 협의 필요

TourAPI 원본은 보통 1MB+ JPG. 그대로 next/image 변환만 의존하면:

- next/image 첫 요청 시 변환 작업 비용 발생 (cold start)
- 단일 size 만 변환되어 캐싱

권장 백엔드/CDN 가이드:

| 변환    | 크기                 | 용도             |
| ------- | -------------------- | ---------------- |
| `thumb` | 240×240 WebP, ~10KB  | 카드 썸네일      |
| `card`  | 480×360 WebP, ~30KB  | 리스트 카드      |
| `hero`  | 1080×720 AVIF, ~80KB | 시군/우승지 상단 |

백엔드 응답:

```json
{
  "imageUrl": "https://cdn.example.com/tour-api/abc123",
  "imageVariants": {
    "thumb": "https://cdn.example.com/tour-api/abc123?w=240&fm=webp",
    "card": "https://cdn.example.com/tour-api/abc123?w=480&fm=webp",
    "hero": "https://cdn.example.com/tour-api/abc123?w=1080&fm=avif"
  }
}
```

CDN 권장: Cloudflare Images / imgix / Cloudinary / Vercel Image Optimization. 캐시 hit 시 응답 50ms 내.

### 실측 가이드

#### 1) Web Vitals 자동 측정 (적용 완료)

`WebVitalsTracker` 가 Providers 안에 마운트되어 모든 페이지에서 자동 측정:

- FCP / LCP / INP / CLS / TTFB
- 개발 환경: 콘솔에 `[vitals] LCP: 1842 (good)` 형식 출력
- 운영: `useReportWebVitals` 콜백 안에서 `navigator.sendBeacon('/api/metrics', ...)` 또는 Sentry/Vercel Analytics 로 전송

#### 2) API 응답 시간 자동 측정 (적용 완료)

`services/interceptors/timing.ts` 가 axios 인스턴스에 부착되어 모든 백엔드 호출의 응답 시간 측정:

- 1초 초과 시 개발 콘솔에 `[api:slow] 200 /letters/received 1240ms` 경고
- 운영: 동일 interceptor 안에서 analytics 도구로 전송 가능
- TourAPI 프록시 / 편지함 / 토너먼트 후보 등 모든 호출 자동 적용

#### 3) Bundle Analyzer (즉시 실행 가능)

```bash
# 1회: 의존성 설치 (devDep)
npm i -D @next/bundle-analyzer

# 빌드 + 시각화
ANALYZE=true npm run build
# → .next/analyze/client.html / server.html 자동 열림
```

확인 항목:

- recharts 가 main 청크 아닌 별도 chunk 인지
- embla-carousel 도 동일
- lucide-react 가 사용된 아이콘만 포함되는지 (sprite 마이그레이션 검증)
- 페이지별 청크 크기

#### 4) Lighthouse CI (운영 직전 권장)

```bash
# 1회 측정
npx lighthouse https://your-app.vercel.app \
  --form-factor=mobile \
  --throttling-method=simulate \
  --view

# CI 통합 (GitHub Actions)
# .github/workflows/lighthouse.yml 추가:
#   - uses: treosh/lighthouse-ci-action@v11
#     with:
#       urls: |
#         https://your-app.vercel.app/
#         https://your-app.vercel.app/ranking
#         https://your-app.vercel.app/letter
#       configPath: ./lighthouserc.json
```

`lighthouserc.json` 예시:

```json
{
  "ci": {
    "collect": {
      "settings": { "preset": "perf", "emulatedFormFactor": "mobile" }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }]
      }
    }
  }
}
```

#### 5) WebPageTest (실측)

```
https://www.webpagetest.org/
  Test Location: 도쿄/서울 (한국 사용자 시뮬레이션)
  Browser:       Chrome on Pixel 7
  Connection:    4G LTE
  Number of Tests: 9 (median 신뢰성)
```

확인 지표: Speed Index, LCP, Time to Interactive, Filmstrip.

#### 6) Chrome DevTools 느린 3G 시뮬레이션

```
DevTools → Network 탭 → No throttling 드롭다운
  → Slow 3G (~400Kbps, 400ms RTT)
또는
  → CPU throttling: 4x slowdown
```

체크리스트:

- [ ] 첫 화면 3초 이내 인터랙티브
- [ ] 토너먼트 매치업 카드 전환 60fps 유지
- [ ] InfiniteList 끝 닿기 전 다음 페이지 prefetch (rootMargin 200px)
- [ ] 이미지 lazy loading 동작 확인

#### 7) 임계값 표 (모바일 기준)

| 지표 | 목표   | 우수   | 현재 코드의 보호 장치                                  |
| ---- | ------ | ------ | ------------------------------------------------------ |
| FCP  | <1.8s  | <1.0s  | Server Component, preconnect                           |
| LCP  | <2.5s  | <1.8s  | `priority` LCP 이미지, AVIF, dynamic-subset 폰트       |
| INP  | <200ms | <100ms | dynamic import (recharts/embla), virtual DOM 최소화    |
| CLS  | <0.1   | <0.05  | 위젯 fixed height, blur placeholder, font-display:swap |
| TTFB | <800ms | <200ms | Edge runtime (/api/health), Vercel edge cache          |
| TBT  | <300ms | <200ms | 동적 import, optimizePackageImports                    |

#### 8) Bundle size budget (권장)

| 청크                            | 권장 한도   | 비고                                |
| ------------------------------- | ----------- | ----------------------------------- |
| First Load JS (홈)              | <200KB gzip | Server Component 위주라 가볍게 유지 |
| Recharts 청크                   | <120KB gzip | 차트 페이지 진입 시만 로드          |
| Embla 청크                      | <15KB gzip  | 캐러셀 사용 페이지만                |
| Lucide-react (sprite 마이그 후) | <5KB gzip   | 자주 안 쓰는 아이콘만               |
| icons.svg                       | <10KB       | 1년 immutable cache                 |

`ANALYZE=true npm run build` 결과와 위 표를 비교하여 회귀 감지.

### Third-party JS 영향 (도입 전 예측)

지금은 third-party JS가 없습니다. 도입 시 영향:

| 라이브러리                | 크기 (gzip)      | 영향도 | 권장 도입 방식                              |
| ------------------------- | ---------------- | ------ | ------------------------------------------- |
| **Vercel Analytics**      | ~1KB             | 무시   | 자동 통합, useReportWebVitals 연계          |
| **Sentry @sentry/nextjs** | ~30KB            | 중간   | route-level dynamic import, `enabled: prod` |
| **Google Analytics 4**    | ~50KB (gtag)     | 큼     | `<Script strategy="afterInteractive">`      |
| **Mixpanel / Amplitude**  | ~25KB            | 중간   | 동일 — afterInteractive                     |
| **Tag Manager (GTM)**     | ~30KB + 컨테이너 | 큼     | `lazyOnload` 또는 worker 모드 (Partytown)   |

3개 이상 third-party JS 도입 시 **Partytown** (Web Worker 로 격리) 검토.

---

## 한글 폰트 — Pretendard (적용됨)

### 현재 적용 방식: jsdelivr CDN + dynamic-subset

`layout.tsx` 의 `<head>` 에서 Pretendard CSS 로드:

```html
<link
  rel="preconnect"
  href="https://cdn.jsdelivr.net"
  crossorigin="anonymous"
/>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
/>
```

### 왜 jsdelivr dynamic-subset 인가

| 항목              | jsdelivr dynamic-subset               | self-host 단일 파일     |
| ----------------- | ------------------------------------- | ----------------------- |
| 첫 페인트 영향    | preconnect 로 critical path 영향 미미 | 같은 origin 0ms         |
| **다운로드 크기** | **사용 글리프만** (~80KB) ⭐          | 전체 한글+영문 (~120KB) |
| 페이지별 최적화   | 자동 (unicode-range)                  | X                       |
| 안정성            | jsdelivr CDN 글로벌                   | 우리 도메인만큼         |
| CSP               | `cdn.jsdelivr.net` 허용               | self 만                 |
| SW 캐시           | runtime cache (1년 immutable)         | next/static (1년)       |

dynamic-subset 의 핵심:

- CSS 가 `@font-face { unicode-range: U+AC00-D7AF; ... }` 처럼 여러 woff2 파일로 분할 정의
- 브라우저가 페이지에 실제 사용된 글리프 범위에 해당하는 woff2 만 다운로드
- 영문 페이지 → 영문 chunk (~20KB), 한국어 페이지 → 한글 chunk (~80KB)

### 안전망 (폰트 로딩 실패해도 OK)

`globals.scss` 의 `--font-sans` 가 시스템 폰트 폴백 보유:

```
'Pretendard Variable', Pretendard,
-apple-system, BlinkMacSystemFont,
'Apple SD Gothic Neo',    /* iOS 기본 한글 */
'Noto Sans KR',           /* Android 기본 한글 */
'Segoe UI', Roboto, ...
```

jsdelivr 장애 시에도 시스템 폰트로 즉시 렌더 (FOIT 없음).

### Self-host 마이그레이션 (운영 안정화 후 선택)

jsdelivr 의존 제거하고 같은 origin 으로 옮기려면:

```bash
npm i pretendard
```

`layout.tsx`:

```tsx
import localFont from 'next/font/local';

const pretendard = localFont({
  src: '../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
  display: 'swap',
  preload: true,
  variable: '--font-pretendard',
  weight: '45 920',
});

// <html lang={locale} className={pretendard.variable}>
```

이후 layout.tsx 의 jsdelivr `<link>` 2줄 제거 + `next.config.js` CSP/runtime cache 에서 jsdelivr 도메인 제거.

⚠️ 인트라넷/사내망 환경처럼 외부 CDN 차단된 곳에 배포한다면 self-host 필수.

---

## 이미지 저장 의사결정

> "CDN을 사용할만한 저장소를 가지고 있지 않다"는 상황에서:
> **현재 구조 (public/ + TourAPI 외부) 가 최적해입니다.**

### 의사결정 트리

```
이미지가 ...
├─ 우리 디자인/에셋 (변하지 않음) → public/
│   · Vercel 배포 시 자동으로 edge CDN 캐시 (전 세계)
│   · Brotli/HTTP3 자동 적용
│   · _next/static/* 와 함께 1년 immutable
│
├─ 외부 API (TourAPI) → 그대로 next/image
│   · Vercel Image Optimization 이 AVIF/WebP 자동 변환
│   · 첫 요청만 변환 비용, 이후 edge 캐시 hit
│   · PWA runtime cache 가 30일 추가 보호
│   · 별도 CDN/저장소 불필요
│
└─ 사용자 업로드 → 사이트맵에 없음, 추후 결정
    · 도입 시점에 Vercel Blob / Cloudinary / S3 비교
```

### "그럼 CDN 따로 안 써도 진짜 빠른가?" — Yes

```
사용자
  ↓ (HTTP/3, Brotli, edge cache)
Vercel Edge Network         ← 별도 결제 X (Hobby 플랜 포함)
  ├─ public/* (정적)         → 자동 immutable cache
  ├─ next/image (변환)       → 변환된 결과 edge cache
  └─ /api/*                  → 서버리스 (edge runtime 선택 가능)
       ↓
       백엔드 → TourAPI 원본 (백엔드가 캐시하면 더 빠름)
```

**Vercel 배포 자체가 이미 글로벌 CDN.** Hobby 플랜에서:

- Image Optimization: 5,000회/월
- Bandwidth: 100GB/월
- 작은~중간 규모 PWA 에 충분

### 저장소가 필요해지는 시점

1. **사용자 업로드 도입** (예: 프로필 사진, 토너먼트 결과 공유 이미지)
2. **빌드 시점 대량 변환** (시즌별 일러스트 100종 등)
3. **Vercel 무료 한도 초과** (월간 활성 사용자 10만+ 부근)

그 시점에 다음 옵션 비교:

| 옵션                    | 무료 한도                 | 적합                    |
| ----------------------- | ------------------------- | ----------------------- |
| **Vercel Blob**         | 1GB / 100K reads (Hobby)  | 가장 간편, Next.js 통합 |
| **Cloudinary**          | 25GB 저장, 25GB bandwidth | 변환 기능 강력          |
| **AWS S3** + CloudFront | 첫 12개월 5GB             | 제어 최대, 학습 곡선    |
| **Cloudflare R2**       | 10GB 저장, egress 무료    | 제일 저렴               |

지금 결정할 필요 없음 — **필요해질 때 비교**.

### 현재 프로젝트 이미지 처리 현황

| 항목                                   | 처리                                   |
| -------------------------------------- | -------------------------------------- |
| PWA 아이콘 (`public/icons/icon-*.png`) | placeholder, 실제 이미지로 교체 필요   |
| SVG sprite (`public/icons.svg`)        | 1년 immutable cache                    |
| TourAPI 이미지                         | next/image + 30일 SW cache             |
| 토너먼트 시즌 일러스트                 | 디자인 후 `public/illustrations/` 추천 |
| 사용자 업로드                          | 사이트맵에 없음 — 도입 시 결정         |
