# TripBite 후속 작업 백로그

> 코드베이스 전수조사 후 정리한 미완성 / 개선 항목. 분기점마다 갱신.
> 마지막 갱신: 2026-06-01 (브랜치 `dev`, commit `e5c06d8`).
>
> 작업량 표기: **S** (≤30분) · **M** (1-3시간) · **L** (반나절+)

---

## 최근 완료 (이번 분기 — 2026-06-01)

- ✅ **이미지 카드 공유 + OG 메타** — `/api/og/[type]` Edge route 4 종 (tournament / quiz / destination / region). Web Share API File + OG 메타 동적.
- ✅ **여행지 상세 페이지** `/destination/[id]` 신설 — Hero + WinnerDetailPanel + bestSeasons. `lib/share.ts` URL 공유.
- ✅ **위젯 라우팅 정리** — 홈/랭킹/시군 상세의 위젯 클릭이 도메인에 맞게 분기 (여행지 → `/destination`, 지역 → `/region`).
- ✅ **푸시 알림 기초** — `sw.ts` push/notificationclick handler, `lib/share.ts`, mock 시뮬레이션 도구 (`MockPushTrigger`), iOS standalone 분기.
- ✅ **계절 토너먼트 진입** — 홈 빠른시작이 현재 월 → 계절 자동 추천. random 테마 흐름 (step 1 → step 4 점프) + 'special' → 'random' 으로 의미 변경 + `SpecialDaySelector` 폴더 제거.
- ✅ **카테고리 'local' 미노출 정책** — CategoryFilter / TournamentSetup 의 random / quiz 추천 모두 'local' 제외 (축제 / 관광지 / 체험관광 3종).
- ✅ **홈 위젯 정리** — '새 편지' / '내 우승지' 미노출 (주석 처리, 복원 가이드).
- ✅ **알림함 mock 처리** — mock 모드에선 비로그인이라도 노출, type 매핑 누락 회귀 fix.
- ✅ **번들 모니터링 메모** — First Load 213 KB, 추가 절감 여지 없음, 1주 1회 분석 권장.

---

## 우선 순위 한눈에

| Phase | 영역                                | 의존성                     | 작업량        |
| ----- | ----------------------------------- | -------------------------- | ------------- |
| **0** | dead code / dead spec 청소          | 없음                       | S × 5         |
| **1** | mypage 위젯 구현 (mock 만으로 동작) | 백엔드 계약 / 디자인       | M × 6         |
| **2** | 홈 위젯 + 지도 SVG                  | 디자인 (SVG asset)         | M × 3 / L × 1 |
| **3** | Future BE 포인트 일괄 연동          | NestJS                     | M × 5         |
| **4** | 푸시 알림 운영 진입                 | NestJS web-push + DB       | L × 1         |
| **5** | 보안 / 성능 / 테스트 마무리         | 백엔드 (rate limit / 메일) | M-L 다수      |

---

## 1. Stub 컴포넌트 (27개)

> README는 "53개"라 표기 — 그동안 절반 정도 구현되어 실제 stub은 **27개**.
> 그중 **11개는 dead spec** (호출처 없음, 인라인으로 구현됨) — 즉시 삭제 후보.

### 1-1. 즉시 삭제 후보 (11개) — Phase 0

| 컴포넌트               | 위치                              | 이유                                                                |
| ---------------------- | --------------------------------- | ------------------------------------------------------------------- |
| `RegionAttractionList` | `src/features/region/components/` | `RegionDetailTabs` 가 인라인 구현 (InfiniteList + RegionContentRow) |
| `RegionFestivalList`   | 동상                              | 동상                                                                |
| `RegionExperienceList` | 동상                              | 동상                                                                |
| `ReceivedLetterList`   | `src/features/letter/components/` | `LetterListPanel(kind='received')` 가 실 구현                       |
| `SentLetterList`       | 동상                              | 동상                                                                |
| `ManuscriptCard`       | 동상                              | `LetterDetailClient` 가 인라인 원고지                               |
| `AccountActions`       | `src/features/mypage/components/` | `MyPageClient` 가 settings link 만 사용                             |
| `QuizIntro`            | `src/features/quiz/components/`   | **폴더 전체 dead** — quiz 흐름은 `features/ranking/` 에서 동작      |
| `QuizQuestionStep`     | 동상                              | 동상                                                                |
| `QuizResult`           | 동상                              | 동상                                                                |
| `TravelTypeShareCard`  | 동상                              | `features/ranking/components/TravelTypeShareCard` 가 실 구현        |

