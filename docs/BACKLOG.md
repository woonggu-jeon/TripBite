# TripBite 후속 작업 백로그

> 코드베이스 전수조사 후 정리한 잔존 / 개선 항목. 분기점마다 갱신.
> 마지막 갱신: 2026-06-02 — Phase 0~2 완료, Phase 5/6 일부 완료, share Desktop fallback / iOS appearance fix 반영.
>
> 작업량 표기: **S** (≤30분) · **M** (1-3시간) · **L** (반나절+)

---

## 최근 완료 (2026-06-01 ~ 06-02)

### 코드

- ✅ **Phase 0 dead code 청소** — `features/quiz/` 폴더 + dead spec 7 파일 삭제, letter `'saved'` 일관성, `useTournamentHistory` 신설
- ✅ **Phase 1 mypage 위젯 4종** — NicknameSection (zod + dialog), SavedTournaments + Card (confirm 삭제), TournamentHistorySection, LetterboxTabs (4탭 lazy + prefetch)
- ✅ **Phase 2 도장깨기** — `ChungbukSvgMap` (5×3 grid SVG), `RegionStampMap` + `/mypage/stamps` mock, 진행률
- ✅ **Phase 2 FestivalCarousel** — mock → `useOngoingFestivals` 교체, region 별 tone/emoji 매핑
- ✅ **Phase 5 middleware 복원** — `src/middleware.ts` 이전 + `PUBLIC_ACCESS_PATHS`. mock 환경 (`USE_MSW=true`) 한정 redirect skip 추가
- ✅ **Phase 5 axe-core a11y E2E** — 6 페이지 serious/critical 0건 (color-contrast 제외)
- ✅ **Phase 5 toHaveScreenshot 시각 회귀** — 4 페이지 × 2 모드 × 6 플랫폼 = 48 baseline
- ✅ **Phase 5 size-limit** — shared First Load 230kB / recharts 120kB / msw 100kB 임계
- ✅ **Phase 5 Lighthouse CI** — a11y/CLS error 격상, seo warn
- ✅ **Phase 5 vitest 단위 6 파일 (49 cases)** — bracket / tournament-store / Bracket.tsx / use-letters / AuthBootstrap / use-push-notification
- ✅ **Phase 5 E2E 확장** — mobile-360 / 위치 권한 5종 / 토너먼트 풀 / push prompt
- ✅ **Phase 6 명시 테마 토글** — light/dark/system + ui-store persist + Settings UI
- ✅ **Phase 6 만 14세 onboarding step** — 정보통신망법 자기확인 체크박스
- ✅ **iOS Safari/PWA 토너먼트 선택 테두리 사라짐 fix** — `_reset.scss` button 에 `appearance:none`
- ✅ **이미지 카드 공유 카카오톡 채팅 첨부 흐름 fix** — `shareWithImage` payload file 단독
- ✅ **이미지 카드 공유 Desktop fallback 강화** — file share 미지원 시 OG URL clipboard copy + PNG 다운로드 동시
- ✅ **6 플랫폼 매트릭스 확장** — Windows / Mac / AOS web / iOS web / AOS PWA / iOS PWA

### 인프라 / 문서

- ✅ **README 현재 구현 상태 갱신** — stub 53 → 16, 토너먼트/letter/region ✅
- ✅ **결과서 8차** — `docs/test-reports/2026-06-01-e2e.md` (244 → 404 passed, 0 failed)
- ✅ **번들 모니터링** — First Load 213 KB acceptable, 1주 1회 분석 권장

---

## 우선 순위 한눈에

| Phase      | 영역                                     | 의존성                            | 작업량   |
| ---------- | ---------------------------------------- | --------------------------------- | -------- |
| **2 잔여** | 정밀 ChungbukSvgMap path / WeatherWidget | 디자인 (SVG asset / 시안)         | M × 2    |
| **3**      | Future BE 포인트 일괄 연동               | NestJS                            | M × 5    |
| **4**      | 푸시 알림 운영 진입                      | NestJS web-push + DB              | L × 1    |
| **5 잔여** | 인증 보안 / CSP enforce / 정책 본문      | 백엔드 (rate limit / 메일) + 법무 | M-L 다수 |
| **6**      | UX 작은 개선 / 선택 작업                 | —                                 | S-M 다수 |

---

## 1. Stub 컴포넌트 잔존 (의도 보류)

Phase 0~2 청소 후 stub 16개 중 의도 보류만 남음:

