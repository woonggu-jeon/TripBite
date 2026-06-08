# 디자인 토큰 & Primitive 가이드

퍼블리싱/디자인 교체 시 손대야 할 곳을 최소화하기 위한 규칙. 새 컴포넌트는 이 가이드를 따르고, 기존 컴포넌트는 손댈 때 점진 마이그레이션.

## 파일 구조

```
src/app/
├── globals.scss              ← 얇은 entry (@use 만)
└── styles/
    ├── tokens/
    │   ├── _color.scss       base color + primary scale + surface + glass + letter color + on-strong
    │   ├── _typography.scss  font-size + 시멘틱 + 도메인 + line + tracking + weight + emoji
    │   ├── _layout.scss      spacing + content + header-h + bottom-nav-h + aspect + z-index + icon
    │   ├── _shadow.scss      box + drop + text shadow
    │   ├── _motion.scss      duration + ease
    │   └── _misc.scss        radius + opacity + border-width
    ├── _accents.scss         시즌별 + 카테고리 accent
    ├── _chart.scss           chart series 1~8
    ├── _dark.scss            dark mode override
    ├── _responsive.scss      mobile viewport @media 토큰 축소
    ├── _fonts.scss           Pretendard fallback @font-face
    ├── _reset.scss           html/body/img/button/a + safe-area
    └── _mixins.scss          @mixin (respond-to / text-truncate / focus-ring / visually-hidden / settings-row / banner-action / banner-close)
```

새 토큰 추가 시 해당 카테고리 파일만 수정. 새 mixin 은 `_mixins.scss`.

## 1. 토큰 사용 우선순위

색/그림자/모션은 **항상 토큰** 으로 참조. raw 값(hex, rgba, 시간, cubic-bezier) 직접 작성 금지.

### Color

| 용도                        | 토큰                                                                                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 화면 배경                   | `var(--color-bg)`                                                                                                                                         |
| 본문 텍스트                 | `var(--color-fg)`                                                                                                                                         |
| 보조 텍스트                 | `var(--color-muted)`                                                                                                                                      |
| 일반 border                 | `var(--color-border)`                                                                                                                                     |
| 강조(primary) 텍스트/링     | `var(--color-primary)`                                                                                                                                    |
| 카드 surface 배경 (8% tint) | `var(--color-primary-soft)`                                                                                                                               |
| 그라데이션 카드 상단 (10%)  | `var(--color-primary-surface-grad-start)`                                                                                                                 |
| chip/badge 배경 (alpha 12%) | `var(--color-primary-tint)`                                                                                                                               |
| 강조 카드 border            | `var(--color-primary-border)`                                                                                                                             |
| focus ring / outline        | `var(--color-primary-ring)`                                                                                                                               |
| secondary 텍스트 (60% mix)  | `var(--color-primary-muted)`                                                                                                                              |
| 정보 박스 / skim 배경       | `var(--color-surface-soft)`                                                                                                                               |
| 분리선                      | `var(--color-divider)`                                                                                                                                    |
| hover 위 ghost 배경         | `var(--color-hover)`                                                                                                                                      |
| 모달 백드롭                 | `var(--color-overlay)`                                                                                                                                    |
| sticky header glass         | `var(--color-glass)` + `backdrop-filter: var(--blur-glass)`                                                                                               |
| 편지 accent (amber)         | `var(--color-letter-accent)` (light/dark 분기)                                                                                                            |
| 편지 종이 배경              | `var(--color-letter-paper)` (light/dark 분기)                                                                                                             |
| 편지 종이 cream tint        | `var(--color-letter-cream)` (gradient base용, 분기)                                                                                                       |
| colored bg 위 흰 텍스트     | `var(--color-on-strong)` (success/danger/banner badge 등)                                                                                                 |
| 추천 시즌별 accent (5종)    | `var(--accent-spring/summer/autumn/winter/festival)` (+ grad-start/end). 베이스 톤은 흰 배경 WCAG AA 4.5:1+ 보장. grad-start/-end 는 배경 그라데이션 전용 |
| 축제 카테고리 색 (5종)      | `var(--accent-red/amber/green/blue/violet)` — 텍스트로도 안전한 darker 톤 (4.5:1+)                                                                        |
| 차트 시리즈 (1~8)           | `var(--chart-1)` ~ `var(--chart-8)`                                                                                                                       |

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
| 일반 drop-shadow 매우 작은            | `filter: var(--drop-shadow-xs)`          |
| 일반 drop-shadow 작은                 | `filter: var(--drop-shadow-sm)`          |
| 일반 drop-shadow 중간 (emoji 카드 등) | `filter: var(--drop-shadow-md)`          |
| 일반 drop-shadow 큰 (지도 hover 등)   | `filter: var(--drop-shadow-lg)`          |
| 꽃잎 등 도메인 색 drop-shadow         | `filter: var(--drop-shadow-petal)`       |
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

