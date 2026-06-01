# 디자인 토큰 & Primitive 가이드

퍼블리싱/디자인 교체 시 손대야 할 곳을 최소화하기 위한 규칙. 새 컴포넌트는 이 가이드를 따르고, 기존 컴포넌트는 손댈 때 점진 마이그레이션.

## 1. 토큰 사용 우선순위

색/그림자/모션은 **항상 토큰** 으로 참조. raw 값(hex, rgba, 시간, cubic-bezier) 직접 작성 금지.

### Color

| 용도                        | 토큰                                                                    |
| --------------------------- | ----------------------------------------------------------------------- |
| 화면 배경                   | `var(--color-bg)`                                                       |
| 본문 텍스트                 | `var(--color-fg)`                                                       |
| 보조 텍스트                 | `var(--color-muted)`                                                    |
| 일반 border                 | `var(--color-border)`                                                   |
| 강조(primary) 텍스트/링     | `var(--color-primary)`                                                  |
| 카드 surface 배경 (8% tint) | `var(--color-primary-soft)`                                             |
| 그라데이션 카드 상단 (10%)  | `var(--color-primary-surface-grad-start)`                               |
| chip/badge 배경 (alpha 12%) | `var(--color-primary-tint)`                                             |
| 강조 카드 border            | `var(--color-primary-border)`                                           |
| focus ring / outline        | `var(--color-primary-ring)`                                             |
| secondary 텍스트 (60% mix)  | `var(--color-primary-muted)`                                            |
| 정보 박스 / skim 배경       | `var(--color-surface-soft)`                                             |
| 분리선                      | `var(--color-divider)`                                                  |
| hover 위 ghost 배경         | `var(--color-hover)`                                                    |
| 모달 백드롭                 | `var(--color-overlay)`                                                  |
| sticky header glass         | `var(--color-glass)` + `backdrop-filter: var(--blur-glass)`             |
| 편지 accent (amber)         | `var(--color-letter-accent)` (light/dark 분기)                          |
| 편지 종이 배경              | `var(--color-letter-paper)` (light/dark 분기)                           |
| 편지 종이 cream tint        | `var(--color-letter-cream)` (gradient base용, 분기)                     |
| colored bg 위 흰 텍스트     | `var(--color-on-strong)` (success/danger/banner badge 등)               |
| 추천 시즌별 accent (5종)    | `var(--accent-spring/summer/autumn/winter/festival)` (+ grad-start/end) |
| 축제 카테고리 색 (5종)      | `var(--accent-red/amber/green/blue/violet)`                             |
| 차트 시리즈 (1~8)           | `var(--chart-1)` ~ `var(--chart-8)`                                     |

### Radius

`--radius-sm/md/lg/xl/full`. 999px / 9999px 직접 작성 금지 — `var(--radius-full)`.

### Shadow

| 용도                                  | 토큰                                     |
| ------------------------------------- | ---------------------------------------- |
| 기본 카드                             | `var(--shadow-card)`                     |
| 강조 카드 (트로피 카드 등)            | `var(--shadow-card-strong)`              |
| 떠오르는 raised (BottomNav 원형 등)   | `var(--shadow-pop)`                      |
| 공유카드/모달 큰 elevation            | `var(--shadow-emphasis)`                 |
| 아이콘 drop-shadow 작은               | `filter: var(--drop-shadow-icon)`        |
| 아이콘 drop-shadow 큰 (trophy/emoji)  | `filter: var(--drop-shadow-icon-strong)` |
| 일반 drop-shadow 작은                 | `filter: var(--drop-shadow-sm)`          |
| 일반 drop-shadow 중간 (emoji 카드 등) | `filter: var(--drop-shadow-md)`          |
| text-shadow (흰 글자 가독성 보강)     | `text-shadow: var(--text-shadow-soft)`   |

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

| 용도                      | 토큰                                 |
| ------------------------- | ------------------------------------ |
| 큰 결과 숫자/디스플레이   | `var(--font-display)` (40px)         |
| 페이지/카드 메인 타이틀   | `var(--font-h1)` (24px)              |
| 섹션 헤더                 | `var(--font-h2)` (20px)              |
| 카드 헤더                 | `var(--font-h3)` (17px)              |
| 본문                      | `var(--font-body)` (16px)            |
| 보조 본문                 | `var(--font-body-sm)` (15px)         |
| 폼 라벨 / 작은 강조       | `var(--font-label)` (13px)           |
| 메타 정보                 | `var(--font-caption)` (12px)         |
| 머리 라벨 / chip          | `var(--font-eyebrow)` (11px)         |
| 편지 본문 (5글자 큰 글씨) | `var(--font-letter-body)` (26px)     |
| 우표 라벨                 | `var(--font-letter-stamp-tag)` (8px) |

