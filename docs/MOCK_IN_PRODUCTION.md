# 운영(production) 에서 mock 데이터 사용

백엔드 미준비 / 데모 / QA 시나리오 재현을 위해 운영 빌드에서도 MSW 를 활성화할 수 있다.

## 1. 활성화

```bash
# .env.production (또는 호스팅 환경 변수)
NEXT_PUBLIC_USE_MSW=true
NEXT_PUBLIC_API_URL=http://placeholder       # 호출 자체가 가로채지므로 무시되나 빈 값 회피용
```

`src/app/providers.tsx` 의 `MSW_ENABLED` 가 NODE_ENV 무관하게 토글만 본다:

```ts
const MSW_ENABLED = process.env.NEXT_PUBLIC_USE_MSW === 'true';
```

빌드 후 첫 로드 시 `/mockServiceWorker.js` 가 등록되고 모든 `/api/backend/*` 요청을 가로챈다.

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

## 4. 권고

운영에 mock 을 띄울 땐 사용자가 실데이터로 오해하지 않도록 화면에 작은 표시 권장:

```tsx
// src/app/providers.tsx 안 children 옆에 조건부 렌더
{
  process.env.NEXT_PUBLIC_USE_MSW === 'true' && <MockModeBanner />;
}
```

`MockModeBanner` 는 미구현 — 필요 시 `Chip` primitive 로 'DEMO' 라벨 띄우는 작은 컴포넌트로 추가.

## 5. 끄기

```bash
unset NEXT_PUBLIC_USE_MSW  # 또는 빈 값
```

→ `MSW_ENABLED=false` 가 되어 worker 등록 자체가 일어나지 않음. 기존에 등록된 worker 는 사용자 브라우저에 남아있을 수 있으므로 prod 토글 OFF 후 캐시 무효화 안내가 필요할 수 있다.