### Fluid 반응형 — `clamp()` 우선 정책 (2026-06-08~)

**단계별 `@media (max-width: 480/380)` 대신 `clamp(min, preferred, max)` 사용**.

이유:

- 단계 사이 viewport (예: 400px) 에서 step 어색
- 480 / 380 사이 320~480 viewport 의 자연스러운 비율 부재
- `clamp()` 한 줄로 320~desktop 부드럽게 cover

표준 패턴:

```scss
// width / max-width
.banner {
  width: min(92%, 580px); // viewport 의 92% 또는 580px cap
}

// 단계별 size (padding/gap/icon/font 등)
.card {
  padding: clamp(0.875rem, 3vw, 1.25rem); // 320: 0.875 ~ 580+: 1.25
  gap: clamp(0.5rem, 2vw, 0.75rem);
}

// grid 컬럼 폭
.split {
  grid-template-columns: clamp(80px, 22%, 140px) 1fr;
}

// font-size — 시멘틱 토큰 안에서 fluid
.title {
  font-size: clamp(var(--font-h2), 5.5vw, var(--font-h1));
}

// emoji
.emoji {
  font-size: clamp(var(--emoji-md), 8vw, var(--emoji-lg));
}
```

**vw 권장 비율** (320~580 매핑):

- 작은 항목 (icon/gap): `1~3vw`
- 중간 (padding/grid col): `3~6vw`
- 큰 (emoji/font display): `8~14vw`

**`clamp()` 가 어울리는 곳**:

- 같은 component 가 viewport 따라 부드럽게 변하는 경우 (padding/gap/font/icon)
- max 와 min 사이 자연 비율 유지 가능

**여전히 `@media` step 유지** (의도된 다른 비율):

- `aspect-ratio` 자체가 viewport 별 다름 (예: DestinationCard square→wide→narrow)
- 항목 개수 변경 (예: 그리드 3열→2열)
- visibility (hide/show)

적용 컴포넌트 (9종, 2026-06-08):

- RecommendationBanner / LatestReceivedLetter / RegionHero / ConceptIllustration
- AuthLayout / DestinationCard / SeasonalCenterIllustration / ThemeKindSelector
- DestinationDetailClient / HomeDashboard

### Typography

primitive: `--text-xs/sm/base/lg/xl/2xl/3xl` (크기만)

시멘틱 (선호):

| 용도                      | 토큰                                   |
| ------------------------- | -------------------------------------- |
| 큰 결과 숫자/디스플레이   | `var(--font-display)` (40px)           |
| 페이지/카드 메인 타이틀   | `var(--font-h1)` (24px)                |
| 섹션 헤더                 | `var(--font-h2)` (20px)                |
| 카드 헤더                 | `var(--font-h3)` (17px)                |
| 본문                      | `var(--font-body)` (16px)              |
| 보조 본문                 | `var(--font-body-sm)` (15px)           |
| 폼 라벨 / 작은 강조       | `var(--font-label)` (13px)             |
| 메타 정보                 | `var(--font-caption)` (12px)           |
| 머리 라벨 / chip          | `var(--font-eyebrow)` (11px)           |
| 편지 본문 (5글자 큰 글씨) | `var(--font-letter-body)` (26px)       |
| 우표 라벨                 | `var(--font-letter-stamp-tag)` (8px)   |
| 편지 봉투 emoji           | `var(--font-letter-envelope)` (56px)   |
| 토너 트로피 emoji         | `var(--font-tournament-trophy)` (32px) |
| 토너 winner emoji         | `var(--font-tournament-winner)` (44px) |

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