### 1-1. ranking 추가 섹션 (8개) — 사양 대기

`RankingList / WeeklyTopMini / CategoryRankingTabs / RankingByRegion / RankingByTravelType / HeroDestination / SeasonalRecommendation` — README "추가 섹션은 추후" 명시. **사양 확정 시 도입**.

### 1-2. tournament / weather (2개) — 디자인 또는 사양 대기

| 컴포넌트                     | 비고                                                                    |
| ---------------------------- | ----------------------------------------------------------------------- |
| `SeasonalCenterIllustration` | `CenterIllustration` 의 SVG 일러스트 교체용 — **디자인 의존**           |
| `WeatherWidget`              | 홈 미배치. `useCurrentWeather` ✅ + handler ✅ — 홈에 위치 결정 후 도입 |

### 1-3. region (1개) — 디자인 의존

`RegionHero` — `/region/[code]` 상단 hero (현재 SubHeader 만). `useRegionSummary` ✅ + 디자인 시안 대기.

### 1-4. ChungbukSvgMap 정밀 path — 디자인 의존

현재 5×3 grid 도식 SVG (의도된 단순화). 운영 진입 전 디자이너 SVG asset (11 시군 path) 받으면 교체.

---

## 2. TODO / FUTURE BE 메모

### 2-1. `[FUTURE BE]` (3 화면) — Phase 3

| 위치                                                       | 작업                                                                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `tournament/play/_components/TournamentPlayClient.tsx`     | `POST /tournaments` → tournamentId 받고, match 종료마다 또는 일괄 `PATCH /complete` 전송. fire-and-forget.          |
| `tournament/result/_components/TournamentResultClient.tsx` | `?id=` 쿼리로 deep-link 진입 시 `useQuery(['tournament', id])` 분기. 현재 store-only 라 reload 시 winner 정보 손실. |
| `letter/sent/_components/LetterSentClient.tsx`             | `?id=` 쿼리 + `useLetter(id)` 로 서버 응답 사용. NICKNAME 해시 / ETA / 날짜 포맷 모두 서버 응답으로 대체.           |

**의존성**: 백엔드. **각 M**.

### 2-2. TODO 주석 (페이지 placeholder)

| 위치                                       | 작업                                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `HomeDashboard.tsx`                        | "내 우승지 캐러셀" 주석 비활성 (사용자 요청). 재오픈 시 `useSavedTournaments` + Carousel.                          |
| `ProfileCard.tsx`                          | `mypageApi.updateAvatar(file)` mutation — multipart + 스토리지(Vercel Blob/S3) 결정 필요. **백엔드 + 인프라 의존** |
| `AccountActionsSection.tsx`                | 회원 탈퇴 — `ConfirmDialog` + `DELETE /me`. soft delete 정책 백엔드와 합의                                         |
| `policy/{terms,privacy,licenses}/page.tsx` | 본문은 법무 검토 후 교체. 라이선스는 빌드 시 `license-checker` 결과                                                |

### 2-3. "추후" / "미구현" 주석

| 위치                       | 내용                                                         |
| -------------------------- | ------------------------------------------------------------ |
| `SettingsClient.tsx`       | 언어 섹션 미노출 (사용자 요청). LanguageSwitcher 보존        |
| `ConceptStep.tsx`          | 일러스트 디자인 확정 후 교체                                 |
| `CenterIllustration.tsx`   | emoji → SVG 일러스트 교체 가능                               |
| `RecommendationBanner.tsx` | mock → `useRecommendations()` 교체 (추천 알고리즘 결정 필요) |
| `TravelTypeShareCard.tsx`  | 이미지 추출(`next/og` ImageResponse) 추후                    |

---

## 3. 인프라 있지만 UI 미연결

| 인프라                             | 상태 | 미연결 사용처                                          |
| ---------------------------------- | ---- | ------------------------------------------------------ |
| `useCurrentWeather`                | ✅   | `WeatherWidget` stub (배치 결정 대기)                  |
| `getBlurDataURL` (LCP placeholder) | ✅   | BE imageUrl 연동 시점 — 현재 코드는 emoji/colorChip 만 |

---

## 4. 백엔드 의존 작업

### 4-1. mock 에 없는 endpoint (실 백엔드 계약 동시 정의)