**작업**: `features/quiz/` 폴더 통째 삭제 + 위 7개 파일 삭제 + README "stub 53개" → "stub 16개" 갱신. **S × 1** (~30분).

### 1-2. mypage 실 구현 필요 (8개) — Phase 1

| 컴포넌트                   | 사용처                                 | 데이터 hook                                                          | 의존 mock handler                   |
| -------------------------- | -------------------------------------- | -------------------------------------------------------------------- | ----------------------------------- |
| `SavedTournamentsSection`  | `MyPageClient` "저장된 우승지"         | `useSavedTournaments` ✅                                             | `GET /mypage/tournaments` ✅        |
| `SavedTournamentCard`      | 위 섹션 카드 1개 + 삭제                | `useRemoveSavedTournament` ✅                                        | `DELETE /mypage/tournaments/:id` ❌ |
| `TournamentHistorySection` | "토너먼트 기록" InfiniteList           | **`useTournamentHistory` 신설 필요**                                 | `GET /mypage/tournament-history` ✅ |
| `LetterboxTabs`            | "편지함 4탭" received/sent/liked/saved | `useLettersInfinite` ✅ — `'saved'` 누락                             | `GET /letters/saved` ✅             |
| `LikedLettersSection`      | LetterboxTabs 의 'liked' panel         | `useLettersInfinite('liked')` ✅                                     | ✅                                  |
| `SavedLettersSection`      | LetterboxTabs 의 'saved' panel         | **client 함수 누락** — `letterApi.listSaved` 추가 + `FETCHERS.saved` | ✅                                  |
| `NicknameSection`          | 닉네임 표시 + 편집 진입점              | `useMypage` ✅ + `useUpdateNickname` ✅                              | `PATCH /mypage/profile` ❌          |
| `NicknameEditDialog`       | NicknameSection 의 모달                | `useUpdateNickname` ✅                                               | 동상                                |

**작업**: 각 M. 전체 L (4-6시간).

### 1-3. region (2개) — Phase 2

| 컴포넌트         | 사용처                                                              | 의존성                                                  |
| ---------------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| `ChungbukSvgMap` | `/region` 의 `mapPlaceholder` div 교체 + `RegionStampMap` 안 재사용 | 디자인 (SVG path 11개)                                  |
| `RegionStampMap` | `/mypage` "도장깨기"                                                | `GET /mypage/stamps` ❌ + 디자인 + "방문" 정의          |
| `RegionHero`     | `/region/[code]` 상단 hero (현재 SubHeader 만)                      | `useRegionSummary` ✅ + `GET /regions/:code/summary` ❌ |

**작업**: `ChungbukSvgMap` M (SVG asset 받은 후), 나머지 M.

### 1-4. ranking 추가 섹션 (8개) — Phase 6 (보류)

`RankingList / WeeklyTopMini / CategoryRankingTabs / RankingByRegion / RankingByTravelType / HeroDestination / SeasonalRecommendation` — README "추가 섹션은 추후" 명시. **사양 확정 시 도입**.

### 1-5. tournament / weather (2개)

| 컴포넌트                     | 비고                                                                    |
| ---------------------------- | ----------------------------------------------------------------------- |
| `SeasonalCenterIllustration` | `CenterIllustration` 의 SVG 일러스트 교체용 — **디자인 의존**           |
| `WeatherWidget`              | 홈 미배치. `useCurrentWeather` ✅ + handler ✅ — 홈에 위치 결정 후 도입 |

---

