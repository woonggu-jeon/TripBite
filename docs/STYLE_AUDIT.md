# 디자인 적용 전수조사 (2026-05-29 기준)

토큰/primitive 추가는 완료. 남은 작업은 **사용처 마이그레이션**. 영향 큰 순으로 정리.

## 1. Auth form 인라인 style — 최우선

`features/auth/components/*Form.tsx` 가 **인라인 style 의 본거지**.

| 파일                                          | inline style 개수 |
| --------------------------------------------- | ----------------- |
| FindIdForm                                    | 13                |
| ForgotPasswordForm                            | 12                |
| ResetPasswordForm                             | 11                |
| SignupForm                                    | 8                 |
| NicknameStep / LoginForm / ChangePasswordForm | 5 each            |
| LocationStep / ConceptStep                    | 5-6               |
| global-error.tsx                              | 6                 |

대부분 같은 패턴 — `display: 'grid', gap`, `padding`, `border`, `borderRadius` 등.

**해결**: 공통 form SCSS module + `FormField` primitive 도입.

## 2. `<button>` 직접 사용 — Button primitive 미적용

`<Button>` import 한 파일: 3 (이번 PR 후)
`<button>` 직접 사용 파일: 50+

남은 마이그레이션 후보 (사용 횟수 많은 순):

- AccountSettingsSection (4)
- LocationStep (4)
- TravelTypeQuiz / InstallPromptBanner / LetterActions (3 each)
- TravelTypeShareCard / RegionWinsChart / PwaUpdateBanner (2 each)
- 그 외 1개씩 다수

## 3. `styles.card` 자체 정의 — Card primitive 미적용

`<Card>` import: 5 파일
`styles.card` 자체: 14 파일

마이그레이션 후보:

- MatchupCard / SeasonSelector / SpecialDaySelector / ThemeKindSelector (tournament 선택 카드 4종)
- ComposeEntryCard
- TravelTypeTestEntry

## 4. hardcoded color — `#d97706` 외 brand-ish

`#d97706` (amber) 22회 + `#fff8e7`, `#ffcf5b`, `#ff9eb5`, `#9ec5ff` 등 추천 카드 톤별 색. **의도된 컴포넌트 고유 색** 이므로 그대로 두는 게 자연스러움. 단 디자인 시스템 결정 시 `--accent-*` 토큰화 가능.

## 5. `rgba(0,0,0,X)` 잔존 — shadow / outline

30+ 곳 잔존. 대부분 **drop-shadow / text-shadow** 안. shadow 토큰이 `box-shadow` 위주라 `drop-shadow` / `text-shadow` 는 컴포넌트별. 의도가 명확하면 그대로 OK.

## 6. `border-radius: 50%` — 11곳

원형 (아바타/아이콘 background) — `var(--radius-full)` 로 일괄 변경 가능. 안전 sed.

## 권장 작업 순서

1. **FormField primitive 도입** → Auth form 인라인 style 일괄 제거 (이번 PR)
2. **`border-radius: 50%` → `var(--radius-full)` sed 일괄** (안전, 11곳)
3. **남은 카드 4종 (tournament 선택 카드) → Card primitive**
4. **`<button>` → `<Button>` 광역 마이그레이션** (PWA banner / LetterActions / RegionWinsChart / TravelType / Settings 등)
5. **brand color 토큰화** (디자인 결정 후)