line-height: `var(--line-display/tight/snug/normal/relaxed)` (1.1/1.2/1.35/1.5/1.65)
letter-spacing: `var(--tracking-tight/snug/normal/wide/uppercase/emphasis/pin/pin-fill)` (-0.02 / -0.01 / 0 / 0.02 / 0.06 / 0.12 / 0.25 / 1em)
font-weight: `var(--font-weight-normal/medium/semibold/bold/extrabold)` (400/500/600/700/800)

### Aspect Ratio

| 용도                         | 토큰                                |
| ---------------------------- | ----------------------------------- |
| 정사각형 (festival/share 등) | `var(--aspect-square)` (1/1)        |
| PIN cell                     | `var(--aspect-pin-cell)` (1/1.1)    |
| 카드 narrow (≤380 / season)  | `var(--aspect-card-narrow)` (1.4/1) |
| 카드 wide (festival ≤480)    | `var(--aspect-card-wide)` (1.5/1)   |
| 지도 placeholder             | `var(--aspect-map)` (4/3)           |

### Opacity (명확한 의미만 토큰화 — 컴포넌트 unique 미세 조정은 raw 유지)

| 용도                             | 토큰                              |
| -------------------------------- | --------------------------------- |
| disabled / loading               | `var(--opacity-disabled)` (0.45)  |
| secondary text / muted 보조      | `var(--opacity-muted)` (0.7)      |
| hover 미세 dim (banner / button) | `var(--opacity-hover-dim)` (0.92) |

### Border Width

| 용도             | 토큰                         |
| ---------------- | ---------------------------- |
| 카드 기본 border | `var(--border-thin)` (1px)   |
| 강조 카드 border | `var(--border-base)` (1.5px) |
| 우표 / PIN cell  | `var(--border-thick)` (2px)  |

## 2. Primitive 컴포넌트

새 카드/칩/아이콘버튼/섹션/폼 입력/라디오/이미지는 hardcoded SCSS 대신 다음을 사용.

```tsx
import {
  Card,
  Chip,
  IconButton,
  PageSection,
  TextField,
  MediaThumb,
  RadioGroup,
  RadioOption,
} from '@/components/ui';

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
- `size`: `xs` (10px, NEW/HOT 류 inline 배지) / `sm` / `md`, `pill` (기본 true)
- `aria-label`: optional — 의미 라벨 (스크린리더용)

### IconButton 변형

- `variant`: `ghost` / `solid` / `outline`
- `size`: `sm` (32) / `md` (40) / `lg` (44)
- `aria-label` 필수

### PageSection

- `title` / `hint` / `action` / `level` (h2/h3)
- 페이지 안 섹션 헤더 + 본문 wrapper.

### DestinationCard — 여행지 카드 통일

FestivalCarousel / RelatedDestinations / SavedTournaments tile 이 모두 동일 카드 사용.

```tsx
import { DestinationCard } from '@/components/ui';
import { toneFor } from '@/constants/region-tone';
import { categoryEmoji } from '@/constants/emoji-map';

<DestinationCard
  href={{ pathname: `/destination/${d.id}` }}
  emoji={categoryEmoji(d.category)}
  tone={toneFor(d.region)} // red / amber / green / blue / violet
  regionLabel={regionKo}
  name={d.name}
  caption="10/14 — 10/16" // 옵션 — 축제 기간 등
  accentDot={luckyColor} // 옵션 — luckyColor dot 오버레이
/>;
```

- region 톤은 `constants/region-tone.ts` 의 시군 → tone 매핑
- emoji 매핑은 `constants/emoji-map.ts` 의 `categoryEmoji()` / `seasonEmoji()`
- 360/480/desktop 별 aspect-ratio + emoji 사이즈 자동 분기

### TextField — 폼 텍스트 입력 (label + input + error + a11y)

```tsx
import { TextField } from '@/components/ui';