## 2. TODO / FUTURE BE 메모

### 2-1. `[FUTURE BE]` (3 화면) — Phase 3

| 위치                                                             | 작업                                                                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `tournament/play/_components/TournamentPlayClient.tsx:42-61`     | `POST /tournaments` → tournamentId 받고, match 종료마다 또는 일괄 `PATCH /complete` 전송. fire-and-forget.          |
| `tournament/result/_components/TournamentResultClient.tsx:34-72` | `?id=` 쿼리로 deep-link 진입 시 `useQuery(['tournament', id])` 분기. 현재 store-only 라 reload 시 winner 정보 손실. |
| `letter/sent/_components/LetterSentClient.tsx:11-25`             | `?id=` 쿼리 + `useLetter(id)` 로 서버 응답 사용. NICKNAME 해시 / ETA / 날짜 포맷 모두 서버 응답으로 대체.           |

**의존성**: 백엔드. **각 M**.

### 2-1-1. 이미지 카드 공유 + OG 메타 ✅ 완료

- `/api/og/[type]` Edge route — type: `tournament` / `quiz` / `destination` / `region`
- Pretendard Bold woff fetch + Edge instance 재사용 캐시 + fail 시 sans-serif fallback (route 500 회피)
- 1080×1080 PNG. Cache-Control 1일.
- **토너먼트 결과 / 퀴즈 결과**: share button → query 인코딩 → `shareWithImage` → OS share sheet (Web Share API File) + 다운로드 fallback.
- **여행지 상세 / 시군 상세**: `generateMetadata.openGraph.images` 동적 — SNS 미리보기 카드 자동.

추후 enhancement: 디자이너 시안 받으면 카드 JSX 만 교체 (route 구조 그대로).

### 2-1-2. 번들 / 렌더링 모니터링

**현재 상태** (build 결과):

| 항목                   | 값                | 판정                                               |
| ---------------------- | ----------------- | -------------------------------------------------- |
| First Load JS (shared) | 213 KB            | acceptable (Lighthouse good < 200, moderate < 300) |
| Largest shared chunk   | 59.2 KB           | react-dom                                          |
| /tournament/result     | +8.85 KB → 227 KB | OK                                                 |
| MSW chunk (lazy)       | 80 KB gzipped     | NEXT_PUBLIC_USE_MSW=false 시 download X            |

**적용된 최적화**:

- 무거운 모듈 모두 dynamic import: recharts (~100KB) / embla / MSW worker
- `optimizePackageImports`: lucide-react / recharts / embla / next-intl / @tanstack/react-query
- `experimental.staleTimes`: dynamic 30s / static 180s
- Server Component 기본, 인터랙션 부분만 client
- 위젯별 useQuery (waterfall 회피) + min-height (CLS 0)

**추가 절감 여지 X** — 핵심 chunk 들이 react-dom / TanStack Query / next-intl 등 필수. 213 KB 는 production-grade 상한.

**경계 신호 (1주 1회 점검 권장)**:

- shared First Load 가 230 KB 넘으면 alert
- 새 위젯 도입 시 dynamic import 강제
- `npm run analyze` 로 chunk 별 시각화

**향후 작업**:

- `size-limit` config 추가 — 임계 자동 검증 (package.json 의 `"size-limit": [...]` + `@size-limit/preset-app` plugin)
- Lighthouse CI baseline warn → error 전환

### 2-2. TODO 주석 (페이지 placeholder)

| 위치                                       | 작업                                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `HomeDashboard.tsx`                        | "내 우승지 캐러셀" — 현재 주석으로 비활성화 (사용자 요청). 재오픈 시 `useSavedTournaments` + Carousel.             |
| `MyPageClient.tsx:35, 41, 49, 55`          | 4섹션 placeholder — Phase 1 에서 일괄                                                                              |
| `RegionMapClient.tsx:29`                   | `ChungbukSvgMap` 신설 (Phase 2)                                                                                    |
| `ProfileCard.tsx:43`                       | `mypageApi.updateAvatar(file)` mutation — multipart + 스토리지(Vercel Blob/S3) 결정 필요. **백엔드 + 인프라 의존** |
| `AccountActionsSection.tsx:42`             | 회원 탈퇴 — `ConfirmDialog` + `DELETE /me`. soft delete 정책 백엔드와 합의                                         |
| `policy/{terms,privacy,licenses}/page.tsx` | 본문은 법무 검토 후 교체. 라이선스는 빌드 시 `license-checker` 결과                                                |