### Emoji 스케일

| 용도                        | 토큰                      |
| --------------------------- | ------------------------- |
| 추천 카드 내 emoji          | `var(--emoji-sm)` (22px)  |
| 일반 emoji 아이콘           | `var(--emoji-md)` (28px)  |
| 선택 카드 emoji             | `var(--emoji-lg)` (36px)  |
| hero 카드 emoji (결과 화면) | `var(--emoji-xl)` (64px)  |
| finishing / 공유 카드 emoji | `var(--emoji-2xl)` (72px) |
| celebration emoji (트로피)  | `var(--emoji-3xl)` (80px) |
| hero illustration glyph     | `var(--emoji-4xl)` (96px) |

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

#### Link 같은 polymorphic 미지원 컴포넌트에 적용

`Card` 가 `as` 로 `next/link` 같은 컴포넌트의 `href` 까지 받기 어려우므로 `cardClasses` 헬퍼 사용:

```tsx
import { cardClasses } from '@/components/ui';

<Link
  href={...}
  className={cardClasses({
    variant: 'surface',
    padding: 'none',
    className: styles.cardLayout,
  })}
>
  ...
</Link>
```

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

### Layout primitives (page wrapper)

- `AuthLayout` — 인증 페이지 6곳(login/signup/find-id/forgot-password/reset-password/onboarding) 의 공통 main wrapper. `variant`: `center`(default) / `column`(onboarding). 모바일 padding 반응형 내장.
- `PolicyArticle` + `PolicySection` + `PolicyFooter` — terms/privacy/licenses 의 article + 섹션 + footer 패턴.

```tsx
<AuthLayout><LoginForm /></AuthLayout>
<AuthLayout variant="column"><OnboardingFlow /></AuthLayout>

<PolicyArticle>
  <PolicySection heading="제1조">...</PolicySection>
  <PolicyFooter>시행일자: ...</PolicyFooter>
</PolicyArticle>
```

### Button 변형

- `variant`: `primary` (채움 / submit) / `secondary` (border) / `ghost` / `danger`
- `size`: `sm` (32) / `md` (44, default — 모바일 hit target) / `lg` (52)
- `fullWidth`: 부모 너비 100%
- `loading`: aria-busy + disabled (텍스트는 호출부가 변경)
- `leadingIcon` / `trailingIcon`: 좌우 아이콘 슬롯

```tsx
<Button variant="primary" fullWidth onClick={save} loading={isSaving}>저장</Button>
<Button variant="secondary" leadingIcon={<RotateCcw size={16} />}>다시</Button>
```

## 3. 디자인 교체 시나리오