<TextField
  id="email"
  type="email"
  autoComplete="email"
  label={t('email')}
  placeholder="you@example.com"
  errorMessage={errors.email ? tErr(errors.email.message) : undefined}
  {...register('email')} // RHF register 또는 controlled value/onChange
/>;
```

- **`id` 필수** — label `htmlFor` + input `id` 자동 연결.
- `label` — undefined 면 label 노드 자체 미렌더. `visuallyHiddenLabel` 로 시각만 가림 (스크린리더 노출).
- `errorMessage` — 이미 i18n 변환된 string. invalid 자동 판단 (`aria-invalid={true|undefined}` boolean→undefined 정정).
- `aria-describedby` 자동 — `${id}-error` / `${id}-hint`.
- RHF + zod / controlled state 모두 호환.
- 사용처 8건 흡수 (Login/Signup/FindId/Forgot/Reset/ChangePassword/NicknameStep/NicknameEditDialog).

### MediaThumb — 이미지 + emoji fallback

```tsx
import { MediaThumb } from '@/components/ui';

<MediaThumb
  src={destination.imageUrl}
  emoji={categoryEmoji(destination.category)}
  sizes="(max-width: 380px) 40vw, 160px"
  className={styles.image} // container — aspect/background/border-radius 책임
  emojiClassName={styles.emoji} // font-size/filter override 시
>
  {accentDot && <span style={{ background: accentDot }} />}
</MediaThumb>;
```

- `secureImageUrl` 자동 (http → https 정규화 + null 안전).
- 있으면 `next/image fill` (alt="" + aria-hidden), 없으면 emoji span.
- container 시각 토큰 (aspect-ratio / background gradient / border-radius) 는 호출 측 className.
- `children` — accent dot / top-right slot 등 추가 노드 (container 안 absolute).
- 사용처 5건 흡수 (DestinationCard/MatchupCard/WinnerCard/RegionContentRow/RecommendationBanner.Slide).

### RadioGroup + RadioOption — 카드형 / segmented radio

```tsx
import { RadioGroup, RadioOption } from '@/components/ui';

<RadioGroup label={t('setup.season.title')} className={styles.grid}>
  {SEASONS.map((s) => {
    const active = value === s.value;
    return (
      <RadioOption
        key={s.value}
        checked={active}
        onSelect={() => onChange(s.value)}
        className={`${styles.card} ${active ? styles.active : ''}`}
        blurOnClick // iOS Safari focus 잔존 안전망 (선택)
      >
        <span aria-hidden>{s.emoji}</span>
        <span>{t(`season.${s.value}`)}</span>
      </RadioOption>
    );
  })}
</RadioGroup>;
```

- `RadioGroup` = `<div role="radiogroup" aria-label>` wrapper.
- `RadioOption` = `<button role="radio" aria-checked>` + `haptic.tap()` 자동.
- content 는 children — 카드형/list/segmented 자유. `cardClasses({...})` 와 조합 가능.
- `blurOnClick` — iOS Safari/PWA 의 focus 잔존 안전망 (Bracket / 질문지 등 DOM 재사용 케이스).
- 사용처 6건 흡수 (CategoryFilter/ThemeKindSelector/SeasonSelector/CountSelector/ThemeSection/TravelTypeQuiz).

### TabList / Tab / TabPanel — headless tabs

```tsx
import { TabList, Tab, TabPanel } from '@/components/ui';

<TabList ariaLabel={t('section')} className={styles.tabs}>
  {TABS.map((it) => (
    <Tab
      key={it.key}
      id={`letter-${it.key}`}
      selected={active === it.key}
      onSelect={() => selectTab(it.key)}
      onPrefetch={() => prefetchTab(it.key)} // pointerdown + focus 자동
      className={`${styles.tab} ${active === it.key ? styles.active : ''}`}
    >
      {t(it.labelKey)}
    </Tab>
  ))}
</TabList>

<div className={styles.list}>
  {TABS.map((it) => (
    <TabPanel
      key={it.key}
      id={`letter-${it.key}`}
      selected={active === it.key}
      mounted={activated.has(it.key)} // lazy mount
      className={styles.panel}
    >
      <Content />
    </TabPanel>
  ))}
