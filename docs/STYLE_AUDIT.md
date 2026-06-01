# 디자인 적용 전수조사 (갱신: 2026-05-30)

토큰/primitive 추가 + 핵심 사용처 마이그레이션은 대부분 완료. 남은 작업은 **점진/일회성 잔존 패턴**.

> 반복 sweep 결과 — 의도된 unique 패턴은 잔존 시키고, 실질적 충돌·중복만 정리.

## ✅ 완료 (이전 → 현재)

### 1. Auth form 인라인 style — 완료

- `AuthForm.module.scss` 공유 SCSS 도입. 6개 form (Login/Signup/FindId/ForgotPassword/ResetPassword/ChangePassword) 인라인 49+ → 0
- `OnboardingStep.module.scss` 공유 SCSS — Concept/Location/Nickname Step 인라인 16+ → 0
- `AuthLayout` primitive — 6개 auth 페이지의 `<main>` 인라인 통합 (`variant=center/column`)

### 2. `<Button>` 광역 마이그레이션 — 완료

- TournamentSetup (start), TournamentPlayClient (5곳), TravelTypeQuiz/Share/Result, RegionWinsChart, LocationPermissionPrompt, ConfirmDialog (variant=danger), LetterSentClient, LetterDetailClient, AuthForm primary submit, Onboarding 등

### 3. Card primitive — 완료 + 충돌 해결

- WinnerCard / ProfileCard / TravelTypeResult / Share / Top5Card / LetterRowCard / MatchupCard / ThemeKindSelector / SeasonSelector / SpecialDaySelector / ComposeEntryCard / TravelTypeTestEntry — `cardClasses` 적용
- **base class `.card` → `.root` rename + `:where(.root) { display: block }` specificity 0** — 호출처 module 의 `.card` 가 항상 이김. 페이지 전환 / 뒤로가기 시 CSS chunk source order 변동에 영향 받지 않음.
- `cardClasses({ padding })` 미명시 시 `.p-*` 클래스 미부여 — module 의 `.card` 가 padding 직접 처리하는 패턴에서 conflict 회피.

### 4. Layout primitives

- `AuthLayout` — 인증 6 페이지 main wrapper. variant `center`(default) / `column`.
- `PolicyArticle` / `PolicySection` / `PolicyFooter` — terms/privacy/licenses 3 페이지.
- 호출처에서 페이지 layout 인라인 0.

### 5. 도메인 색 토큰화 — Letter

- `--color-letter-accent` / `--color-letter-paper` 신설 (light/dark 분기)
- LetterSentClient / LetterDetailClient 의 `#d97706` 22회 + `#fff` 1회 → 토큰. 의미상 warning 과 같은 값이지만 별도 토큰으로 분리(디자이너가 letter 만 조정 가능).

### 6. `border-radius` 통일 — 완료

- `border-radius: 9999px` 3곳(OnboardingFlow / Skeleton / Carousel dot) → `var(--radius-full)` 일괄.

### 7. 중복 Section 컴포넌트 → PageSection primitive 통합

- `MyPageClient.tsx` 와 `SettingsClient.tsx` 가 각자 inline 정의하던 동일한 `Section({title, children})` 컴포넌트 제거.
- 둘 다 기존 `PageSection` primitive (`@/components/ui`) 사용으로 통합.
- 미사용 `.sectionTitle` / `.section` SCSS 정리.

### 8. ESLint warnings 정리 — 완료

- `ConfirmDialog` backdrop 에 `role="presentation"` 명시 (보조 영역 의도).
- 내부 dialog `<div>` 의 stopPropagation onClick — 표준 dialog 패턴이고 `role="dialog"` 가 있음 + Esc/내부 Button 키보드 인터랙션 제공 → `eslint-disable-next-line` 으로 의도 명시.
- 전 프로젝트 ESLint warning 0.

### 9. dark mode 누락 점검 — 누락 없음

- `color: #fff` 5곳 — 모두 colored background (success/danger/banner) 위 텍스트. dark 에서도 가독성 의도. 유지.
- `Top5Card` 의 raw hex (금/은/동 메달 색) — 의미적 색상. dark/light 양쪽 OK.
- `Toggle` thumb 의 `#fff` — toggle 동작 (반전) 정상.
- 컴포넌트별 `@media (prefers-color-scheme: dark)` override 가 있는 곳은 `globals.scss` + `ChungbukMap` 둘뿐. 나머지는 모두 토큰 사용으로 자동 대응 — 정상.

### 10. 단발성 작은 라벨 — `--font-eyebrow` 흡수

- `FestivalCarousel` 의 `font-size: 0.625rem` (10px) 2곳 → `var(--font-eyebrow)` (11px). 시각 차이 1px (무시 가능), 토큰 통일.

### 11. Letter 종이 cream — `--color-letter-cream` 신설

- `#fff8e7` (편지 종이 gradient base) 4곳 → `var(--color-letter-cream)`. light/dark 분기 토큰. globals.scss 의 letter 도메인 토큰 시리즈에 통합.

### 12. dead CSS class 정리

- `LetterComposeForm` `.primary` / `.secondary` / `.error` — Button primitive 마이그레이션 + 인라인 에러 제거 후 미사용. 제거.
- `LetterSentClient` / `LetterDetailClient` 의 `.primary` / `.secondary` — 동일 이유. 제거.
- `scripts/dead-css.mjs` 검출기 추가 (동일 폴더 모든 tsx 검색, `styles[]` 동적 케이스는 보수적으로 제외).