### 2-3. "추후" / "미구현" 주석

| 위치                       | 내용                                                               |
| -------------------------- | ------------------------------------------------------------------ |
| `SettingsClient.tsx:4, 37` | 언어 섹션 미노출 (사용자 요청). LanguageSwitcher 보존              |
| `ConceptStep.tsx`          | 일러스트 디자인 확정 후 교체                                       |
| `CenterIllustration.tsx`   | emoji → SVG 일러스트 교체 가능                                     |
| `RecommendationBanner.tsx` | mock → `useRecommendations()` 교체 (추천 알고리즘 결정 필요)       |
| `FestivalCarousel.tsx`     | mock → `useOngoingFestivals()` 교체. hook + handler 준비됨 — **S** |
| `TravelTypeShareCard.tsx`  | 이미지 추출(`next/og` ImageResponse) 추후                          |

---

## 3. 인프라 있지만 UI 미연결

| 인프라                                               | 상태    | 미연결 사용처                                                     |
| ---------------------------------------------------- | ------- | ----------------------------------------------------------------- |
| `useSavedTournaments`                                | ✅      | mypage / 홈 캐러셀 (홈은 보류)                                    |
| `useRemoveSavedTournament`                           | ✅      | `SavedTournamentCard` 삭제 버튼                                   |
| `useOngoingFestivals`                                | ✅      | `FestivalCarousel` 이 mock 사용 중                                |
| `useCurrentWeather`                                  | ✅      | `WeatherWidget` stub                                              |
| `useUpdateNickname`                                  | ✅      | `NicknameEditDialog` stub                                         |
| `useQuizQuestions / useMyQuizResult / useSubmitQuiz` | ❌ dead | **삭제** (Phase 0)                                                |
| `letterApi.listSaved` / `FETCHERS.saved`             | ❌ 누락 | LetterboxTabs 'saved' 탭                                          |
| `useTournamentHistory`                               | ❌ 부재 | `TournamentHistorySection`                                        |
| `getBlurDataURL` (LCP placeholder)                   | ✅      | LCP 후보 (BE imageUrl 연동 시점) — 현재 코드는 emoji/colorChip 만 |

---

## 4. 백엔드 의존 작업

### 4-1. mock 에 없는 endpoint (실 백엔드 계약과 동시 정의 필요)

| Endpoint                                      | 호출 처                      | 우선                             |
| --------------------------------------------- | ---------------------------- | -------------------------------- |
| `GET /mypage` (요약)                          | `mypageApi.getSummary`       | **높음** — mypage 위젯 전체 의존 |
| `PATCH /mypage/profile`                       | `useUpdateNickname`          | 높음                             |
| `GET /mypage/stamps`                          | `RegionStampMap` (stub)      | 중간                             |
| `GET /regions/:code/summary`                  | `useRegionSummary`           | 높음                             |
| `GET /regions/ongoing-festivals`              | `useOngoingFestivals`        | 중간                             |
| `GET /rankings?type=recommended\|hidden-gems` | `useRecommendedDestinations` | 낮음                             |
| `DELETE /mypage/tournaments/:id`              | `useRemoveSavedTournament`   | 중간                             |
| `DELETE /me`                                  | 회원 탈퇴                    | 운영 전 필수                     |

**작업**: handler 6-7개 추가 — 총 **M** (mock seed 재활용).

### 4-2. 인증 redirect 임시 비활성 (운영 전 필수)

- **위치**: `middleware.ts:46-58` 의 주석 블록.
- **작업**: 백엔드 붙는 시점에 주석 해제 + E2E 시나리오로 검증. **S + M**.

