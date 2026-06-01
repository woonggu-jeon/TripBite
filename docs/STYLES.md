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
