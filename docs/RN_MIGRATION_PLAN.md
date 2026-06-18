# React Native 포팅 / Cross-platform 전략 검토

**작성일**: 2026-06-18
**상태**: 검토 (결정 전)
**관련**: 현 stack — Next.js 15 + React 19 + SCSS Modules + PWA (Serwist)

## TL;DR

- 단순 RN Expo 포팅: **17-26 주** (1 시니어 RN, full-time)
- monorepo + tokens/logic 공유: **13-20 주** (-25%)
- Tamagui 미리 마이그레이션 + 미래 native: **10-16 주** (-30%, 단 web 회귀 risk)
- Capacitor wrap: 1-2 주 (UX 트레이드오프, TripBite 인터랙션 많아 비추)

**핵심 변수** — 미래 native 출시 진심도. 결심도 따라 지금 의사결정 다름.

---

## 1. 현 코드베이스 재사용도 평가

| 영역                                       | 재사용율  | 비고                                                          |
| ------------------------------------------ | --------- | ------------------------------------------------------------- |
| 비즈니스 로직 (hooks/stores/schemas/utils) | ✅ 80-90% | TanStack Query / Zustand / zod / react-hook-form 모두 RN 호환 |
| API client (orval generated + axios)       | ✅ 90%+   | axios 그대로. cookie → AsyncStorage 만 조정                   |
| i18n (ko/en 608 키)                        | ✅ 100%   | JSON 그대로 — next-intl / react-i18next 동일 포맷             |
| 타입 / DTO / generated                     | ✅ 100%   | 전부 그대로                                                   |
| UI 컴포넌트 (~40 primitives + 200 page)    | ❌ 0%     | HTML → RN View/Text/Pressable 전면 재작성                     |
| Styling (SCSS Module ~80 파일)             | ❌ 0%     | StyleSheet 또는 NativeWind/Tamagui 재작성                     |
| Routing (App Router + middleware)          | ❌ 0%     | Expo Router 또는 React Navigation                             |
| PWA (Serwist)                              | ❌ 0%     | expo-notifications + expo-updates 로 대체                     |
| SVG 인터랙션 (Bracket / 11시군 지도)       | ❌ 0%     | react-native-svg 재작성                                       |
| OG 이미지 (next/og Satori)                 | ❌ 0%     | 서버 endpoint 유지 또는 react-native-view-shot                |

→ **비-UI ~40-50% 무변경 공유 가능**.

---

## 2. Cross-platform UI 솔루션 비교 (Next.js + RN 둘 다 호환)

| 솔루션           | 단일 codebase  | Next.js SSR | RN 호환 | 우리 현 SCSS      | 학습 곡선 |
| ---------------- | -------------- | ----------- | ------- | ----------------- | --------- |
| **Tamagui**      | ✅             | ✅ 완전     | ✅      | ❌ 전부 폐기 가능 | 큼        |
| React Native Web | ✅             | ❌ CSR 만   | ✅      | ❌ 전부 폐기      | 중간      |
| NativeWind v4    | UI 60-70%      | ⚠️ 부분     | ✅      | ❌ Tailwind 화    | 중간      |
| Tokens + 별도 UI | ❌ (양쪽 작성) | ✅ 무변경   | ✅      | ✅ 그대로 유지    | 작음      |

**Next.js SSR/RSC/middleware 살리면서 cross-platform UI 단일화** 가능한 건 사실상 **Tamagui** 만.

---

## 3. 시나리오별 공수 (지금 비용 + 미래 native 비용)

| 시나리오                                      | 지금 비용 | 미래 native 추가 | **합계**        |
| --------------------------------------------- | --------- | ---------------- | --------------- |
| 1. 그대로 두기 (SCSS 유지)                    | 0         | 17-26 주         | 17-26 주        |
| 2. monorepo + tokens/logic 공유 셋업          | 1-2 주    | 13-20 주         | 14-22 주        |
| 3. Tamagui 마이그레이션 미리 (SCSS → Tamagui) | 4-6 주    | 6-10 주          | **10-16 주** 🟢 |
| 4. Capacitor / WebView wrap (PWA 그대로 앱화) | 0         | 1-2 주           | 1-2 주 ⚠️       |
| 5. RN Expo + RN Web (web 도 RN 으로 통합)     | 8-12 주   | 4-6 주           | 12-18 주        |

### 시나리오별 trade-off

- **1**: 단순. 결정날 때 17-26 주 통째로. 코드 늘수록 비례 증가
- **2**: 1-2 주로 옵션 열어두기. features/\* / tokens / i18n 분리만
- **3**: 가장 효율. 단 web 회귀 risk + Tamagui 학습 곡선
- **4**: 가장 빠름. App Store 단순 wrapper 리젝 risk + native UX 한계 (60fps / 제스처 / 햅틱). TripBite 의 토너먼트 bracket / 시군 지도 같은 인터랙티브 화면과 안 맞음
- **5**: web 까지 RN 으로 통일 — Next.js SSR/RSC/PWA 다 폐기. 우리 stack 강점 폐기라 비추

---

## 4. Tamagui 도입 깊이 (시나리오 3 의 하위 분기)

**핵심 질문**: Tamagui 적용 시 SCSS 다 폐기? → **아님**. 깊이 선택 가능.