### 13. accessibility (aria-label / img alt / input label) sweep — 누락 없음

- icon-only button 의 aria-label 모두 적용됨.
- `<img alt=...>` 없는 케이스 없음 (모든 이미지가 next/image 또는 alt 명시).
- `<input>` 모두 label 매칭 또는 aria-label.
- ESLint warning 0 상태와 일치.

### 14. 하드코딩 i18n 문자열 sweep — 긴급 fix 없음

- `dev/CatalogClient` — dev 도구 한정.
- `policy/privacy <li>` 자리잡이 — 법무 검토 후 i18n.
- `시행일자: 2024-01-01` — 한국 우선 운영, 영문 운영 결정 후.
- `TripBite · 여행 유형 테스트` — 브랜드명 (고유) + 한국 운영 한정 텍스트.

### 15. `<button>` 직접 사용 — 모두 의도된 형태로 분류 완료

38곳 잔존:

- `LetterActions` — toggle (aria-pressed) 액션. variant 와 안 맞음.
- `Install/PwaUpdateBanner` — banner action+close. 자체 module 잘 구조화.
- `AccountSettings/Actions` — settings row. 자체 module 패턴.
- `Carousel` dot/arrow, dropdown trigger, card 형태 selector 등 — 모두 Button primitive 부적합.
- 추가 마이그레이션 가치 없음.

---

## 🟡 남은 잔존 — 의도된 unique 만 (모두 흡수/토큰화 가능한 것은 완료)

### 1. ~~단발성 중간 큰 글씨~~ — ✅ 도메인 토큰화 완료

- ComposeEntryCard `3.5rem` → `--font-letter-envelope` (편지 봉투)
- WinnerCard `2rem` → `--font-tournament-trophy`
- WinnerCard `2.75rem` → `--font-tournament-winner`
- 도메인 토큰 (letter / tournament) 으로 의미 명확. 디자이너가 도메인별 typography 일괄 조정 가능.
- 모든 raw font-size rem 잔존 0.

### 2. `<button>` 직접 사용 잔존 — 모두 분류 완료

- LetterActions / banner action+close / settings row / carousel dot 등 — Button primitive 부적합 컨텍스트. 자체 module 잘 구조화.

### 3. `styles.card` 자체 정의

- cardClasses + module 합성 패턴으로 primitive 활용 완료 상태.

### 4. ~~hardcoded brand-ish color~~ — ✅ 완료

- `--accent-{season}` + `--accent-{color}` + `--color-letter-cream` 토큰화 완료.

### 5. ~~rgba(0,0,0,X) shadow~~ — ✅ 완료

- box-shadow rgba 잔존 4곳 → `--shadow-sm/-md/-pop` 흡수 완료.
- drop-shadow `--drop-shadow-xs/-lg` 추가 신설 + ChungbukMap/FallingPetals 흡수.
- 남은 drop-shadow 는 컴포넌트 unique (ChungbukMap 작은 `0 2px 3px`, FallingPetals 의 blue rgba 꽃잎, LuckyLadder `--color-primary-ring` 이미 토큰).

### 8. ~~line-height / letter-spacing 잔존~~ — ✅ 흡수 완료

- line-height 1.25 → `--line-tight`, 1.55 → `--line-normal` (3곳 흡수, 0.05 차이 미세).
- letter-spacing 0.05em → `--tracking-uppercase`, -0.04em → `--tracking-tight`, 0.1em/0.12em → 새 `--tracking-emphasis` (6곳).
- 잔존: line-height 1.1 (CountSelector, 큰 글씨에서 0.1 차이 시각 영향), letter-spacing 0.25em/1em (PIN style 강제) — 보존.

### 6. ~~raw transition 시간~~ — ✅ 완료

- Toggle `0.18s` → `var(--motion-base)` 흡수 (30ms 차이 미세).
- RegionWinsChart `0.6s` → `var(--motion-emphasis)` 흡수 (50ms 차이 미세).
- raw transition 0 잔존.

### 7. ~~#fff badge text~~ — ✅ 완료

- `--color-on-strong` 으로 5곳 토큰화 완료.

---

## 🟢 권장 다음 작업 — 모두 완료

1. ~~추천 카드 톤별 색~~ → ✅ globals 토큰화 완료 (`--accent-{season}` + grad-start/end, `--accent-{color}` 각 5종).
2. ~~`drop-shadow` / `text-shadow` 토큰~~ → ✅ `--drop-shadow-sm/-md`, `--text-shadow-soft` 신설. 4곳 흡수 (RecommendationBanner emoji / CenterIllustration trophy / ComposeEntryCard small / LetterRowCard text).
3. ~~`on-{role}` 토큰 시리즈~~ → ✅ `--color-on-strong` 으로 통합 (5곳 토큰화).
4. ~~차트 색상 토큰 매핑~~ → ✅ `--chart-1` ~ `--chart-8` 신설 + `src/features/chart/utils/colors.ts` 의 CHART_PALETTE 갱신. recharts series 색이 globals 토큰 기반.

이제 디자이너가 globals.scss 한 곳에서:

- 브랜드 색 (`--color-primary`) → 모든 카드/버튼/칩/차트1 자동 반영
- 시즌별 색 (`--accent-spring/...`) → RecommendationBanner 시즌 카드
- 카테고리 색 (`--accent-red/...`) → FestivalCarousel 톤
- 차트 색 (`--chart-2/.../-8`) → 모든 recharts 차트
- shadow/text-shadow 강도 → 일괄 조정

모든 brand-level 토큰화 진행 완료.