| Endpoint                                      | 호출 처                      | 우선         |
| --------------------------------------------- | ---------------------------- | ------------ |
| `GET /regions/:code/summary`                  | `useRegionSummary`           | 높음         |
| `GET /rankings?type=recommended\|hidden-gems` | `useRecommendedDestinations` | 낮음         |
| `DELETE /me`                                  | 회원 탈퇴                    | 운영 전 필수 |

> Phase 5 에서 `/mypage/*`, `/letters/*`, `/regions/ongoing-festivals`, `/mypage/stamps`, `/mypage/profile`, `/mypage/tournaments` 등 mock 모두 신설됨.

### 4-2. 푸시 알림 NestJS 작업 — Phase 4

| 작업                                                         | 비고                                                                   |
| ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `npm i web-push @types/web-push` + `webpush.setVapidDetails` | NestJS module 셋업                                                     |
| Subscription DB 스키마                                       | `{ userId, endpoint, p256dh, auth, createdAt, lastUsedAt, userAgent }` |
| `POST /notifications/subscribe / unsubscribe` 실 구현        | 현재 mock 은 단순 ack                                                  |
| 새 편지 도착 hook → `webpush.sendNotification`               | payload 형태는 `sw.ts` 의 push handler 와 일치                         |
| `410 Gone` subscription 자동 cleanup                         |                                                                        |
| VAPID 키 발급 + 환경변수 셋업                                | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (FE) / `VAPID_PRIVATE_KEY` (BE)         |

**작업량**: L.

### 4-3. 인증 보안 — Phase 5

- 비밀번호 해싱 (argon2/bcrypt)
- 중복 검사 (아이디/이메일/폰)
- find-id / forgot-password 계정 열거 방지
- 재설정 토큰 단명·1회용·DB 저장
- 메일 발송 (Resend / SES / SMTP)
- Rate limit (login 분당 5/IP, refresh, letters, location/reverse 등)
- CSRF Layer 1 (SameSite=Lax) + Layer 2 (Origin 검증) ✅ middleware 에 일부 구현됨

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

### 6-1. vitest 단위 (총 122개 — 21 files)

신규 49 cases 추가 후 합계 122. 핵심 도메인 모두 커버:

- `bracket.ts` (23) — Fisher-Yates / pairRound / nextPow2 / roundLabelKey
- `tournament-store.ts` (7) — persist + partialize
- `Bracket.tsx` (5) — 1/2/3/4 인 매치 시나리오
- `use-letters.ts` (4) — like/save optimistic + 롤백
- `AuthBootstrap.tsx` (5) — 4 redirect 분기
- `use-push-notification.ts` (5) — 5 상태
- 기존: schemas / lib / store / use-format / LocationPermissionPrompt

### 6-2. E2E Playwright (총 420 cases — 6 projects × 70 cases)

- ✅ `e2e/pages-smoke.spec.ts` — 14 페이지 진입 + 가로 overflow + 핵심 element
- ✅ `e2e/og-routes.spec.ts` — `/api/og/*` 4 type PNG 응답
- ✅ `e2e/interactions.spec.ts` — 위젯 라우팅 / 'local' 미노출 / 알림함
- ✅ `e2e/flows.spec.ts` — 온보딩 / 편지 작성 / 토너먼트 random / 알림
- ✅ `e2e/smoke.spec.ts` — middleware redirect / health
- ✅ `e2e/a11y.spec.ts` — axe-core 6 페이지 serious/critical 0
- ✅ `e2e/visual.spec.ts` — toHaveScreenshot 4 페이지 × 2 모드 × 6 projects
- ✅ `e2e/mobile-360.spec.ts` — 360 viewport 4 페이지 (desktop override)
- ✅ `e2e/location-permission.spec.ts` — granted/prompt/denied/IP fallback/실패 5종
- ✅ `e2e/tournament-full.spec.ts` — random/season 흐름 진입 + 시작 활성
- ✅ `e2e/push-flow.spec.ts` — 알림 dropdown + MockPushTrigger trial

Projects (6): `desktop-windows` / `desktop-mac` / `mobile-chrome-aos` / `mobile-safari-ios` / `mobile-pwa-aos` / `mobile-pwa-ios`

### 6-3. 향후 보강 후보

- `RegionDetailTabs` mount 유지 + prefetch unit
- `useToggleLikeLetter` 의 onSettled invalidation 검증
- `MockPushTrigger` 운영 build 미노출 unit
- 이미지 공유 환경별 분기 unit (canShare mock)

---

## 7. 디자인 / UI 후속

### 7-1. STYLES 가이드 부합도

