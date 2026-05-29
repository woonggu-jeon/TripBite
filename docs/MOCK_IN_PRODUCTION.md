# 운영(production) 에서 mock 데이터 사용

백엔드 미준비 / 데모 / QA 시나리오 재현을 위해 운영 빌드에서도 MSW 를 활성화할 수 있다.

## 1. Vercel 활성화 (가장 흔한 시나리오)

1. Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables**
2. 다음 변수 추가 (Production / Preview / Development 모두 선택):

   | Key                   | Value                | 설명                                                                |
   | --------------------- | -------------------- | ------------------------------------------------------------------- |
   | `NEXT_PUBLIC_USE_MSW` | `true`               | mock 활성 토글 — **반드시 'true' 문자열**                           |
   | `NEXT_PUBLIC_API_URL` | `http://placeholder` | rewrite 분기용 placeholder (MSW SW 가 가로채므로 실제 호출은 안 감) |

3. **Redeploy** — Deployments 탭 → 최신 deployment → ⋯ → "Redeploy" (Use existing Build Cache 해제 권장).

4. 첫 로드 후 우상단에 **DEMO** chip 노출 + 모든 `/me` 등 API 가 mock 응답을 반환.

> `NEXT_PUBLIC_*` 은 **빌드 시점에 inline** 됨. env 추가 후 반드시 재빌드해야 적용된다.

## 2. 로컬 / .env

```bash
# .env.local (또는 .env.production.local)
NEXT_PUBLIC_USE_MSW=true
NEXT_PUBLIC_API_URL=http://localhost:8080    # rewrite proxy 대상 — 실제 호출 안 감
```

`src/app/providers.tsx` 의 `MSW_ENABLED` 가 NODE_ENV 무관하게 토글만 본다:

```ts
const MSW_ENABLED = process.env.NEXT_PUBLIC_USE_MSW === 'true';
```

첫 로드 시 `/mockServiceWorker.js` 가 등록되고 모든 `/api/backend/*` 요청을 가로챈다.

## 2. 라우팅

axios `baseURL` 이 `/api/backend` 로 자동 분기 (`src/services/api/client.ts`).
`next.config.js` 의 rewrites 가 `/api/backend/:path*` 를 실 백엔드로 proxy 하도록 둘 수 있으나, MSW 가 service worker scope 에서 먼저 가로채므로 실제로 백엔드로 가지 않는다.

## 3. 한계 & 주의

- **번들 사이즈**: MSW + seeds 가 메인 청크에 포함 (~80KB gz). 첫 페이지 LCP 영향 가능. 데모 한정 권장.
- **데이터 휘발성**: mock 의 mutable 상태(`onboardedState`, `myTravelType` 등)는 service worker 재기동 시 초기화. 사용자별/세션별 영속 불가.
- **랜덤성**: `Math.random()` 기반 셔플 — 같은 페이지 새로고침 시 결과 달라짐 (deterministic mock 이 필요하면 hash 기반으로 교체).
- **Service worker 충돌**: Serwist 의 `/sw.js` (PWA precache) 와 별도 파일이지만 같은 origin 의 fetch 를 두 sw 가 처리하지 않도록 MSW prefix(`/api/backend`)와 Serwist precache 영역이 겹치지 않게 유지.
- **인증/세션**: mock 은 `mockUser` 단일. 실 사용자 흐름 검증엔 부적합.
- **SEO / cache**: 정적 페이지(static export)는 빌드 시점에 fetch 안 함 → mock 데이터 미반영. 첫 hydration 후에야 mock 응답이 보인다.

## 4. 시각적 표시

운영에 mock 을 띄울 때 사용자가 실데이터로 오해하지 않도록 우상단에 **DEMO** chip 자동 표시 (`MockModeBanner`).
`providers.tsx` 에서 `MSW_ENABLED` 시 조건부 렌더되어 추가 설정 불필요.

## 5. 트러블슈팅 — `/me 404` / 모든 API 404

Vercel 배포 직후 `/me` `/letters/...` 등 모든 API 가 404 라면 다음 순서로 확인:

### 5-1. env 가 실제 빌드에 inline 됐는지

브라우저 콘솔에서 페이지 새로고침 후 다음 한 줄을 확인:

```
[boot] MSW_ENABLED=true NEXT_PUBLIC_USE_MSW="true" NEXT_PUBLIC_API_URL="http://placeholder"
```

- `MSW_ENABLED=false` 또는 `NEXT_PUBLIC_USE_MSW=undefined` → env 가 빌드에 안 들어감. **재빌드 필요**.
- `MSW_ENABLED=true` 인데도 API 가 404 라면 5-2 / 5-4 항목으로.

> 콘솔에서 `process.env.NEXT_PUBLIC_USE_MSW` 직접 입력은 `ReferenceError: process is not defined` 가 정상 — Next.js 가 `NEXT_PUBLIC_*` 을 **빌드 시점에 리터럴로 치환**하므로 런타임에 `process` 객체가 없다. `[boot]` 로그가 빌드에 박힌 실제 값.

### 5-2. service worker 가 등록됐는지

브라우저 devtools → **Application** → **Service Workers** 패널.
`mockServiceWorker.js` 가 activated 상태여야 함.

등록 안 됐으면 콘솔에 `[mock] MSW worker 등록 실패` 경고가 떠 있을 것.

### 5-3. 우상단 DEMO chip 노출 여부

뜨면 `MSW_ENABLED=true` 가 빌드에 들어간 것. chip 안 보이면 env 누락.

### 5-4. 흔한 원인

| 증상                             | 원인                                                                           | 해결                                                         |
| -------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| 모든 API 404 + DEMO chip 안 보임 | `NEXT_PUBLIC_USE_MSW` 미설정                                                   | Vercel env 추가 후 redeploy                                  |
| DEMO chip 보이지만 API 504/502   | rewrite 가 실 백엔드(`NEXT_PUBLIC_API_URL`)로 proxy 시도 — SW 등록 실패한 상태 | hard refresh (Ctrl+Shift+R) 또는 SW 수동 unregister → 재방문 |
| dev 는 되는데 prod 만 404        | NODE_ENV 분기 잔존 코드 (구버전)                                               | `providers.tsx` 의 `MSW_ENABLED` 가 토글만 보는지 확인       |
| Safari/iOS PWA 만 안 됨          | service worker scope/permission                                                | "홈에 추가" 전 일반 Safari 탭에서 1회 방문해 SW 등록 트리거  |

## 6. 끄기

Vercel: env vars 에서 `NEXT_PUBLIC_USE_MSW` 삭제 또는 `false` 로 변경 → redeploy.

```bash
# 로컬
unset NEXT_PUBLIC_USE_MSW  # 또는 빈 값
```

> 이미 등록된 service worker 는 브라우저에 남아있을 수 있음 — 사용자가 hard refresh / cache clear 또는 devtools 에서 unregister 필요.

→ `MSW_ENABLED=false` 가 되어 worker 등록 자체가 일어나지 않음. 기존에 등록된 worker 는 사용자 브라우저에 남아있을 수 있으므로 prod 토글 OFF 후 캐시 무효화 안내가 필요할 수 있다.