### 4-3. 푸시 알림 NestJS 작업 — Phase 4

| 작업                                                         | 비고                                                                   |
| ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `npm i web-push @types/web-push` + `webpush.setVapidDetails` | NestJS module 셋업                                                     |
| Subscription DB 스키마                                       | `{ userId, endpoint, p256dh, auth, createdAt, lastUsedAt, userAgent }` |
| `POST /notifications/subscribe / unsubscribe` 실 구현        | 현재 mock 은 단순 ack                                                  |
| 새 편지 도착 hook → `webpush.sendNotification`               | payload 형태는 `sw.ts` 의 push handler 와 일치                         |
| `410 Gone` subscription 자동 cleanup                         |                                                                        |
| VAPID 키 발급 + 환경변수 셋업                                | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (FE) / `VAPID_PRIVATE_KEY` (BE)         |

**작업량**: L.

### 4-4. 인증 보안 (README 명시) — Phase 5

- 비밀번호 해싱 (argon2/bcrypt)
- 중복 검사 (아이디/이메일/폰)
- find-id / forgot-password 계정 열거 방지
- 재설정 토큰 단명·1회용·DB 저장
- 메일 발송 (Resend / SES / SMTP)
- Rate limit (README 표대로: login 분당 5/IP, refresh, letters, location/reverse 등)
- CSRF Layer 1 (SameSite=Lax) + Layer 2 (Origin 검증)

---

## 5. PWA / 알림 / 위치 후속

### 5-1. 위치 권한 — 잔여 edge case (낮음)

- GPS + IP 둘 다 실패 시 사용자 피드백 보강 (현재 silent track only)
- 권한 거부 후 OS 설정 재허용 흐름 안내
- iOS background → 복귀 시 좌표 stale 검증

### 5-2. SW 업데이트 — 운영 전 검증

- ✅ `PwaUpdateBanner` + `SKIP_WAITING` + `clearAllCaches()`
- **남은 작업**: 운영 빌드 실기기 매뉴얼 검증 (오프라인 / 업데이트 배너 / 푸시 / 설치). **M**.

### 5-3. 푸시 — 클라이언트 잔여

- 권한 거부 후 재요청 UX (iOS OS 설정 안내)
- Subscription expire 자동 갱신
- `MockPushTrigger` 운영 build 에서 자동 미노출 검증 (`MSW_ENABLED` 분기 ✅)

---

## 6. 테스트 커버리지

### 6-1. 현재 vitest (총 14개 — 주로 schema / lib / store)

스키마: auth (4) / letter / nickname / user.
lib: async / clipboard / csp / sentry-scrub / validation.
컴포넌트: LocationPermissionPrompt (1개만).
훅: use-format.
스토어: location-store.

### 6-2. E2E (Playwright)

- `e2e/smoke.spec.ts` — (1) 미인증 → /login (2) /login 로드 (3) /api/health
- ✅ `e2e/pages-smoke.spec.ts` — 13개 주요 경로 진입 + 가로 overflow 검증 + 핵심 element 노출
- ✅ `e2e/og-routes.spec.ts` — `/api/og/*` 4 type (tournament/quiz/destination/region) PNG 응답
- ✅ `e2e/interactions.spec.ts` — 위젯 라우팅 (여행지 vs 지역), 카테고리 'local' 미노출, 알림함, 홈 빠른시작

Projects (4): desktop-chrome (1280×720) / mobile-chrome (Pixel 7) / mobile-safari (iPhone 14) / mobile-pwa (iPhone 14 standalone)

### 6-3. 미커버 핵심 도메인 — Phase 5

