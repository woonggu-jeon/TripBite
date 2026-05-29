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

### Spacing

- 간격: `var(--space-1)` ~ `var(--space-12)` (4px grid)

### Typography

primitive: `--text-xs/sm/base/lg/xl/2xl/3xl` (크기만)

시멘틱 (선호):

| 용도                    | 토큰                         |
| ----------------------- | ---------------------------- |
| 큰 결과 숫자/디스플레이 | `var(--font-display)` (40px) |
| 페이지/카드 메인 타이틀 | `var(--font-h1)` (24px)      |
| 섹션 헤더               | `var(--font-h2)` (20px)      |
| 카드 헤더               | `var(--font-h3)` (17px)      |
| 본문                    | `var(--font-body)` (16px)    |
| 보조 본문               | `var(--font-body-sm)` (15px) |
| 폼 라벨 / 작은 강조     | `var(--font-label)` (13px)   |
| 메타 정보               | `var(--font-caption)` (12px) |
| 머리 라벨 / chip        | `var(--font-eyebrow)` (11px) |

line-height: `var(--line-tight/snug/normal/relaxed)` (1.2/1.35/1.5/1.65)
letter-spacing: `var(--tracking-tight/snug/normal/wide/uppercase)` (-0.02 / -0.01 / 0 / 0.02 / 0.06em)

## 2. Primitive 컴포넌트

새 카드/칩/아이콘버튼/섹션은 hardcoded SCSS 대신 다음을 사용.

```tsx
import { Card, Chip, IconButton, PageSection } from '@/components/ui';

<PageSection title="이번주 우승 Top 5" hint="투표 기반">
  <Card variant="highlighted" padding="lg">
    <h2>우승</h2>
    <Chip variant="primary" size="sm">#액티비티</Chip>
  </Card>
</PageSection>

<IconButton aria-label="설정" variant="ghost" size="md">
  <Settings size={20} />
</IconButton>
```

### Card 변형

- `surface` (기본) / `soft` / `elevated` / `highlighted`
- `padding`: `none` / `sm` / `md` (default) / `lg`
- `as`: `div` (default) / `section` / `article`

### Chip 변형

- `default` / `primary` / `outline` / `subtle` / `solid`
- `size`: `sm` / `md`, `pill` (기본 true)

### IconButton 변형

- `variant`: `ghost` / `solid` / `outline`
- `size`: `sm` (32) / `md` (40) / `lg` (44)
- `aria-label` 필수

### PageSection

- `title` / `hint` / `action` / `level` (h2/h3)
- 페이지 안 섹션 헤더 + 본문 wrapper.

## 3. 디자인 교체 시나리오

브랜드 색을 핑크(#ec4899) 로 바꾼다면 — `globals.scss` 의 `--color-primary` 한 줄만 수정.
모든 carousel/card/chip/button/progress 가 자동으로 새 색으로 반영됨 (primary-soft, -tint, -border, -ring, -muted 모두 derived).

shadow 강도 조정 시 `--shadow-card-strong` 한 곳. dark/light 분기는 자동.

## 4. 마이그레이션 상태

| 항목                                                                                  | 상태                              |
| ------------------------------------------------------------------------------------- | --------------------------------- |
| Typography 시멘틱 토큰 (`--font-display/h1/h2/h3/body/body-sm/label/caption/eyebrow`) | ✅ 도입                           |
| `font-size: 0.6875/0.75/0.8125/0.9375/1.0625rem` hardcoded → 시멘틱 토큰              | ✅ 일괄 마이그레이션              |
| Primary mix 변형 토큰화 (`--color-primary-ring-soft/glow/text-bold`)                  | ✅ 핵심 변형 추가                 |
| `<PageSection>` primitive                                                             | ✅ 추가 + RankingPageContent 적용 |
| WinnerCard / ProfileCard / TravelTypeResult / TravelTypeShareCard → primitive         | ✅ 1차 마이그레이션               |

## 5. 남은 후속 정비

- 1rem 이상의 폰트 크기들 — 컴포넌트별 의미 다양해서 일괄 변환 보류, 손댈 때 자연스럽게 토큰화
- multi-line 으로 prettier 가 정리한 `color-mix` 들 — sed 단일라인 미매칭. 컴포넌트 마이그레이션 시 인라인 교체
- 남은 hardcoded card/chip (LetterRowCard / Top5Card / NotificationDropdown 등) — primitive 로 점진 교체
- typography `line-height` / `letter-spacing` 도 토큰만 정의됐고, 컴포넌트별 raw 값 잔존