</div>
```

- `role="tablist" / role="tab" / role="tabpanel"` + `aria-selected` / `aria-controls` / `aria-labelledby` 자동.
- `haptic.tap()` 자동 (이미 선택된 탭 클릭 시 skip).
- `onPrefetch` — `pointerdown` + `focus` 둘 다 매핑 (모바일 터치 다운 ~ 클릭 발사 100~250ms 흡수 + 키보드 사용자도).
- `mounted={false}` → DOM 자체 없음 (lazy). `mounted=true` + `selected=false` → `hidden`.
- id 페이지 내 unique 면 OK (`tab-${id}` / `panel-${id}` 자동 매핑).
- 사용처 2건 흡수 (`LetterIndex` 4탭+카운트 / `RegionDetailTabs` 카테고리). 디자인 교체 시 호출 측 SCSS 토큰만 수정.

### Dialog — 모달 (backdrop + ESC + focus trap + a11y)

```tsx
import { Dialog, Button } from '@/components/ui';

<Dialog
  open={isOpen}
  onClose={onClose}
  title={t('title')}
  description={t('description')} // optional
  showCloseButton // 우상단 X (선택)
  icon={<MapPin size={28} />} // 알림형 dialog (선택, title 위 중앙)
  actions={
    <>
      <Button variant="secondary" onClick={onClose}>
        {t('cancel')}
      </Button>
      <Button variant="primary" onClick={onConfirm}>
        {t('confirm')}
      </Button>
    </>
  }
>
  {/* 자유 본문 (form 등) */}
</Dialog>;
```

- backdrop click + ESC + 우상단 X 모두 `onClose` 호출.
- `useFocusTrap` + `useKeyboard('Escape')` 자동 — 외부 hook 호출 불필요.
- `aria-labelledby` (title) / `aria-describedby` (description) 자동 연결 — `useId()` 충돌 X.
- fade-in + pop-in 애니메이션 (reduced-motion 자동 해제).
- 사용처 3건 흡수 (`ConfirmDialog` 큐 어댑터 / `NicknameEditDialog` / `ChangePasswordDialog`) — 동일 backdrop/dialog/ESC 코드 4곳 중복 폐기.

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

### AsyncSection — 표준 분기 wrapper

`isLoading → Skeleton / isError → EmptyState+retry / 0 → EmptyState+CTA / else → render` 의 4단계 분기 통합.

```tsx
import { AsyncSection } from '@/components/feedback/AsyncSection';

<AsyncSection
  query={useSavedTournaments()}
  icon={<Trophy size={28} aria-hidden />}
  errorTitle={t('error')}
  emptyTitle={t('empty')}
  emptyDescription={t('emptyHint')}
  emptyAction={<Button onClick={...}>{t('startCta')}</Button>}
  isEmpty={(d) => d.length === 0}
>
  {(data) => <Carousel slides={data} ... />}
</AsyncSection>;
```

children 은 narrow 된 T (non-null) 받음 — 호출부 null 체크 불필요.

### Skeleton — 로딩 자리잡이

API 응답 대기 / dynamic import 청크 로딩 / Suspense fallback. CSS 애니메이션
(JS 부담 0) + `prefers-reduced-motion` 존중. 같은 자리에 실제 콘텐츠가 들어올 때
CLS 가 0 이 되도록 **실제 dimension 과 일치**시키는 게 핵심.

```tsx
import { Skeleton } from '@/components/feedback/Skeleton';

// 단일 자리잡이
<Skeleton width="100%" height={72} radius="lg" />;