`docs/STYLES.md` 5번 섹션 "현재 적용 현황" — 대규모 sweep 완료. raw 잔존 0.

### 7-2. dark mode

- ✅ 모든 토큰 + 시즌 / 카테고리 / chart-2~8 dark 분기
- ✅ **명시 테마 토글 구현 완료** (light/dark/system + localStorage persist)

### 7-3. mobile 360 검증

- ✅ E2E mobile-360.spec.ts 가 / /mypage /letter /region/cheongju /tournament 4 페이지 360 overflow 검증
- ✅ FestivalCarousel responsive slidesPerView / RegionStampMap label 축소 / Letterbox segmented
- 새 위젯 작성 시 360 검증 추가

### 7-4. color-contrast a11y warn 해소 (디자인 sweep)

`docs/test-reports/2026-06-01-e2e.md` 의 a11y 매트릭스 `color-contrast` 가 disabled. 운영 진입 전 디자인 시안 받아 시즌 accent / 카드 footer 색 대비 4.5:1+ 로 보강.

---

## 8. Phase 별 권장 작업 순서

### Phase 3 — BE 연동 시 일괄 (백엔드 붙는 시점)

1. TournamentPlayClient — `POST /tournaments`
2. TournamentResultClient — `?id=` deep-link
3. LetterSentClient — `?id=` + `useLetter`
4. ProfileCard updateAvatar (multipart + 스토리지)
5. 회원 탈퇴 (`DELETE /me` + confirm)
6. `GET /regions/:code/summary` 연동 — RegionHero 도입

### Phase 4 — 푸시 운영 (NestJS)

7. NestJS web-push 셋업 + subscription DB
8. 새 편지 도착 hook → push 발송
9. VAPID 키 발급 + 환경변수

### Phase 5 — 보안 / 운영 진입

10. CSP enforce 전환 (Report-Only 1-2주 모니터링 후)
11. 인증 보안 백엔드 (해싱 / rate limit / CSRF / 메일)
12. iOS Safari 17+ 실기기 검증
13. Lighthouse CI baseline warn → error 강화
14. LCP 이미지 `getBlurDataURL()` 적용 (BE imageUrl 후)
15. color-contrast a11y 디자인 sweep

### Phase 6 — 선택 작업 (필요 시점)

- `@sentry/nextjs` client lazy-load
- `@tanstack/react-virtual` (편지함 1000+ 시)
- 단축 URL 서비스 (OG image URL 너무 길어짐)
- 카카오링크 SDK 통합 (카톡 공유 UX 강화)

---

## 부록: 의존성 매트릭스

| 작업                        | 백엔드                   | 디자인                   | 다른 작업 |
| --------------------------- | ------------------------ | ------------------------ | --------- |
| Phase 2 정밀 ChungbukSvgMap | —                        | SVG asset (11 시군 path) | —         |
| Phase 2 WeatherWidget       | `/weather/current` ✅    | 시안                     | —         |
| Phase 3 전체                | NestJS 라우트 다수       | —                        | —         |
| Phase 4                     | NestJS web-push + DB     | —                        | VAPID 키  |
| Phase 5 보안                | rate limit / CSRF / 메일 | —                        | Phase 3   |
| 정책 페이지 본문            | —                        | —                        | 법무 검토 |
| color-contrast sweep        | —                        | 색상 검증                | —         |

---

## 핵심 발견 요약 (2026-06-02 시점)

1. **stub 53 → 11 (현재)** — Phase 0~2 청소 + 위젯 구현 완료. 잔존 11 = ranking 추가 섹션 8 + WeatherWidget + SeasonalCenterIllustration + RegionHero (모두 디자인/사양 의존).
2. **`features/quiz/` 폴더 dead** — 실 quiz 흐름은 `features/ranking/` 에서 동작. (삭제 완료)
3. **mock 환경 middleware skip** — `USE_MSW=true` 시 모든 페이지 접근 가능. 운영은 그대로.
4. **6 플랫폼 E2E + 48 visual baseline** — 레이아웃/CSS 깨짐 자동 검출.
5. **핵심 BE 작업**: `POST /tournaments` + `?id=` deep-link — 3 화면 (play/result/sent) 이 store-only 라 reload 시 데이터 손실.
6. **iOS Safari button appearance** 회귀 fix 완료 — 모든 button 기반 card border 일관 노출.
7. **이미지 공유** — 모바일 file share + Desktop URL+download fallback 자동 분기. 카톡 채팅 첨부 정상.
