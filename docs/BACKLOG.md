# TripBite 후속 작업 백로그

> 코드베이스 전수조사 후 정리한 잔존 / 개선 항목. 분기점마다 갱신.
> 마지막 갱신: 2026-06-10
>
> 작업량 표기: **S** (≤30분) · **M** (1-3시간) · **L** (반나절+)

---

## 최근 완료

이미 dev 에 머지된 항목 이력은 `git log` 참조 (commit message 가 1차 source of truth).
주요 마일스톤만 요약:

- Phase 0~2 — dead code 청소, mypage 위젯, 도장책, region/destination 상세
- Phase 5 — middleware 복원, axe a11y, 시각 회귀 48 baseline, vitest 123, size-limit, Lighthouse CI
- Phase 6 일부 — 명시 테마 토글, 만 14세 step, sticky 헤더 fix
- 6 플랫폼 매트릭스 — Windows / Mac / AOS web / iOS web / AOS PWA / iOS PWA
- 이미지 공유 — 카톡 file 단독 + Desktop URL clipboard + PNG 다운로드 fallback
- 마이페이지 — 프로필 avatar 단일 button, 도장책 배너 + `/mypage/stamps` 정밀 지도 + Sage 톤 + 11/11 마스터 OG 카드 공유, 저장 우승지 가로 Carousel (최대 10) + 헤더 전체보기, 최근 토너먼트 우승지명
- 설정 — 닉네임/비밀번호 모달 통합. 테마/푸시/인앱/문의/오픈소스 라이센스 미노출
- destination — 길찾기 provider 중립 ("길찾기" 라벨, 카카오 URL 내부), 액션 row 위치 최하단, 다른 여행지 Carousel UI
- Auth — 진입 보호 좁힘 (mypage/settings/letter 만), `useRequireAuth` confirm + redirect, mock 로그인 toggle dev 도구
- UI primitive 추출 — `DestinationCard`, `AsyncSection`, `useResponsiveSlidesPerView`, `useShareCard`, emoji-map 상수, Chip xs variant
- API 보강 (BE Swagger 도입 대비) — zod 10 endpoint + safeParseResponse + 에러 normalize interceptor + `/me` 단일화 + 합의 체크리스트
- **2026-06-05**: BE 실 구현 (Swagger SoT) 와 FE 정합 — sessionID 단일 쿠키 / detail spec (`summary`/`restDate`/`parking`) / User 응답 (`username`/`avatarUrl`/`travelType`) / seed id `tour-<contentid>` / `DELETE /me` / weather 폐기
- **2026-06-05**: 알림함 페이지화 — `/notifications` 신규, dropdown 폐기, cursor 무한스크롤 + 헤더 badge 분리 hook, `security` 알림 type 추가
- **2026-06-05**: 무한스크롤 회귀 fix — `useIntersection` callback ref 전환 (region/letter/mypage/notifications 일괄)
- **2026-06-05**: 토너먼트 흐름 정정 — setup → map(시군 random pick) → tournamentSize → fetch → bracket, 매치업/우승 카드 imageUrl + emoji fallback, 빈 풀 EmptyState, 계절 hint
- **2026-06-05**: 카드 일관성 — DestinationCard.name 3줄 clamp + min-height, region contents limit 20→10
- **2026-06-05**: 회원 탈퇴 mutation 연결 — `DELETE /me` + clearAuth + SW cache clear + 홈 redirect
- **2026-06-05**: 프로필 avatar 업로드/제거 — `POST/DELETE /me/avatar` (R2 multipart) + axios FormData 자동 처리 interceptor
- **2026-06-05**: letter/sent 익명화 — To 단일 라벨 + 도착 추상 표현, dead code 정리
- **2026-06-06**: orval 마이그 10 features — auth/mypage/notification/letter/region/ranking/tournament/settings/onboarding/location 모두 generated client 사용. mutator 가 res.data 자동 unwrap. 수동 axios/zod 일괄 폐기 (`safeParseResponse` + 5 response schemas + `lib/schemas/common` 삭제). 변경 코드 약 600줄 순감.
- **2026-06-06**: BE swagger enum 정합 — Season / DestinationCategory / RegionCode (11 시군) / AppNotificationType / TournamentSize / ThemeKind / TravelTypeCode 모두 generated. `Omit + intersection` / `as cast` 패턴 일괄 폐기. Destination/DestinationDetail/SavedTournament/TournamentRecord/TravelType 모두 DTO alias.
- **2026-06-07**: 보안 패치 + e2e 회귀 — vitest 3→4.1.8 / next-intl 3→4.13 (UI server CVE). 알림 dropdown→/notifications 페이지화 e2e 5건 fix. 잔여 FE security = 0.
- **2026-06-07**: 폼 입력 primitive 추출 — `TextField` (label + input + error + a11y 자동 연결) 신설. 7 auth form (Login/Signup/FindId/Forgot/Reset/ChangePassword) + onboarding NicknameStep + settings NicknameEditDialog 8개 갈음. `AuthForm.module.scss` 의 .field/.label/.input/.error 흡수, `ForgotPasswordForm` 의 i18n `signup.errors` 차용을 `forgotPassword.errors` 자기 namespace 로 분리. aria-invalid 표현 boolean→undefined 통일 (axe lint false-positive 해소). 코드 약 100줄 순감.
- **2026-06-07**: UI primitive 2종 추가 — `MediaThumb` (secureImageUrl + next/image fill + emoji fallback) 5 사용처 흡수 (DestinationCard/MatchupCard/WinnerCard/RegionContentRow/RecommendationBanner.Slide), `RadioGroup` + `RadioOption` (role=radiogroup + role=radio + aria-checked + haptic.tap + iOS Safari blur 안전망) 6 사용처 흡수 (CategoryFilter/ThemeKindSelector/SeasonSelector/CountSelector/ThemeSection/TravelTypeQuiz). Checkbox 패턴은 layout 다양·1회 호출 비중 높아 추출 불필요로 결정.
- **2026-06-07**: i18n Edge Config 마이그 계획 — 운영 안정화 후 텍스트 변경 빈도 ↑ 시 도입. `docs/I18N_EDGE_CONFIG.md` 신설 (도입 신호 / Pro plan 필수 / next-intl 통합 코드 / GitHub Actions sync / fallback / 마이그 5단계 / 트러블슈팅). 현재 bundle 유지 — 도입 신호 3 중 1 충족 시 진행.
- **2026-06-08**: 문서 대정리 — API_CONTRACT 삭제 (Swagger SoT) / AUTH_FLOWS + NOTIFICATIONS → FEATURES 통합 / ARCHITECTURE / ENVIRONMENT 신설 / README slim (1843→152줄). 8개 docs 인덱스화.
- **2026-06-08**: UI primitive 5종 추가 + Sentry 제거 — `Dialog` (4 모달 흡수) / `TabList+Tab+TabPanel` (2 사용처 흡수). `@sentry/nextjs` 패키지 + config 4 파일 제거 (의도적 미도입). `<Analytics />` mount (Vercel web vitals + 페이지뷰).
- **2026-06-08**: RecommendationBanner 비율 개선 — desktop max-width 720→580 (3.4:1) + height clamp fluid (140~172). 양옆 빔 / 너무 wide 사이 sweet spot.
- **2026-06-08**: Fluid 반응형 정책 도입 (`clamp()` 우선) — 9 컴포넌트 단계별 media query 폐기, 320~desktop 부드러움. STYLES.md §1 추가 + 적용 가이드.
- **2026-06-08**: BE spec 정합 — `PATCH /travel-types/me` 응답 `recommended:[]` (저장 ack only) → FE `useSetMyTravelType` 의 `setQueryData` → `invalidateQueries` 로 변경 → GET refetch 가 recommended 포함 응답 → quiz/result "이런 여행지가 어울려요" 영역 유지. `POST /location/reverse` 응답에 `sido`/`sigungu` 필드 추가. `POST /tournaments` 선택 인증 (게스트 익명 기록 가능, 401 없음) 주석 명시 — FE 코드 자체는 이미 정합 (useRequireAuth 가 "마이페이지 저장" 액션 단위만 적용).
- **2026-06-10**: 견고성·품질·폴리싱 — react-query retry 정합 (4xx skip / 5xx·network 1회 — 401/422 무한 hang 방지), iOS scroll-padding-top + touch-action: manipulation (sticky 헤더 anchor 가림 + double-tap zoom + 300ms delay 차단), ESLint warning 5→0, Dialog body scroll lock + overscroll-behavior:contain (iOS PWA backdrop chain 차단), Pretendard SRI 해시 등록 (jsdelivr v1.3.9), a11y seed id fix.
- **2026-06-10**: primitive unit test 5종 추가 (TextField/MediaThumb/RadioGroup/Dialog/Tabs) — vitest 145/23 → 177/28 (+32 cases). RadioOption 정합 보강 (이미 선택된 radio idempotent — Tab 과 동일).

