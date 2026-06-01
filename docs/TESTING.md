# 단위테스트 가이드

vitest + @testing-library/react + MSW 2.x 기반. 실행 / 작성 패턴 / MSW handler 작성 / Generated SDK 테스트.

## 실행

```bash
npm test                # watch 모드
npm run test:run        # 1회 실행 (CI)
npm run test:coverage   # 커버리지 리포트 (threshold 80%)
```

설정:

- `vitest.config.ts` — happy-dom + forks pool + setupFiles + coverage
- `vitest.setup.ts` — jest-dom matcher + MSW server lifecycle (listen/reset/close)
- `src/test-utils.tsx` — `renderWithProviders` / `renderHookWithProviders` / `createRouterMock` / `TestProviders`

## 작성 패턴

### 1. 순수 함수 / schema / store

```ts
import { describe, it, expect } from 'vitest';
import { letterSchema } from './letter';

describe('letterSchema', () => {
  it('5자 이내 ok', () => {
    expect(letterSchema.safeParse({ body: '안녕하세요' }).success).toBe(true);
  });
  it('6자 이상 reject', () => {
    expect(letterSchema.safeParse({ body: '안녕하세요!' }).success).toBe(false);
  });
});
```

### 2. 컴포넌트 — `renderWithProviders`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils';
import { LocationPermissionPrompt } from './LocationPermissionPrompt';

describe('LocationPermissionPrompt', () => {
  it('허용 클릭 시 onAccept 호출', async () => {
    const onAccept = vi.fn();
    renderWithProviders(<LocationPermissionPrompt onAccept={onAccept} />);
    await userEvent.click(screen.getByText('허용하기'));
    expect(onAccept).toHaveBeenCalledOnce();
  });
});
```

### 3. `useRouter()` 사용하는 컴포넌트 — `next/navigation` mock

`vi.mock` 은 호이스팅되므로 **파일 최상단**:

```tsx
import { vi } from 'vitest';
import { createRouterMock } from '@/test-utils';

const router = createRouterMock();
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/letter/compose',
  useSearchParams: () => new URLSearchParams(),
}));

// ... test 안에서
expect(router.push).toHaveBeenCalledWith('/letter/sent');
```

### 4. Hook 단위 — `renderHookWithProviders`

```tsx
import { renderHookWithProviders } from '@/test-utils';
import { act } from '@testing-library/react';

it('useLogin mutate 성공', async () => {
  const { result } = renderHookWithProviders(() => useLogin());
  await act(() => result.current.mutateAsync({ id: 'a', pw: 'b' }));
  expect(result.current.isSuccess).toBe(true);
});
```

### 5. 외부 store 합성 (zustand 등)

`useUIStore` 같은 글로벌 store 는 자동 동작. 특정 초기 상태가 필요하면 `beforeEach` 에서 `useUIStore.setState(...)` 또는 `getState().reset()`.

## MSW handler 패턴

### 위치

- `src/mocks/handlers.ts` — REST handler 정의
- `src/mocks/server.ts` — vitest/node 용
- `src/mocks/browser.ts` — dev/e2e 용
- `src/mocks/seeds/` — 도메인별 fixture (regions / letters / tournament / destinations / notifications)

vitest.setup.ts 가 `onUnhandledRequest: 'error'` 라 handler 누락된 요청은 즉시 테스트 실패.

### swagger 적용 후 — type-safe handler (`openapi-msw`)

```ts
import { createOpenApiHttp } from 'openapi-msw';
import type { paths } from '@/generated/api/types.gen';

const http = createOpenApiHttp<paths>();

export const handlers = [
  // path / response body / query / params 타입 자동 추론
  http.get('/auth/me', ({ response }) =>
    response(200).json({ id: 1, username: 'tester' }),
  ),

  http.post('/letters', async ({ request, response }) => {
    const body = await request.json();
    // body 도 타입 자동 — schema 의 LetterCreateRequest
    return response(201).json({ id: 'l-1', ...body });
  }),
];
```

### 테스트별 handler override

```ts
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

it('401 → refresh → 재시도', async () => {
  server.use(
    http.get('/auth/me', () =>
      HttpResponse.json({ msg: 'expired' }, { status: 401 }),
    ),
    http.post('/auth/refresh', () => HttpResponse.json({ ok: true })),
  );
  // ...
});
```

`afterEach` 에서 `server.resetHandlers()` 자동 — 다른 테스트 영향 X.

### 도메인 로직 보존

자동 mock (faker) 이 도메인 검증 (편지 5글자 / 토너 카테고리 / 위치 좌표 등) 을 무시하지 않도록 — **handler 본문은 수동**. seeds 의 도메인 fixture 재사용:

```ts
import { letterSeeds } from '@/mocks/seeds/letters';

http.get('/letters', ({ response }) => response(200).json({ items: letterSeeds })),
```

## Generated SDK 테스트 (swagger 활성화 후)

generated `useFooQuery` 가 우리 axios 통과 → MSW handler 자동 가로챔. 별도 mock 필요 없음:

```tsx
import { getAuthMeOptions } from '@/generated/api/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { renderHookWithProviders } from '@/test-utils';
import { waitFor } from '@testing-library/react';

it('useQuery 응답', async () => {
  const { result } = renderHookWithProviders(() =>
    useQuery(getAuthMeOptions()),
  );
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.username).toBe('tester'); // handler 의 응답
});
```

## Coverage 정책

`vitest.config.ts` 의 `coverage.include` 가 측정 대상 파일을 명시 — 신규 핵심 로직 추가 시 패턴 확장:

```ts
include: [
  'src/features/**/schemas/**',
  'src/features/**/hooks/**', // ← swagger 활성화 후 추가
  'src/lib/**',
  'src/hooks/**',
  // ...
];
```

임계치: statements/branches/functions/lines 80% (branches 75). 미달 시 CI 실패.

## E2E 와 분리

Playwright (`e2e/**`) 는 vitest `exclude` — vitest 가 안 잡음. `.github/workflows/e2e.yml` 에서 별도 실행.

## 추후 — Lighthouse a11y/SEO 이슈 (별도 처리 필요)

테스트 인프라와 별개 — 실제 페이지 lint:

- `[user-scalable=no]` 또는 `[maximum-scale]<5` — `layout.tsx` 의 viewport export 수정 (userScalable: true, maximumScale: 5)
- Prohibited ARIA attributes — 검증 후 잘못된 aria-\* 제거 (어디서 lighthouse 가 잡았는지 정확한 element 필요)
- Page blocked from indexing — `NEXT_PUBLIC_USE_MSW=true` (mock 모드) 의 robots noindex. 실 운영 환경에서 끄면 해결
- 메타 description 누락 — `layout.tsx` 의 `generateMetadata` 에 `description` 명시

## 안티 패턴 — 피할 것

- ❌ `act()` 안에 `setState` 비동기 처리 없이 직접 호출 (warning)
- ❌ `screen.getByText` 의 정확한 한국어 텍스트 일치 — i18n 변경에 깨짐. `getByRole` / `data-testid` 권장
- ❌ MSW handler 누락 — `onUnhandledRequest: 'error'` 가 모든 누락 fail. 새 endpoint 호출 시 handler 등록
- ❌ 테스트 안 `vi.useFakeTimers` 사용 후 미해제 — 다른 테스트 영향. `afterEach(() => vi.useRealTimers())` 필수