| 도메인                                                         | 우선 작성 | 작업량 |
| -------------------------------------------------------------- | --------- | ------ |
| `tournament-store` persist + sessionStorage 백업               | 높음      | M      |
| `Bracket.tsx` (매치 진행 / dedup / 라운드 빌드)                | 높음      | M      |
| `bracket.ts` 유틸 (Fisher-Yates / pairRound)                   | 높음      | S      |
| `useLettersInfinite` optimistic toggle (like/save)             | 높음      | M      |
| `useToggleLikeLetter` 롤백                                     | 중간      | M      |
| `AuthBootstrap` 4가지 redirect 분기                            | 중간      | M      |
| `usePushNotification` 모든 상태 (unsupported/denied/no-SW/...) | 중간      | M      |
| `RegionDetailTabs` mount 유지 + prefetch                       | 중간      | M      |

### 6-4. E2E 시나리오 확장 — Phase 5

- [ ] 온보딩 3-step
- [ ] 편지 작성 → /letter/sent
- [ ] 위치 권한 5종 매트릭스
- [ ] 토너먼트 setup → play → result
- [ ] Push prompt → mock trigger → 알림 클릭

### 6-5. coverage include 확장

현재 `vitest.config.ts` 의 `coverage.include` 가 schemas + lib + use-format + store 만 가리킴. Phase 1-2 신규 컴포넌트 / 핵심 도메인 hook 추가.

---

## 7. 디자인 / UI 후속

### 7-1. STYLES.md 가이드 부합도

`docs/STYLE_AUDIT.md` (갱신 2026-05-30) 기준: **raw 잔존 0**. 의도된 unique 3건만 (`ComposeEntryCard` drop-shadow / `LuckyLadder` glow). 대규모 sweep 완료.

남은 정비:

- `<button>` 38곳 → 단일 사용처 다수, 새 위젯 작성 시 mixin 추출 권장.

### 7-2. dark mode

- ✅ 모든 토큰 + 시즌 / 카테고리 / chart-2~8 dark 분기 완료.
- ❌ **명시적 테마 토글 미구현** — 현재 `prefers-color-scheme` 자동만. 사용자 직접 토글 + localStorage 영속화. **M** (사용자 요청 시).

### 7-3. mobile 360 미검증

- ✅ mobile-360 토큰 + `FestivalCarousel` responsive slidesPerView.
- 위젯 구현 시 동시 검증 필요: `RegionStampMap` 11시군 라벨 / `SavedTournamentsSection` 그리드 / `LetterboxTabs` segmented control / `TournamentHistorySection` row.

---

## 8. README vs 실제 코드 차이 (Phase 0)

README 의 "현재 구현 상태" 갱신 필요:

- 토너먼트 전체 (setup/play/result): 🟡 → ✅ (BE 미연결 한정)
- letter 목록/상세: 🟡 → ✅ (`saved` 탭 제외)
- region 상세 탭: 🟡 → ✅
- 홈 위젯: 3/5 → 2/3 (편지/우승지 미노출 정책 반영)
- stub 개수: 53 → **16** (Phase 0 청소 후)

---

## Phase 별 권장 작업 순서

### Phase 0 — 청소 (반나절)

1. `features/quiz/` 폴더 삭제 (4 파일 + hook + api)
2. dead spec 7 파일 삭제 (1-1 표)
3. README "현재 구현 상태" 갱신
4. `letterApi.listSaved` + `FETCHERS.saved` 보강
5. `useTournamentHistory` hook + `tournamentApi.listHistory` 추가

### Phase 1 — mypage 위젯 (반나절 ~ 1일)

6. mock handler 6개 보강 (`GET /mypage`, `PATCH /mypage/profile`, `GET /mypage/stamps`, `GET /regions/:code/summary`, `GET /regions/ongoing-festivals`, `DELETE /mypage/tournaments/:id`)
7. `SavedTournamentsSection` + `SavedTournamentCard` + 삭제 ConfirmDialog
8. `LetterboxTabs` (Letter index tabs 패턴 재사용)
9. `TournamentHistorySection` InfiniteList
10. `NicknameSection` + `NicknameEditDialog`

### Phase 2 — 홈 위젯 + 지도 (1일)