---

## 우선 순위 한눈에

| Phase      | 영역                                 | 의존성               | 상태      |
| ---------- | ------------------------------------ | -------------------- | --------- |
| **3**      | BE 연동 (orval 마이그 + enum 정합)   | NestJS               | ✅ 완료   |
| **4**      | 푸시 알림 운영 진입                  | NestJS web-push + DB | 진행 중   |
| **5 잔여** | CSP enforce / 정책 본문 / rate limit | 백엔드 + 법무        | 대기      |
| **6**      | UX 개선 / 새 기능 / 새 화면 / 테스트 | —                    | 신규 요청 |

---

## 0-SEO. 보류 SEO 보강 — 의존성/데이터 충족 시 진행

- **hreflang alternates** (M-L) — `layout.tsx` generateMetadata 에 `alternates.languages` 추가. 현재 next-intl 이 **cookie 기반 locale** (URL prefix 없음) → routing 변경 (`defineRouting` + middleware locale prefix + 32+ Link/router import 교체) 필요. 사이드이펙트 통제 가능하지만 0 은 아님 (middleware 합성 / import 누락 위험). 영어권 유입 비중이 의미 있게 늘면 (analytics 확인 후) 도입. 검토 메모: 위험 영역 & 안전 절차 — git log `52faaae` 이후 turn 참조.
- ~~**Event JSON-LD** (S, BE 의존)~~ ✅ **2026-06-10 완료** — `DestinationDetailDto` 에 `eventStart/eventEnd` 추가 (BE) → `touristAttraction()` 가 Festival + startDate 시 Event schema (startDate/endDate/location) 분기 + SSR 시 `tournamentApi.getDestinationDetail(id)` fetch 로 schema 보강 + mock handler 가 category=festival 일 때 deterministic date 응답. 검증: [Rich Results Test](https://search.google.com/test/rich-results) 로 schema 유효성 점검 권장.

---

## 1. Stub 컴포넌트 — 모두 제거됨

2026-06-03 일괄 정리:

- 미사용 ranking stub 7종 (`RankingList` / `WeeklyTopMini` / `CategoryRankingTabs` / `RankingByRegion` / `RankingByTravelType` / `HeroDestination` / `SeasonalRecommendation`) 삭제
- 미사용 region stub 1종 (`RegionList`) 삭제
- 미사용 mypage 편지 stub 4종 (`LikedLettersSection` / `SavedLettersSection` / `TravelTypeSection` / `LetterboxTabs`) 삭제
- 구 `ChungbukSvgMap` (5×3 grid 도식) 삭제 — 정밀 `ChungbukStampMap` 으로 마이페이지 + /region 메인 모두 적용

사양 확정 시 ranking 추가 섹션 재도입.

---

## 2. TODO / FUTURE BE 메모

### 2-0. BE (NestJS Swagger) 합의 — ✅ 완료

orval 단일화 완료 (2026-06-06). 운영 워크플로:

1. BE swagger spec → `http://localhost:3000/docs-json` (env `OPENAPI_URL` 로 override)
2. `npm run generate:api` — `src/api/generated/` 에 client + react-query hooks + DTO + MSW handlers 자동 생성
3. mutator (`src/services/api/orval-mutator.ts`) 가 `res.data` 자동 unwrap → generated 함수가 `Promise<DTO>` 직접 반환
4. feature 별 wrap (`src/features/*/api/*.ts`) 가 generated 함수 호출. hook 의 onSuccess 흐름 (router redirect, cache invalidate) 만 FE 책임.
5. BE swagger 변경 시: `npm run generate:api` 재실행 → type 에러로 영향 호출처 자동 발견.

**BE swagger 책임**:

- `@ApiResponse({ type: XxxDto })` — 응답 DTO 명시
- `@ApiBody({ type: XxxDto })` — request body DTO 명시
- `@ApiConsumes('multipart/form-data')` + file field — multipart endpoint
- enum 필드는 `@ApiProperty({ enum: [...] })` — generated 가 narrow union

| #    | 항목                                          | 현재 상태                                                                                                                                                                                                                                                                                                                 | 합의 필요                                                                                                                                                                                                                                    |
| ---- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | **응답 zod 스키마**                           | ✅ orval 마이그 완료. generated 가 type guard 책임 — `safeParseResponse` + 임시 schemas 5개 + `lib/schemas/common` 모두 삭제. form validation 만 `src/features/{auth,letter,onboarding}/schemas/*` 유지.                                                                                                                  | —                                                                                                                                                                                                                                            |
| 2    | **에러 응답 형태**                            | `{ code: string, message: string, details? }` 가정                                                                                                                                                                                                                                                                        | BE 가 동일 형태로 통일. `services/interceptors/error-normalize.ts` 가 normalize                                                                                                                                                              |
| 3    | **cookie 이름 / 정책**                        | ✅ `SID` 단일 (`NEXT_PUBLIC_SESSION_COOKIE` env). sessionID 모델 — JWT refresh 폐기 (BE 와 합의 완료).                                                                                                                                                                                                                    | —                                                                                                                                                                                                                                            |
| 4    | **CORS**                                      | `withCredentials: true` (axios)                                                                                                                                                                                                                                                                                           | BE 가 `Access-Control-Allow-Origin: <our-domain>` + `Allow-Credentials: true` 설정                                                                                                                                                           |
| 5    | **`/me` 단일화**                              | ✅ `/me` 만 사용. `/users/me` 잔재 삭제 완료                                                                                                                                                                                                                                                                              | —                                                                                                                                                                                                                                            |
| 6    | **페이지네이션**                              | cursor 기반 `{ items, nextCursor }` (letters / history)                                                                                                                                                                                                                                                                   | BE 가 동일 형태 또는 offset 기반 시 InfiniteList 분기 추가                                                                                                                                                                                   |
| 7    | **region code 형식**                          | 영문 소문자 (`cheongju`)                                                                                                                                                                                                                                                                                                  | BE 가 같은 표기 / 또는 `sigunguCode` numeric → 매핑 layer 필요                                                                                                                                                                               |
| 8    | **destination category**                      | enum 4종 (`local/festival/attraction/experience`)                                                                                                                                                                                                                                                                         | BE 가 동일 enum. 확장 시 UI 매핑 (emoji/tone) 추가 필요                                                                                                                                                                                      |
| 9    | **mock-only endpoint**                        | `POST /__mock/letter-arrive` (push 시뮬레이션)                                                                                                                                                                                                                                                                            | 운영에선 BE web-push 가 대체 (Phase 4)                                                                                                                                                                                                       |
| 10   | **`POST /me/avatar` (multipart)**             | ✅ `POST /me/avatar` + `DELETE /me/avatar` — BE 구현 완료 (R2). FE 정합 완료 — `mypageApi.updateAvatar(file)` / `removeAvatar()` + mutations + ProfileCard UI (avatar 있을 때 X 버튼 노출). 검증: `image/jpeg\|png\|webp` + ≤5MB.                                                                                         | BE 가 구현 (Phase 3)                                                                                                                                                                                                                         |
| 11   | **`/destinations/random` spec 합의**          | Query: `themeKind / themeValue / categories(comma) / regions(comma, FE 가 map phase 에서 random pick 한 N 시군) / tournamentSize ∈ {4,8,16,32}`. 응답: 정확히 tournamentSize 개. 시군은 `regions` 안에서 선택. `regions.length ≥ tournamentSize` → 각 시군 1개씩, 그 외 → 같은 시군 다른 destination 으로 채움.           | BE 가 이 spec 그대로 구현 — `src/mocks/handlers.ts` 의 `/destinations/random` mock 이 reference. **count / pool / region(단일) 폐기**. 흐름: setup → **map(시군 random pick → store)** → tournamentSize → fetch → bracket.                   |
| 12   | **`/destinations/:id` (detail) spec 합의**    | 기본 (`id / name / category / region / imageUrl / description`) + `summary` (필수, ≤120자) + `photos[] / address / openingHours / restDate / parking / phone / website / coords{lat,lng}`. TourAPI 원본 명칭 그대로.                                                                                                      | `admissionFee / tags / rating / bestSeasons` 폐기 (BE 미제공). `restDate` (휴무일), `parking` (자유 문자열). seed id 체계 = `tour-<contentid>` (`tourSeedId()` helper). 진실: `src/features/tournament/schemas/destination.ts` + BE Swagger. |
| 12-1 | **계절 필터 적용 범위**                       | BE: `themeValue=spring\|summer\|autumn\|winter` + `categories` 가 `festival` 포함 시 → eventStart 월 기반 필터. festival 외 카테고리는 계절 무시 (전부 통과).                                                                                                                                                             | FE 가 step 3 에서 비-festival 선택 시 inline hint 노출 (`tournament.setup.steps.category.seasonScopeNonFestival`).                                                                                                                           |
| 13   | **`/notifications` cursor 페이지네이션 요청** | FE 는 `?cursor=&limit=` + 응답 `{items, unreadCount, nextCursor}` 가정. `/notifications` 페이지가 useInfiniteList 로 무한스크롤 구현. mock 도 정합.                                                                                                                                                                       | BE 응답 spec 에 `nextCursor: number\|null` 추가 요청. 첫 페이지 응답의 `unreadCount` 가 전체 통합 수.                                                                                                                                        |
| 14   | **generated 잔존 빈 schema (영향 0)**         | `XxxControllerV1200` 별칭 5개 + 폐기 endpoint 2개 (weather/locationByIp) — 실 응답 type 은 `DestinationDetailDto` 등 별도 명시되어 동작 무관. orval 가 200 응답 별칭을 자동 생성하지만 import 한 곳 없음.                                                                                                                 | BE 가 swagger 의 200 응답에 inline schema 대신 `@ApiResponse({ type: XxxDto })` 명시하면 별칭도 사라짐. 운영 영향 없어 우선순위 낮음.                                                                                                        |
| 17   | **orval 마이그 ✅ 완료**                      | BE swagger response/request DTO + 7 enum (`Season`/`DestinationCategory`/`RegionCode`/`AppNotificationType`/`TournamentSize`/`ThemeKind`/`TravelTypeCode`) 명시 → orval generated 가 진실의 원천. 10 features 모두 generated client 마이그 완료. mutator (`src/services/api/orval-mutator.ts`) 가 `res.data` 자동 unwrap. | —                                                                                                                                                                                                                                            |
| 15   | **README.md 정합 ✅ 완료**                    | sessionID 전환 + weather 폐기 + orval 마이그 모두 본문 반영 (2026-06-06). Auth 섹션 / endpoint 표 / Stack 표 / cache 표 / mock 핸들러 표 / rate-limit 표 / OpenAPI 생성 섹션 모두 갱신.                                                                                                                                   | —                                                                                                                                                                                                                                            |
| 16   | **`POST /location/reverse` BE 복원 요청**     | 한 번 폐기됐던 endpoint. FE 검증 결과 navigator.geolocation 좌표만으론 지역명 못 받음 — 편지 위치 라벨이 "37.482, 126.895" 식 좌표라 어색. FE 측 locationApi/useResolveLocation/mock 모두 복원 완료.                                                                                                                      | BE 가 Kakao/Naver reverse wrap 으로 `POST /v1/location/reverse { latitude, longitude } → { label, regionCode?, latitude, longitude }` 다시 제공. 전국 좌표 처리 — `label` 예시 "서울시 용산구" / "충북 청주시". regionCode 는 충북 한정.     |

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
| `getBlurDataURL` (LCP placeholder) | ✅   | BE imageUrl 연동 시점 — 현재 코드는 emoji/colorChip 만 |

---

## 4. 백엔드 의존 작업

### 4-1. mock 에 없는 endpoint (실 백엔드 계약 동시 정의)

| Endpoint     | 호출 처   | 우선         |
| ------------ | --------- | ------------ |
| `DELETE /me` | 회원 탈퇴 | 운영 전 필수 |

> 다음 endpoint 는 mock 신설 완료:
>
> - Phase 5: `/mypage/*`, `/letters/*`, `/regions/ongoing-festivals`, `/mypage/stamps`, `/mypage/profile`, `/mypage/tournaments`
> - 옵션 A: `/regions/:code/summary`, `/rankings?type=recommended|hidden-gems`

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

### 6-1. vitest 단위 (총 123개 — 21 files)

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

### 7-4. color-contrast a11y — 완료

✅ 2026-06-02 sweep — spring / autumn / red / amber / green / violet 베이스 톤 진하게 (흰 배경 4.5:1+). `_accents.scss` 갱신. axe-core `color-contrast` 룰 활성화 (desktop project).

---

## 8. Phase 별 권장 작업 순서

### Phase 3 — BE 연동 시 일괄 (백엔드 붙는 시점)

1. TournamentPlayClient — `POST /tournaments`
2. TournamentResultClient — `?id=` deep-link
3. LetterSentClient — `?id=` + `useLetter`
4. ProfileCard updateAvatar (multipart + 스토리지)
5. 회원 탈퇴 (`DELETE /me` + confirm)
6. `GET /regions/:code/summary` 실 BE 연동 — `RegionHero` 이미 도입됨 (mock 사용 중)

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
15. ~~color-contrast a11y 디자인 sweep~~ — ✅ 완료

### Phase 6 — 선택 작업 (필요 시점)

- `@tanstack/react-virtual` (편지함 1000+ 시)
- 단축 URL 서비스 (OG image URL 너무 길어짐)
- 카카오링크 SDK 통합 (카톡 공유 UX 강화)
- 에러 추적 도구 (필요해지면 Sentry 가 아닌 가벼운 대안 검토 — bundle 영향 / 개인정보 처리 부담 고려)

---

## 부록: 의존성 매트릭스

| 작업                         | 백엔드                                                        | 디자인            | 다른 작업 |
| ---------------------------- | ------------------------------------------------------------- | ----------------- | --------- |
| ~~Phase 2 정밀 ChungbukMap~~ | ✅ 완료 — `ChungbukStampMap` (마이페이지 + /region 메인 적용) | —                 | —         |
| ~~Phase 2 WeatherWidget~~    | ✅ 임시 디자인 완료                                           | 후속 시안 시 교체 | —         |
| Phase 3 전체                 | NestJS 라우트 다수                                            | —                 | —         |
| Phase 4                      | NestJS web-push + DB                                          | —                 | VAPID 키  |
| Phase 5 보안                 | rate limit / CSRF / 메일                                      | —                 | Phase 3   |
| 정책 페이지 본문             | —                                                             | —                 | 법무 검토 |
| ~~color-contrast sweep~~     | ✅ 완료                                                       | —                 | —         |

---

## 핵심 발견 요약 (2026-06-03 시점)

1. **stub 0** — 미사용 stub 12종 + 구 grid `ChungbukSvgMap` 일괄 삭제. 사양 확정 시 ranking 추가 섹션 재도입.
2. **정밀 SVG 지도** — `ChungbukStampMap` 이 마이페이지 도장책 + /region 메인 진입 양쪽에 적용. 청주 4 path 시각 통합 + 도장 음영 처리 + 라벨 좌표 정상화.
3. **mock 환경 middleware skip** — `USE_MSW=true` 시 모든 페이지 접근 가능. 운영은 그대로.
4. **6 플랫폼 E2E + 48 visual baseline** — 레이아웃/CSS 깨짐 자동 검출.
5. **핵심 BE 작업**: `POST /tournaments` + `?id=` deep-link — 3 화면 (play/result/sent) 이 store-only 라 reload 시 데이터 손실.
6. **이미지 공유** — 모바일 `navigator.share({files})` → Desktop Chrome/Edge `ClipboardItem` 이미지 blob 복사 (Ctrl+V 채팅 첨부) → Firefox/Safari URL+다운로드 fallback 의 3단 분기. 카톡 채팅 첨부 정상.
7. **mock 시드 풍부화** — 저장 우승지 7개, 토너먼트 기록 15개, 도장책은 winnerRegion union 으로 derive.