// 리스트 자리잡이 — 실제 item dimension 으로
{
  isLoading && (
    <div className={styles.skeletonList} aria-label={tCommon('loading')}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={styles.skeletonItem}>
          <Skeleton width={28} height={28} radius="full" />
          <div className={styles.skeletonLines}>
            <Skeleton width="80%" height={14} radius="sm" />
            <Skeleton width="55%" height={12} radius="sm" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

Props: `width / height` (number | string) / `radius` (`sm` / `md` (default) / `lg` / `full`) / `className`.

`aria-hidden="true"` 자동 — 스크린리더는 부모의 `aria-label` 또는 `aria-busy` 로 안내.

### EmptyState — 빈 데이터 표준 안내

데이터 0개 / 권한 미부여 / 일치 결과 없음 등. 단순 text 가 아닌 일관된 layout
(icon + title + description + action) 으로.

```tsx
import { EmptyState } from '@/components/feedback/EmptyState';
import { Mail, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui';

// 알림함 빈 상태
<EmptyState
  icon={<Mail size={28} aria-hidden />}
  title={t('empty')}
/>

// CTA 포함 (편지함 첫 진입)
<EmptyState
  icon={<Mail size={32} aria-hidden />}
  title="아직 도착한 편지가 없어요"
  description="다섯글자로 첫 편지를 보내보세요"
  action={
    <Button variant="primary" onClick={() => router.push('/letter/compose')}>
      편지 쓰기
    </Button>
  }
/>
```

Props: `icon` (선택) / `title` (필수) / `description` (선택) / `action` (선택) / `className`.

### Skeleton vs EmptyState — 언제 어느 쪽?

| 상황                                  | 사용                                                                                                       |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `isLoading=true` (네트워크 응답 대기) | **Skeleton**                                                                                               |
| `data?.items.length === 0`            | **EmptyState**                                                                                             |
| `isError` + retry 가능                | EmptyState (action 으로 retry Button) 또는 `<Button variant="secondary" size="sm" onClick={refetch}>` 단독 |
| Button 자체의 mutation pending        | `<Button loading>` — Skeleton 불필요                                                                       |
| `return null` 권장                    | 홈 위젯 등 "첫 렌더 부담 회피" 가 우선인 곳 (LatestReceivedLetter) — 메모리 정책 "렌더링 속도 최우선"      |

### 새 위젯 작성 가이드라인 (loading/empty 표준)

```tsx
function MyWidget() {
  const { data, isLoading, isError, refetch } = useFoo();

  if (isLoading) {
    return (
      <div className={styles.skeletonWrap}>
        <Skeleton width="100%" height={64} radius="md" />
      </div>
    );
  }
  if (isError) {
    return (
      <EmptyState
        icon={<AlertCircle size={28} />}
        title={t('error')}
        action={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {t('retry')}
          </Button>
        }
      />
    );
  }
  if (!data || data.length === 0) {
    return <EmptyState icon={<Inbox size={28} />} title={t('empty')} />;
  }
  return <List items={data} />;
}
```

부모 영역에 **min-height** 명시 — 로딩 → 데이터 / 에러 / 빈 전환 시 CLS 0.

## 3. 디자인 교체 시나리오

브랜드 색을 핑크(#ec4899) 로 바꾼다면 — `globals.scss` 의 `--color-primary` 한 줄만 수정.
모든 carousel/card/chip/button/progress 가 자동으로 새 색으로 반영됨 (primary-soft, -tint, -border, -ring, -muted 모두 derived).

shadow 강도 조정 시 `--shadow-card-strong` 한 곳. dark/light 분기는 자동.

## 4. 남은 후속 정비

거의 모든 raw 값 잔존 0. 남은 의도 unique 는 도메인 토큰으로 분리됨 (`--line-display`, `--tracking-pin/-pin-fill`, `--drop-shadow-petal` 등). 새 컴포넌트 작업 시 위 1~3 의 토큰/Primitive 사용 + 새 도메인 값 발생 시 도메인 토큰 신설을 우선.

---

## 5. 현재 적용 현황 (갱신 2026-06-08)

대규모 sweep 완료 — raw 잔존 0. 의도된 unique 만 남음.

### 의도된 unique (3건)

- **ComposeEntryCard `0 6px 12px rgba(0,0,0,0.15)`** — drop-shadow-md / -lg 와 다른 unique size. 컴포넌트 1곳 한정.
- **LuckyLadder `0 0 4px` / `0 2px 6px` / `0 1px 4px var(--color-primary-ring)`** — primary-ring 글로우. token 사용 + unique size.

### `<button>` 직접 사용 (38곳, 의도)

primitive 신설 대신 자체 module + mixin 으로 디자인 시스템화:

- `LetterActions` (3) — `.action / .liked / .saved / .danger` toggle aria-pressed
- `Install/PwaUpdateBanner` (5) — `Banner.module.scss` 의 `.action / .close`
- `AccountSettings/Actions` (6) — `SettingsRows.module.scss` 의 `.button / .row / .danger`
- `Carousel` dot/arrow (5) — 내부 미니멀 UI
- 그 외 — 자체 module 또는 `cardClasses` 합성

`_mixins.scss` 에 `settings-row` / `banner-action` / `banner-close` 추출됨. 새 화면 동일 패턴 시 `@include`.

### iOS Safari button 처리 — 필수

iOS Safari / PWA 의 native button rendering 이 일부 border 속성을 무시하는 회귀가 있어 `_reset.scss` 에 `-webkit-appearance: none` + `appearance: none` 강제. 모든 button 기반 card (ThemeKindSelector / SeasonSelector / CategoryFilter / MatchupCard 등) 의 `.v-surface` border 가 일관 노출됨.

### i18n 미적용 (의도, 4건)

- `dev/CatalogClient` — dev 도구 한정
- `policy/privacy <li>` — 법무 검토 후
- `시행일자: 2024-01-01` — 한국 운영 우선
- `TripBite · 여행 유형 테스트` — 브랜드명 + 한국 운영

### Dark / 반응형 / 도메인 토큰

- ✅ `_dark.scss` — 시즌 5 + 카테고리 5 + chart-2~8 dark override (light 500 → dark 400)
- ✅ `_dark.scss` — `[data-theme="dark"]` / `[data-theme="light"]` 명시 토글 지원 (`@mixin dark-tokens`)
- ✅ `_responsive.scss` — mobile-360 / 320 단계별 font / emoji / space / header-h 축소 (전역 토큰)
- ✅ **fluid clamp() 정책** — 9 컴포넌트의 단계별 media query 폐기 (320~desktop 부드러움)
- ✅ `_mixins.scss` — `respond-to / text-truncate / focus-ring / visually-hidden / settings-row / banner-action / banner-close`

### 인프라

| 영역               | 토큰 / Primitive                                                                                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color              | `--color-bg/-fg/-muted/-border/-primary*/-surface*/-divider/-hover*/-overlay/-glass`, `--color-letter-*`                                                                   |
| Accent             | `--accent-{spring/summer/autumn/winter/festival}` + grad, `--accent-{red/amber/green/blue/violet}`                                                                         |
| Chart              | `--chart-1 ~ -8`                                                                                                                                                           |
| Shadow             | `--shadow-{sm/md/lg/card/card-strong/pop/emphasis}`, `--drop-shadow-{icon/xs/sm/md/lg/petal}`                                                                              |
| Motion             | `--motion-{fast/base/slow/emphasis}`, `--ease-{out/spring}`                                                                                                                |
| Spacing            | `--space-1 ~ -12` (4px grid)                                                                                                                                               |
| Radius             | `--radius-{sm/md/lg/xl/full}`                                                                                                                                              |
| z-index            | `--z-{base/elevated/header/bottom-nav/dropdown/banner/modal/toast}`                                                                                                        |
| Typography         | `--font-{display/h1/h2/h3/body/body-sm/label/caption/eyebrow}`, `--font-letter-*`, `--font-tournament-*`                                                                   |
| Emoji              | `--emoji-{sm/md/lg/xl/2xl/3xl/4xl}`                                                                                                                                        |
| Primitive 컴포넌트 | `Card / Chip / IconButton / PageSection / Button / DestinationCard / ButtonGrid / TextField / MediaThumb / RadioGroup / Dialog / TabList+Tab+TabPanel` (`@/components/ui`) |
| Layout primitive   | `AuthLayout`, `PolicyArticle / PolicySection / PolicyFooter`                                                                                                               |
| 검출기             | `scripts/dead-css.mjs` (CI 통합 가능)                                                                                                                                      |