11. `ChungbukSvgMap` (디자인 SVG asset 필요)
12. `RegionStampMap` (위 + `/mypage/stamps`)
13. `WeatherWidget` 구현 + 홈 배치 결정
14. `FestivalCarousel` 을 `useOngoingFestivals` 로 교체 (mock → 실 hook)

### Phase 3 — BE 연동 시 일괄 (백엔드 붙는 시점)

15. middleware 인증 redirect 주석 해제
16. TournamentPlayClient — `POST /tournaments`
17. TournamentResultClient — `?id=` deep-link
18. LetterSentClient — `?id=` + `useLetter`
19. ProfileCard updateAvatar (multipart + 스토리지)
20. 회원 탈퇴 (`DELETE /me` + confirm)

### Phase 4 — 푸시 운영 (NestJS)

21. NestJS web-push 셋업 + subscription DB
22. 새 편지 도착 hook → push 발송
23. VAPID 키 발급 + 환경변수

### Phase 5 — 보안 / 성능 / 테스트 마무리

24. CSP enforce 전환 (Report-Only 1-2주 모니터링 후)
25. 인증 보안 백엔드 (해싱 / rate limit / CSRF / 메일)
26. E2E 시나리오 확장
27. vitest 핵심 도메인 테스트 작성
28. iOS Safari 17+ 실기기 검증
29. Lighthouse CI baseline warn → error
30. LCP 이미지 `getBlurDataURL()` 적용
31. 리스트 Link prefetch=false 정책 적용

### Phase 6 — 선택 작업 (필요 시점)

- 명시적 테마 토글 (next-themes 또는 자체)
- 만 14세 확인 step 추가
- `@sentry/nextjs` client lazy-load
- `@tanstack/react-virtual` (편지함 1000+ 시)
- `config.count` step 폐기 결정
- `features/ranking/` 의 travel-type 코드를 `features/quiz/` 로 이전 (반대 방향)

---

## 부록: 의존성 매트릭스

| 작업                   | 백엔드                                       | 디자인                   | 다른 작업      |
| ---------------------- | -------------------------------------------- | ------------------------ | -------------- |
| Phase 0                | —                                            | —                        | —              |
| Phase 1                | mock handler 추가 (실 백엔드 계약 동시 정의) | —                        | —              |
| Phase 2 ChungbukSvgMap | —                                            | SVG asset (11 시군 path) | —              |
| Phase 2 RegionStampMap | `/mypage/stamps` + "방문" 정의               | —                        | ChungbukSvgMap |
| Phase 2 WeatherWidget  | `/weather/current` ✅ + 추천 알고리즘        | —                        | —              |
| Phase 3 전체           | NestJS 라우트 다수                           | —                        | Phase 1        |
| Phase 4                | NestJS web-push + DB                         | —                        | VAPID 키       |
| Phase 5 보안           | rate limit / CSRF / 메일                     | —                        | Phase 3        |
| 정책 페이지 본문       | 법무 검토                                    | —                        | —              |
| 명시 테마 토글         | —                                            | 디자인 컬러 검증         | —              |

---

## 핵심 발견 요약

1. **stub 27개** (README 53개는 부정확). 11개는 dead spec → 삭제 후보.
2. **`features/quiz/` 폴더 dead** — 실 quiz 흐름은 `features/ranking/` 에서 동작.
3. **README 정확도 낮음** — 토너먼트 / letter 목록·상세 / region 상세 탭이 실제론 ✅.
4. **mypage mock 환경에서 깨질 위험** — `GET /mypage` 등 핵심 handler 부재.
5. **letter `'saved'` 일관성 버그** — handler/seed 는 있는데 client 함수 누락.
6. **운영 직전 필수**: `middleware.ts:46-58` 인증 redirect 주석 해제.
7. **핵심 BE 작업**: `POST /tournaments` + `?id=` deep-link — 3 화면 (play/result/sent) 이 store-only 라 reload 시 데이터 손실.
8. **테스트 미커버**: 토너먼트 store / Bracket / letter optimistic / AuthBootstrap / push 5종 — coverage include 도 분모에서 빠진 상태.
