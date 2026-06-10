# Storybook 카탈로그

`@storybook/nextjs-vite` 기반 컴포넌트 카탈로그. 정식 도입 후 기존 `/dev/components` ad-hoc 카탈로그는 제거 (커밋 `3626f2a`).

## 실행

```bash
npm run storybook         # dev 서버 — http://localhost:6006
npm run build-storybook   # static build → storybook-static/
```

CI (`ci.yml`) 가 PR / dev push 마다 `build-storybook` 통과를 게이트.

## 구성

- **Framework**: `@storybook/nextjs-vite` v10
- **Addons**: a11y / docs / chromatic-com (visual review 옵션, publish 는 미사용)
- **Provider decorator** (`.storybook/preview.tsx`):
  - `NextIntlClientProvider` — ko/en 메시지 자동 로드 + toolbar globals.locale 토글
  - `QueryClientProvider` — `retry:false / staleTime:Infinity`
  - `globals.scss` — 토큰 자동 적용
  - `data-theme` 토글 (light/dark) — toolbar globals.theme

## 등록된 컴포넌트 (18)

| 카테고리         | 컴포넌트                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **UI** (12)      | Button / Card / Chip / IconButton / PageSection / TextField / MediaThumb / RadioGroup / Dialog / Tabs / DestinationCard / ButtonGrid |
| **Feedback** (4) | EmptyState / Skeleton / Toaster / ConfirmDialog                                                                                      |
| **Forms** (1)    | Toggle                                                                                                                               |
| **Icon** (1)     | Icon (sprite-based)                                                                                                                  |

Story 파일은 컴포넌트와 co-located: `src/components/<group>/<Name>.stories.tsx`.

## 새 Story 추가

```tsx
// src/components/ui/MyNew.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MyNew } from './MyNew';

const meta = {
  title: 'UI/MyNew',
  component: MyNew,
  tags: ['autodocs'],
  args: {
    /* 기본 props */
  },
} satisfies Meta<typeof MyNew>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
```

children/render 만 쓰는 경우 `satisfies` 가 `args` 를 강제하므로 `const meta: Meta<typeof X> = {...}` 형태 사용.

## Vitest 와의 관계

`@storybook/addon-vitest` 는 의도적으로 제거. story 검증은:

1. **build-storybook** — 빌드 통과 게이트 (CI)
2. **Playwright e2e (`toHaveScreenshot`)** — 컴포넌트 시각 회귀
3. **Vitest 단위 테스트 (177 case)** — 컴포넌트 동작 검증

→ Story-as-test 는 중복. `vitest.config.ts` 의 `exclude` 에 `**/*.stories.*` 명시.

## 후속 (선택)

- Chromatic publish 도입 시 `npm run chromatic` script + token secret 추가
- 도메인 컴포넌트 (HomeDashboard / MatchupCard 등) story — feature mock dependency 가 복잡해 후순위
