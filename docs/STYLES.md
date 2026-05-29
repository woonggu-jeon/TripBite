# 디자인 토큰 & Primitive 가이드

퍼블리싱/디자인 교체 시 손대야 할 곳을 최소화하기 위한 규칙. 새 컴포넌트는 이 가이드를 따르고, 기존 컴포넌트는 손댈 때 점진 마이그레이션.

## 1. 토큰 사용 우선순위

색/그림자/모션은 **항상 토큰** 으로 참조. raw 값(hex, rgba, 시간, cubic-bezier) 직접 작성 금지.

### Color

| 용도                        | 토큰                                                        |
| --------------------------- | ----------------------------------------------------------- |
| 화면 배경                   | `var(--color-bg)`                                           |
| 본문 텍스트                 | `var(--color-fg)`                                           |
| 보조 텍스트                 | `var(--color-muted)`                                        |
| 일반 border                 | `var(--color-border)`                                       |
| 강조(primary) 텍스트/링     | `var(--color-primary)`                                      |
| 카드 surface 배경 (8% tint) | `var(--color-primary-soft)`                                 |
| 그라데이션 카드 상단 (10%)  | `var(--color-primary-surface-grad-start)`                   |
| chip/badge 배경 (alpha 12%) | `var(--color-primary-tint)`                                 |
| 강조 카드 border            | `var(--color-primary-border)`                               |
| focus ring / outline        | `var(--color-primary-ring)`                                 |
| secondary 텍스트 (60% mix)  | `var(--color-primary-muted)`                                |
| 정보 박스 / skim 배경       | `var(--color-surface-soft)`                                 |
| 분리선                      | `var(--color-divider)`                                      |
| hover 위 ghost 배경         | `var(--color-hover)`                                        |
| 모달 백드롭                 | `var(--color-overlay)`                                      |
| sticky header glass         | `var(--color-glass)` + `backdrop-filter: var(--blur-glass)` |

### Radius

`--radius-sm/md/lg/xl/full`. 999px / 9999px 직접 작성 금지 — `var(--radius-full)`.

### Shadow

| 용도                                 | 토큰                                     |
| ------------------------------------ | ---------------------------------------- |
| 기본 카드                            | `var(--shadow-card)`                     |
| 강조 카드 (트로피 카드 등)           | `var(--shadow-card-strong)`              |
| 떠오르는 raised (BottomNav 원형 등)  | `var(--shadow-pop)`                      |
| 공유카드/모달 큰 elevation           | `var(--shadow-emphasis)`                 |
| 아이콘 drop-shadow 작은              | `filter: var(--drop-shadow-icon)`        |
| 아이콘 drop-shadow 큰 (trophy/emoji) | `filter: var(--drop-shadow-icon-strong)` |

> dark 모드 자동 대응. `rgba(0,0,0,X)` 컴포넌트별 작성 금지.

### Motion

| 용도                       | 토큰                                     |
| -------------------------- | ---------------------------------------- |
| 미세한 active scale        | `var(--motion-fast)` (100ms)             |
| 일반 hover/border 전환     | `var(--motion-base)` (150ms)             |
| 슬라이드/페이드            | `var(--motion-slow)` (300ms)             |
| 등장 강조 (celebration 등) | `var(--motion-emphasis)` (550ms)         |
| ease                       | `var(--ease-out)` / `var(--ease-spring)` |

예: `transition: border-color var(--motion-base) ease, transform var(--motion-fast) ease;`

### Spacing / Typography

- 간격: `var(--space-1)` ~ `var(--space-12)` (4px grid)
- 폰트 크기: `var(--text-xs)` ~ `var(--text-3xl)` (단, 컴포넌트 고유 크기는 rem 직접 허용)

## 2. Primitive 컴포넌트

새 카드/칩/아이콘버튼은 hardcoded SCSS 대신 다음을 사용.

```tsx
import { Card, Chip, IconButton } from '@/components/ui';

<Card variant="highlighted" padding="lg">
  <h2>우승</h2>
  <Chip variant="primary" size="sm">#액티비티</Chip>
</Card>

<IconButton aria-label="설정" variant="ghost" size="md">
  <Settings size={20} />
</IconButton>
```

### Card 변형

- `surface` (기본) / `soft` / `elevated` / `highlighted`

### Chip 변형

- `default` / `primary` / `outline` / `subtle` / `solid`
- `size`: `sm` / `md`, `pill` (기본 true)

### IconButton 변형

- `variant`: `ghost` / `solid` / `outline`
- `size`: `sm` (32) / `md` (40) / `lg` (44)
- `aria-label` 필수

## 3. 디자인 교체 시나리오

브랜드 색을 핑크(#ec4899) 로 바꾼다면 — `globals.scss` 의 `--color-primary` 한 줄만 수정.
모든 carousel/card/chip/button/progress 가 자동으로 새 색으로 반영됨 (primary-soft, -tint, -border, -ring, -muted 모두 derived).

shadow 강도 조정 시 `--shadow-card-strong` 한 곳. dark/light 분기는 자동.

## 4. 후속 정비 (TODO)

- 기존 컴포넌트의 `font-size: 0.X rem` hardcoded → 의미별 typography 클래스/mixin 도입
- 남은 ad-hoc `color-mix(... primary X%, ...)` 변형(5/14/18/22%) — 의미가 명확한 것만 토큰화
- 자주 쓰이는 페이지 컨테이너(섹션 wrapper) primitive 화 (`<PageSection>`)
- 기존 hardcoded card/chip 패턴을 점진적으로 `<Card>` / `<Chip>` 으로 마이그레이션