| 깊이                           | SCSS 폐기 범위 | 작업 시간 | native 공유 효과 |
| ------------------------------ | -------------- | --------- | ---------------- |
| **A. UI primitive 만**         | ~20%           | 2-3 주    | ~30% 공유        |
| **B. 토큰 + primitive (권장)** | ~30%           | 3-4 주    | ~50% 공유        |
| **C. 전체 통합**               | ~95%           | 4-6 주    | ~80% 공유        |

### 폐기/유지 매트릭스

| 영역                                        | A (primitive) | B (+토큰)                  | C (전체)              |
| ------------------------------------------- | ------------- | -------------------------- | --------------------- |
| `src/components/ui/*` (Button/Card/Chip 등) | ❌ 폐기       | ❌ 폐기                    | ❌ 폐기               |
| `src/components/ui/*.module.scss`           | ❌ 폐기       | ❌ 폐기                    | ❌ 폐기               |
| `src/styles/tokens.scss` (CSS variables)    | ✅ 유지       | ❌ **폐기** (Tamagui 통합) | ❌ 폐기               |
| `src/features/*/components/*.module.scss`   | ✅ 유지       | ✅ 유지                    | ❌ 폐기               |
| `src/app/*/_components/*.module.scss`       | ✅ 유지       | ✅ 유지                    | ❌ 폐기               |
| `globals.scss` (reset/base)                 | ✅ 유지       | ✅ 유지                    | ⚠️ 일부만 (font-face) |

### 현재 SCSS 분포 추정 (~80 파일)

```
primitive UI:      ~15 파일 (Button/Card/Dialog/Tabs/DestinationCard 등)
feature 컴포넌트:  ~40 파일 (FestivalCarousel/Bracket/RegionHero 등)
page-level:        ~25 파일 (loading/_components 등)
base/tokens:        3-5 파일
```

→ A: 15 폐기 / 65 유지 (80%) · B: 18 폐기 / 62 유지 (78%) · C: 78 폐기 / 2-3 유지 (97%)

---

## 5. 권장 — 미래 native 진심도 별

| 미래 native 진심도                        | 추천 시나리오                                     |
| ----------------------------------------- | ------------------------------------------------- |
| **결정 100%** (1년 내 확정)               | **3. Tamagui 미리** (깊이 B 또는 C)               |
| **결정 50%** (검토 중)                    | **2. monorepo + tokens 분리** — 1-2주로 옵션 열기 |
| **결정 20%** (잠재성만)                   | **1. 그대로 두기** — 결정날 때 17-26 주           |
| **빠른 native 출시 OK** (UX 트레이드오프) | **4. Capacitor** — 1-2주, 인터랙션 한계           |

TripBite 가 토너먼트 bracket / 11시군 지도 / 카드 swipe 등 **인터랙션 많은 도메인** 이라 4 는 별로 맞지 않음.

---

## 6. 지금 부담 없이 미리 해둘 수 있는 작은 결정

미래 비용 줄이는 작은 결정 (현재 PR 부담 0):

- ✅ 이미 잘 되어 있음:
  - features/\* 분리 (도메인 hooks + api + components)
  - generated API (orval) — BE swagger SoT
  - i18n 메시지 JSON 분리 (ko/en)
  - 디자인 토큰 SCSS 변수 정착
- ⚠️ 점진 개선 가치:
  - CSS variables 를 TS 토큰 객체로도 export (이중 source, 사용처 0 추가) → 미래 RN import 가능
  - 도메인 prop 일관성 (`description`/`name`/`emoji` 등 framework 무관 정의) — 이미 잘 됨

---

## 7. 다음 액션 (의사결정 시)

### Path A — Tamagui POC 우선

1. **POC 1-2일**: Button + Card 만 Tamagui 로 변환 후 SCSS 와 공존 / 시각 회귀 / 학습 곡선 평가
2. POC 만족 시 → 깊이 B 확장 (3-4 주)
3. native 만들 때 UI primitive 100% 공유

### Path B — monorepo 셋업 우선

1. **1-2 주**: turborepo / pnpm workspace 셋업
2. features/\* → `packages/core/`
3. tokens → `packages/tokens/` (CSS + TS 이중 export)
4. i18n → `packages/i18n/`
5. apps/web 은 현재 그대로, apps/native 는 미래 추가

### Path C — 현 상태 유지

1. native 진심도 명확해질 때까지 web polish
2. 결정 시점에 17-26 주 통째로 작업
3. **risk**: 코드 늘면 마이그레이션 비용도 비례

---

## 8. 의사결정 체크리스트

다음 질문 답하면 시나리오 좁힘:

- [ ] 1년 내 native 앱 출시 결정 됐는가?
- [ ] native 만들면 web 도 유지할 건가, 아니면 web 폐기?
- [ ] 디자인팀이 Tamagui 의 token system 학습 의향 있는가?
- [ ] 인터랙티브 도메인 UI (bracket / 지도) 의 native 재구현 인력 확보 가능한가?
- [ ] App Store 단순 wrapper 리젝 risk 수용 가능한가? (Capacitor 평가 시)
- [ ] monorepo (turbo/pnpm workspace) 운영 경험 있는 dev 있는가?

답 받으면 정확한 권장 시나리오 + 단계별 plan 작성 가능.