브랜드 색을 핑크(#ec4899) 로 바꾼다면 — `globals.scss` 의 `--color-primary` 한 줄만 수정.
모든 carousel/card/chip/button/progress 가 자동으로 새 색으로 반영됨 (primary-soft, -tint, -border, -ring, -muted 모두 derived).

shadow 강도 조정 시 `--shadow-card-strong` 한 곳. dark/light 분기는 자동.

## 4. 마이그레이션 상태

| 항목                                                                                  | 상태 |
| ------------------------------------------------------------------------------------- | ---- |
| Typography 시멘틱 토큰 (`--font-display/h1/h2/h3/body/body-sm/label/caption/eyebrow`) | ✅   |
| `font-size: 0.6875/0.75/0.8125/0.875/0.9375/1/1.0625/1.125/1.25/1.5/2.5 rem` → 시멘틱 | ✅   |
| Primary mix 변형 토큰화 (`--color-primary-fade/ring-soft/glow/text-bold`)             | ✅   |
| fg alpha 토큰 (`--color-hover-soft`, `--color-divider`, `--color-overlay`)            | ✅   |
| multi-line `color-mix` perl 일괄 토큰화 (15+ 컴포넌트)                                | ✅   |
| `<PageSection>` primitive + RankingPageContent 적용                                   | ✅   |
| Card 마이그레이션: WinnerCard / ProfileCard / TravelTypeResult / Share / Top5Card     | ✅   |
| Chip 마이그레이션: WinnerCard / Profile / Result / Share keywords·code                | ✅   |
| IconButton 마이그레이션: Profile camera / Share back                                  | ✅   |
| LetterRowCard / NotificationDropdown 토큰화                                           | ✅   |
| `cardClasses` 헬퍼 + LetterRowCard Link 에 Card 스타일 적용                           | ✅   |
| `letter-spacing` 일괄 토큰화 (-0.01/-0.02/0.02/0.06em → tracking-\*)                  | ✅   |
| `line-height` 일괄 토큰화 (1.2/1.3/1.4/1.5 → line-\*)                                 | ✅   |
| Emoji 스케일 토큰 + 컴포넌트별 1.375/1.75/2.25/4/4.5rem 매핑                          | ✅   |
| 색 변형 추가 (`--color-primary-tint-strong/dimmed`) + 3/5/6/14/20/50/80% 통합 매핑    | ✅   |
| Button primitive 광역 마이그레이션 (Tournament setup/play, Quiz, Confirm, Letter 등)  | ✅   |
| Card `cardClasses` `padding` option 미명시 시 `.p-*` 클래스 미부여 (충돌 회피)        | ✅   |
| Card primitive base `.card` → `.root` rename + `:where(.root)` specificity 0          | ✅   |
| Auth 6 페이지 → `AuthLayout` primitive 적용 (변형: center/column)                     | ✅   |
| Policy 3 페이지 → `PolicyArticle` / `PolicySection` / `PolicyFooter` 적용             | ✅   |
| Letter 도메인 amber hex → `--color-letter-accent` / `--color-letter-paper` 토큰화     | ✅   |
| MyPage / Region inline → SCSS module 분리                                             | ✅   |
| `border-radius: 9999px` → `var(--radius-full)` 통일 (3곳)                             | ✅   |
| 중복 Section 컴포넌트 (MyPage / Settings) → `PageSection` primitive 통합              | ✅   |
| ESLint warning 0 (ConfirmDialog 의 dialog backdrop 패턴 명시 disable)                 | ✅   |
| dark mode 누락 sweep — 의도된 hex 외 누락 없음                                        | ✅   |
| `FestivalCarousel` 의 `0.625rem` → `--font-eyebrow` 흡수                              | ✅   |
| `#fff8e7` → `--color-letter-cream` 토큰화 + light/dark 분기                           | ✅   |
| dead CSS 정리 (LetterCompose/Sent/Detail 의 .primary/.secondary/.error)               | ✅   |
| accessibility (aria/alt/label) sweep — 누락 없음                                      | ✅   |
| `scripts/dead-css.mjs` dead CSS 검출기 추가 (CI 통합 가능)                            | ✅   |
| `--color-on-strong` 신설 + #fff badge text 5곳 토큰화                                 | ✅   |
| `--accent-{season}` × 5 + grad-start/end × 5 (RecommendationBanner)                   | ✅   |
| `--accent-{color}` × 5 (FestivalCarousel red/amber/green/blue/violet)                 | ✅   |
| `--drop-shadow-sm/-md` + `--text-shadow-soft` 신설 + 4곳 토큰화                       | ✅   |
| `--chart-1` ~ `--chart-8` + colors.ts 갱신 (recharts 팔레트 토큰화)                   | ✅   |
| `--emoji-3xl/-4xl` 신설 + 5rem/6rem 흡수 (celebration/illustration)                   | ✅   |
| `--font-letter-body/-stamp-tag` 도메인 토큰 + 1.625rem/0.5rem 흡수 (3곳)              | ✅   |
| box-shadow rgba 4곳 → 기존 shadow 토큰 흡수 (sm/md/pop)                               | ✅   |
| raw transition 2곳 → motion-base/motion-emphasis 토큰 흡수                            | ✅   |

## 5. 남은 후속 정비 (점진)

토큰화 광역 sweep 완료 후 잔존 — 시각 변경 위험이 있어 보존, 디자인 시스템 결정 후 점진 조정.

- **컴포넌트 단발성 중간 글씨 (3건)** — ComposeEntryCard `3.5rem` (봉투 emoji), WinnerCard `2rem` (trophy emoji) + `2.75rem` (winner emoji). 기존 emoji-lg(36)/-xl(64) 와 4~12px 차이로 흡수 시 시각 변경. 컴포넌트 unique 의도값.
- **두 번째 인자가 외부 hex / border 인 color-mix** — 디자인 시스템 색 스케일 결정 후 토큰화.
- **컴포넌트별 line-height** (1.1 / 1.25 / 1.55) — 의도된 미세값.
- **letter-spacing** (0.05 / 0.1 / 0.12 / 0.25 / 1em / -0.04em) — 강조 / 일러스트성 일회 사용.
- **남은 drop-shadow rgba** — ChungbukMap 다른 사이즈 (0 2px 3px / 0 4px 6px), FallingPetals 의 blue rgba, LuckyLadder `--color-primary-ring` 사용 등 — 컴포넌트 unique 의도값.
