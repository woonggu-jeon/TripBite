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

## 🟡 남은 잔존 — 의도된 unique 또는 시스템 결정 대기

### 1. 단발성 큰 글씨 (font-size raw rem) — 10건

- `1.625rem`, `5rem`, `0.5rem`, `0.625rem` 등 — 컴포넌트 1곳에서만 쓰는 의도값
- 사용처: 트로피 celebration emoji 5rem, 편지 stampTag 0.5rem, festival region/period 0.625rem 등
- 디자인 시스템 안정화 시 자연스럽게 emoji-\* 또는 새 토큰으로

### 2. `<button>` 직접 사용 잔존

- 대부분 정당 — 다음 카테고리만 남음:
  - 토너먼트 ladder/luckyColor 등 일러스트 컴포넌트 내부 인터랙션
  - bottom nav / theme toggle (Button primitive 의 variant 와 맞지 않는 형태)
- 추가 마이그레이션 가치 낮음

### 3. `styles.card` 자체 정의

- 14 → 7 으로 감소. 남은 7곳은 cardClasses + module 합성 패턴 — primitive 활용 완료 상태.

### 4. hardcoded brand-ish color (외부 hex)

- 추천 카드 톤별 색 (`#ff6f91`, `#5db4ff`, `#9ec5ff` 등) — **컴포넌트 고유 색**. brand color 시스템 결정 후 `--accent-spring/summer/autumn/winter/festival` 같이 도메인 토큰화 가능.
- `#fff8e7` (편지 종이 cream tint) — 1곳 사용. letter-paper 변형으로 흡수 가능.

### 5. `rgba(0,0,0,X)` 잔존 — shadow / outline

- ~30곳 잔존. 대부분 컴포넌트별 box-shadow 또는 text-shadow. **shadow 토큰이 box-shadow 위주라 drop-shadow/text-shadow 는 컴포넌트별** 결정.
- 의도가 명확하면 그대로 OK. brand shadow scale 결정 시 일괄 토큰화 가능.

### 6. raw transition 시간 — 2곳

- Toggle `transform 0.18s ease` (motion-fast 100 ~ base 150 의 중간)
- RegionWinsChart `width 0.6s var(--ease-out)` (slow 300 ~ emphasis 550 의 사이)
- 둘 다 unique 의도값. 새 motion 토큰 만들 가치 낮음.

### 7. `#fff` badge text — 2곳

- `background: var(--color-success); color: #fff;` 패턴
- `on-success`/`on-danger` 토큰 도입 시 정리 가능. 현재 정상.

---

## 🟢 권장 다음 작업 — 모두 미정 (디자인 결정 필요)

1. **추천 카드 톤별 색 → `--accent-{season}` 토큰화** (디자인 시스템 결정 후)
2. **`drop-shadow` / `text-shadow` 토큰 추가** (현재 box-shadow 토큰만)
3. **`on-{role}` 토큰 시리즈** (badge 위 흰/검 텍스트)
4. **차트 (recharts) 색상 토큰 매핑** — 현재 컴포넌트별 hardcode

위 4가지는 모두 **사용자/디자이너 결정 필요한 brand-level 확정** 단계. 결정되면 일괄 sed 또는 컴포넌트별 마이그레이션.
