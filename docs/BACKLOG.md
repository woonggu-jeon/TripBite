# TripBite 후속 작업 백로그

> 코드베이스 전수조사 후 정리한 잔존 / 개선 항목. 분기점마다 갱신.
> 마지막 갱신: 2026-06-14
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
- **2026-06-10**: 폴더 시멘틱 정합 5종 — `components/{form,common}/` 빈 폴더 제거 / `Icon/` → `icon/` (kebab 통일) / `features/user/` 평탄화 (`User = UserDto` alias → `src/types/`) / `features/{theme,analytics}/` 의 컴포넌트 `components/` 하위로 통일. import 9곳 갱신, 177 그대로.
- **2026-06-10**: Storybook 9 (`@storybook/nextjs-vite`) 도입 — primitive 18종 카탈로그 (UI 12 / Feedback 4 / Toggle / Icon). Provider decorator: NextIntl / QueryClient / globals.scss / data-theme + locale toolbar. CI `ci.yml` 에 `build-storybook` 게이트 추가. `addon-vitest`/`addon-mcp` 제거 (vitest 177 + e2e 시각회귀와 중복). `docs/STORYBOOK.md` 신설. `/dev/components` ad-hoc 카탈로그는 stale (4종만, 12+ primitive 미반영) → 통째 삭제 후 Storybook 대체.
- **2026-06-10**: 저장/삭제 mutation 누락 toast 보강 — `LetterActions` 편지 삭제 success/error toast, `TournamentPlayClient` record mutation 실패 silent → toast 명시. i18n: `letter.detail.deletedToast` / `deleteFailedToast` / `tournament.play.recordFailedToast` (ko + en).
- **2026-06-10**: SEO 보강 sweep — `/region/[code]`, `/destination/[id]` metadata 에 `alternates.canonical` + `openGraph.url` 추가 (query 중복 정규화). `tournament/{play,result}/page.tsx` 정적 metadata → `generateMetadata` + i18n + `robots:noindex` (store 의존, 사용자별 결과). BreadcrumbList JSON-LD (region 3-level, destination 4-level). heading 위계 fix — `RegionHero` / `DestinationDetailClient` h1→h2 (SubHeader 가 페이지 h1). `next-seo` 검토 결과 비추천 (App Router native 가 cover).
- **2026-06-10**: `lib/json-ld.tsx` helper 신설 — `breadcrumbList` / `webSiteOrganization` / `touristAttraction` factory + `<JsonLd>` 컴포넌트 (BLOCK_INDEXING 자체 처리). 3 inline `<script type="application/ld+json">` (layout/region/destination) 일괄 흡수.
- **2026-06-10**: Event JSON-LD — `DestinationDetailDto.eventStart/eventEnd` BE 반영 (`docs/BE_REQUEST_FESTIVAL_DATES.md` 전달). `touristAttraction()` 이 Festival + startDate 시 schema.org Event 분기 (startDate/endDate/location.Place). `/destination/[id]` SSR 에서 `tournamentApi.getDestinationDetail(id)` fetch 로 schema 보강 (실패 시 graceful fallback). mock handler 가 category=festival 일 때 deterministic date 응답 (dev 검증).
- **2026-06-10**: dead infra 청소 — `src/lib/blur.ts` (`getBlurDataURL`) + `plaiceholder` devDep 삭제. 호출 0건 + LCP 후보 `DestinationPhotos` 가 raw `<img>` 라 적용 비용 > 효과. 필요 시 38줄 재작성. §3 인프라 항목 폐기.
- **2026-06-11**: orval generated commit — `src/api/generated/` 의 `.gitignore` 해제 + 121 파일 commit. 운영 BE 의 `/v1/docs-json` 비노출 (Swagger 보안) 으로 Vercel build prebuild 가 실패하던 회귀 대응. `predev`/`prebuild` 가 `generate:api || echo skip` fail-soft 로 — fetch 실패 시 cached generated 사용. BE swagger 변경 시 FE 가 `npm run generate:api && git commit src/api/generated/` 흐름.
- **2026-06-10**: login returnUrl 회귀 fix — 2-단계 fix.
  - (1) `AuthBootstrap` / `useRequireAuth` 가 `encodeURIComponent` 후 query 작성 → double-encode → LoginForm 가드 실패 → fallback `/`. middleware 와 동일하게 `URLSearchParams.set('redirect', pathname)` 통일.
  - (2) URL 정상 (`%2Fmypage`) 인데도 useLogin onSuccess 의 `router.replace + router.refresh` race 3종 — (auth)↔(main) 그룹 교체 + RSC client cache 의 미인증 stale payload + AuthBootstrap의 onboarding 분기 + refresh 가 replace 보다 먼저 발사. **fix**: `window.location.assign(target)` hard navigation — 1회 full reload 비용으로 race 3종 모두 우회 (middleware cookie 정합 검증 / client router cache 우회 / AuthBootstrap mount-from-scratch).
- **2026-06-10**: 회원가입 자동 로그인 — BE 가 `POST /v1/auth/signup` 응답에 `Set-Cookie: SID` + `SignupResponseDto { user: UserDto }` atomic 발급. FE `useSignup` 단순화 — 응답의 user 로 `setAuth` + `queryClient.setQueryData(me)` + `/onboarding` replace. 별도 login/me 호출 폐기 (3-call → 1-call). BE 요청서 삭제 (전달/완료).
- **2026-06-10**: 콜드 스타트 단축 — content 페이지 ISR. `/region` + `/region/[code]` 11 시군 `generateStaticParams` + `revalidate: 3600` (안정 데이터). `/destination/[id]` on-demand ISR (`generateStaticParams: [] + dynamicParams: true + revalidate: 3600`). 양쪽 `loading.tsx` 신설 — generate / cache miss 시 즉시 skeleton. Vercel Lambda cold start 회피. BE 변경 즉시 반영 필요 시 `revalidatePath` 호출.
- **2026-06-12**: 인증 redirect 를 middleware (SSR) 로 일원화 — 3 회 hydration race 회귀 누적 (AuthGuard / AuthBootstrap / selector closure) 으로 클라 가드 비활성. middleware 가 SID cookie 존재 검증 (보호 경로 진입) + 인증된 사용자의 `/login`·`/signup` 재진입 차단 (안전 redirect param 가드) 모두 SSR 단계 처리. FOUC 0. 클라 가드 (AuthGuard / ProtectedScope / AuthBootstrap) 는 mount 0 으로 회귀 시 원복 위해 보존. mock 환경 (`USE_MSW=true`) 은 분기 skip — MSW 가 Set-Cookie 발급 안 함. useLogout / useDeleteAccount 도 useLogin 과 일관 hard nav (`window.location.assign('/')`).
- **2026-06-12**: 충북 축제 캐러셀 3단계 폴백 — BE 가 단일 endpoint 안에서 `ongoing` (진행 중) → `upcoming` (30 일 이내) → `popular` (인기 여행지) 응답 결정. 응답 `{ type, items[] }`. FE 는 `type` 분기로 sectionTitle i18n + `upcoming` 시 D-day 뱃지 (좌상단, Deep Forest 톤). D-day 는 BE 가 KST 기준 `daysToStart` 서버 계산 — 클라 시계 의존 X. `DestinationCard.topLeftBadge` slot 신설.
- **2026-06-12**: DTO alias 일괄 정리 — 30+ alias (`Letter=LetterDto`, `Destination=DestinationDto`, `User=UserDto`, `RegionContent=RegionContentDto`, `OngoingFestivals=OngoingFestivalsDto` 등) 모두 제거. 사용처 모두 `@/api/generated/schemas` 에서 직접 import + generated 명 (Dto 접미사) 직접 사용. features/region/types 폴더 자체 삭제. 자체 도메인 shape (`TournamentConfig`, `BracketMatch`, `RankedDestination`, `LetterListKind`, `OnboardingState` 등) 만 features/\*/types 에 잔존.
- **2026-06-17**: Figma MCP 가이드 정정 + test type 정합:
  - **MCP config 경로 정정** — Claude Code project MCP 표준은 `.mcp.json` (프로젝트 루트, 점 시작). 기존 가이드의 `.claude/mcp.json` 은 Claude Code 가 안 읽는 비표준 위치였음 (디버깅 중 발견). `docs/FIGMA_INTEGRATION.md` 전반 정정.
  - **`.mcp.json.example` 신설 + `.claude/mcp.json.example` 폐기** — args 방식 (`--figma-api-key` flag) 권장. env 블록은 stdio fork 시 좀비 process 가 옛 env 들고 살아남아 403 발생하는 케이스 있음 (직접 검증).
  - **`.gitignore` 정리** — `!.claude/mcp.json.example` 제거.
  - **Troubleshooting 표 보강** — "fetch 마다 403", "reconnect 해도 같은 증상", "scope 체크 누락" 등 실제 디버깅 케이스 추가.
  - **사전 type 에러 9건 cleanup** — `use-auth.test.tsx` (SignupDto.passwordConfirm/ResetPasswordDto.newPassword 잘못된 필드 + UserDto mock 의 누락 필드 보강), `use-letters.test.tsx` (ComposeLetterDto.recipientUsername → body+location), `use-tournament.test.tsx` (SavedTournamentDto.destination.imageUrl null → omit, useSaveTournament mutateAsync 시그니처 (string), useRecordTournament 의 tournamentSize 필드). typecheck 9 → 0.
- **2026-06-16**: 홈 빠른시작 row 화 + region 카드 형태 통일 + 전체 탭 신설 (BE 대기):
  - **홈 QuickActions** — 토너먼트/유형테스트 카드가 가로 2 컬럼 (`1fr 1fr`) 으로 나란히 있던 것을 단일 컬럼 (`1fr`) 세로 stack 으로 변경 — 한 row 에 카드 한 개씩 (위: 토너먼트 / 아래: 유형테스트). 카드 내부도 세로(col) → 가로(row): 좌 아이콘 / 우 라벨, 좌측 정렬. full width 라 라벨 한 줄에 들어감 (font 살짝 up).
  - **DestinationCard** `description?: string` prop 신설 — 여행지명 하단 한 줄 ellipsis. 미지정 시 영역 미노출. `RegionContentDto.summary` 매핑.
  - **RegionDetailTabs** — `RegionContentRow` (row 카드) 제거하고 `DestinationCard` (세로 카드) 2 columns 로 통일. emoji 매핑 (`📍/🎪/🎨`) 은 `TYPE_EMOJI` 로 inline. panel min-height 360→460 (작은 viewport 320→420) 조정.
  - **전체 탭** — `[전체|관광지|축제|체험]` 4 탭 즉시 활성. 'all' 은 카테고리가 아닌 "필터 없음" 쿼리값 — 응답 enum `DestinationCategory` (3값) 과 분리해 `RegionContentFilter = DestinationCategory | 'all'` 신설 (`features/region/api/region.ts`). 'all' 시 `regionApi.listContents` 가 BE 에 `type` omit 전달 → BE `region.service` 의 미지정 분기로 통합 응답 (코드상 이미 동작, BE 변경 0). BE OpenAPI 의 `@ApiQuery({ enum: ['all', ...] })` 분리는 정합성 후속 (`docs/BE_REQUEST_region_all_tab.md`).
  - i18n: `region.tabs.all` 키 추가 (ko/en). scss `.tabs` grid 가 탭 수 변동 대응 (`grid-auto-flow: column`).
  - 삭제: `src/features/region/components/RegionContentRow.{tsx,scss}` (미사용).
- **2026-06-14**: use-region.ts unit test 추가 +4 cases (225 → 229):
  - useRegionSummary 성공, useRegionContents (type/limit query param + http→https 정규화 검증), useOngoingFestivals (region 인자 유/무 분기 2건).
  - Coverage baseline: Stmts 85.63% / Branches 69.89% / Funcs 80.78% / Lines 86.51% (threshold 82/69/79/83 — Branches margin 0.89).
- **2026-06-14**: use-notification-settings.ts unit test 추가 +2 cases (223 → 225):
  - useUserSettings 비인증 가드 / useUpdateNotificationSettings (응답 → settings.user cache 직접 setQueryData, invalidate 안 함).
- **2026-06-14**: use-notification-inbox.ts unit test 추가 +4 cases (219 → 223):
  - 신규 cover: useNotificationInboxInfinite (비인증 가드) / useNotificationBadge (비인증 가드) / useMarkNotificationRead (notificationKeys.all invalidate) / useMarkAllNotificationsRead (동일).
  - notificationKeys.all 한 번 invalidate 로 inbox + badge 양쪽 동시 갱신 패턴 검증.
- **2026-06-14**: use-ranking.ts unit test 추가 +3 cases (216 → 219):
  - 신규 cover: useMyTravelType (비인증 가드) / useSubmitTravelType (응답 cache 직접 setQueryData) / useSetMyTravelType (PATCH ack only — setQueryData 안 함 + invalidate 2 곳).
  - BE spec 정합 검증 — `PATCH /travel-types/me` 응답이 `recommended:[]` ack 라서 setQueryData 우회 + invalidate 만으로 다음 GET 이 recommended 포함 응답.
  - 새 baseline: Stmts 85.41 / Branches 69.78 / Funcs 80.32 / Lines 86.25. threshold 통과 (Branches 마진 0.78 tight).
- **2026-06-14**: use-tournament.ts unit test 추가 +6 cases (210 → 216):
  - 신규 cover: useSavedTournaments / useTournamentHistory (둘 다 비인증 가드) /
    useSaveTournament (saved invalidate) / useUnsaveTournament (optimistic remove +
    rollback 2 cases) / useRecordTournament (record cache set + history invalidate).
  - **vitest.config include 확장** — `use-tournament.ts` 추가.
  - **gcTime trade-off** — useUnsaveTournament 의 optimistic 검증 시 gcTime:0 이면
    onSettled invalidate 후 inactive cache 즉시 GC 되어 검증 불가 → gcTime:60_000
    적용.
  - 새 baseline (use-tournament 의 미커버 query hooks 분모에 추가):
    Stmts 86.01 / Branches 70.16 / Funcs 81.97 / Lines 86.98 (이전 87/74/85/89 대비 -1~4).
- **2026-06-14**: use-mypage.ts unit test 추가 +5 cases (205 → 210):
  - 신규 cover: useMypage / useStamps (둘 다 비인증 시 fetch 0) /
    useUpdateNickname (mypage summary + auth.me 양쪽 invalidate) /
    useUpdateAvatar (multipart Content-Type 자동 unset 검증 + 2 invalidate) /
    useRemoveAvatar (2 invalidate).
  - **vitest.config include 확장** — `src/features/mypage/hooks/use-mypage.ts` 추가.
  - 새 baseline (use-mypage 분모 추가): Stmts 87.33 / Branches 74.11 / Funcs 84.87 / Lines 88.62.
- **2026-06-14**: use-letters.ts unit test 추가 +4 cases (201 → 205):
  - 신규 cover: useSendLetter (sent list invalidate spy) / useDeleteLetter (detail removeQueries + 4 list invalidate spy) / useLettersInfinite / useLetter (둘 다 비인증 시 fetchStatus='idle' 검증).
  - **isInvalidated 검증 패턴 폐기** — query 가 실제 mount 안 됐을 때 false reading. spy(qc.invalidateQueries) 가 정직.
  - **새 baseline**: Stmts 87.1% / Branches 74.1% / Funcs 84.6% / Lines 88.5% (이전 84/73/79/85 대비 +3~5).
  - threshold 상향: 82/69/79/83.
- **2026-06-14**: use-auth.ts unit test 추가 +9 cases (192 → 201 / coverage +7~10%):
  - 신규 cover: useLogin store sync / useSignup (atomic 응답 setAuth + onboarding redirect) / useLogout (성공 + 실패 onSettled) / useDeleteAccount (성공 + 실패 분기) / useResetPassword (logout + clearAuth + /login?reset=success) / useForgotPassword / useFindId.
  - `clearAllCaches` vi.mock (caches API 의존, jsdom 미지원).
  - spyLocationAssign 헬퍼로 window.location.assign 만 spy (happy-dom URL parser 보존).
  - MSW server.use endpoint 패턴 `/v1/auth/...` → `/auth/...` 통일 (handlers.ts 의 default 와 매칭, server.use override 정상 동작).
  - **새 baseline**: Stmts 84.1% / Branches 73.5% / Funcs 79.3% / Lines 85.4% (이전 76/73/68/77 대비 Stmts/Funcs/Lines 큰 폭 상승).
  - threshold 상향: 78/68/73/80 (이전 70/65/60/70).
- **2026-06-14**: vitest coverage 정직성 보강 — include 분모 확장 + threshold 현실 baseline:
  - 이전: include 9 entry (schemas + lib 5 + hook 1 + store 1 + component 1) — 분모 작아 거짓 안심.
  - 이후: include 28 entry — test 가 실 작성된 module 명시. 신규 test 추가 시 함께 갱신.
  - **2026-06-14 baseline**: Statements 76.44% / Branches 72.94% / Functions 68.61% / Lines 77.54%.
  - threshold 조정 — 회귀 가드 유지: Stmts 70 / Branches 65 / Funcs 60 / Lines 70 (baseline 의 5-8% 아래, 일시적 측정 오차 허용).
  - **uncover 식별 영역** (baseline 의 빈 곳, 향후 test 추가 가치):
    · `use-auth.ts` 19% (useLogin/useSignup/useResetPassword/useLogout 등 다수)
    · `use-letters.ts` 56% (useToggleLikeLetter optimistic rollback 미검증)
    · `FestivalCarousel.tsx` 37% (jsdom carousel measurement 한계)
    · `tournament-store.ts` 66% (일부 action 미커버)
- **2026-06-14**: 12 영역 자율 진단 후속 (자율 진단 한계 도달):
  - **WinnerDetailPanel URL prefix 가드** — `r.value` 의 `website` 가
    `https?://` 시작인지 강제 검증 (`/^https?:\/\//i.test`). javascript: URL
    XSS 방어. BE 신뢰 source 라도 다층 방어.
  - **providers.tsx 의 i18n 하드코딩 → key** — `'요청을 처리하지 못했어요.'` /
    `'네트워크 오류가 발생했어요.'` 를 `errors.requestFailed` / `errors.network`
    로 교체. `useRef(useTranslations(...))` 패턴으로 useState lazy init 의
    closure stale 회피. i18n ko/en 양쪽 새 key 2 개 추가.
  - **vitest coverage include 확장** (medium ROI 보류) — `features/letter/hooks`,
    `features/tournament/utils`, `lib/cache.ts` 등 점진 확장 후보. 별도 작업.
  - **자율 진단 한계 도달** — 12 영역 중 high ROI 보강 0, 즉시 위험 0.
    남은 약점들은 운영 데이터 누적 + product 의사결정 + Next 16 안정화 의존.
- **2026-06-14**: Next 16 업그레이드 시도 → revert (Serwist 호환성 차단).
  - 시도: `next@15.5.18 → 16.2.9` + eslint-config-next + bundle-analyzer 동일 major
  - **빌드 fail**: `PageNotFoundError: Cannot find module for page: /_not-found`.
    근본 원인 — Next 16 의 production build 가 Turbopack 강제, **Serwist 가
    Turbopack 미지원** (open issue serwist/serwist#54).
  - deprecation 감지: `experimental.typedRoutes` → `typedRoutes` 위치 이동.
    `middleware` file convention → `proxy` 권장.
  - **revert** 후 `.next` 클린 + `npm run build` 정상 (shared 104 kB).
  - 재시도 시점 — Serwist 가 Turbopack 호환 (issue 해결) 또는 SW 라이브러리
    교체 검토. 그때 PPR 도 활성 가능. 현재는 Next 15.5 stable + Serwist 9.5
    조합 유지.
- **2026-06-14**: 14 영역 광범위 자율 진단 (read-only) + low ROI 1건 처리:
  - **letter store key prefix 통일** — `letter` → `tripbite.letter`. auth-store 의
    `tripbite.auth` 와 일관. 3rd-party storage key 충돌 위험 0. lastSent 가
    UX 신호라 마이그 없음.
  - **진단 결과**: 14 영역 중 견고 11, 약점 3 (CSP enforce / letter key / dependency
    major bumps), 즉시 위험 0. PWA SW / a11y / 모바일 / CI/CD / 운영 보안 / Storybook /
    데이터 정합성 등 모두 견고. dependency major bumps (Next 16 / recharts 3 /
    lucide 1 / hookform-resolvers 5) 는 RELEASE NOTES 사전 검토 필요한 별도 작업.
  - **CSP enforce 전환 절차** (medium ROI) — `style-src 'unsafe-inline'` 잔존.
    Pretendard self-host 후 대체 가능 검토 + Report-Only 단계 violation 로그 1주
    sweep 후 토글 step. 별도 milestone.
- **2026-06-14**: 자율 진단 후속 — Pretendard self-host + ProfileCard avatar 분기 + PPR 검증:
  - **Pretendard self-host (high ROI)** — `src/fonts/PretendardVariable.woff2` (~2MB variable font) + `next/font/local` (`--font-sans-loaded` CSS 변수). layout.tsx 의 jsdelivr CDN link + preconnect + SRI 제거. globals.scss 의 font stack 첫 자리에 `var(--font-sans-loaded)` 추가. zero CLS + 외부 의존 0 + render-blocking 해소.
  - **ProfileCard avatar 분기** — localPreview (object URL) 만 raw `<img>`, server avatar URL 은 `next/image` (fill + sizes=100px). avatar 80px 의 AVIF 절약 미미하나 정합성 측면.
  - **PPR (Partial Prerendering) 시도 → 실패 → 보류** — `experimental.ppr: 'incremental'` 추가 후 `npm run build` 시 `"can only be enabled when using the latest canary version of Next.js"` 에러. 우리 Next 15.5.18 stable 에선 PPR 도입 불가. Next 16 stable 출시 후 재검토. next.config 에 시도 history 코멘트 명시.
  - **build 검증**: production build 성공. Shared first load JS **104 kB** (이전 자율 진단의 1.75MB 는 dev artifact 의 우연한 glob match — size 명령 build 강제 fix 로 해소). vitest 192 passed.
- **2026-06-14**: Next.js 영역 추가 진단 후속 (cold start 외):
  - **size-limit production gate** — local 측정 정합 보장. `npm run size` 가
    `next build && size-limit` 으로 build 강제. CI 는 별도 build step 후 `size:ci`
    호출 (size-limit 만). local 에서 dev artifact 우연한 match 회피.
  - **DestinationPhotos 단일 hero `next/image` 마이그** — LCP 후보가 raw `<img>` 라
    AVIF/WebP 변환 우회 중이었음. fill + priority + sizes 적용. CSS 의 wrap 으로
    aspect-ratio 옮기고 fill 모드 정합 (CLS 0 유지). Carousel slide 는 별도 작업.
  - **자율 진단 후속 보류** (high ROI 이나 큰 작업):
    · Pretendard self-host (next/font/local) — layout.tsx:122 의 주석 본문 활성
    필요. woff2 subset 비용 있음. CSS render-blocking 해소 가치 크나 별도 milestone.
    · `*Client.tsx` wrap 패턴 leaf 분리 (MyPageClient / RankingPageContent /
    RegionDetailTabs) — INP 절감. 큰 refactor.
    · PPR (Partial Prerendering) 채택 — Next 15.1+ 안정 검증 후. CDN cache 보강.
- **2026-06-14**: Cold start UX 보강:
  - `(main)/loading.tsx` 신설 — `/`, `/letter`, `/mypage`, `/notifications`, `/settings`, `/quiz`, `/ranking`, `/tournament` 등 (main) 그룹 모든 경로 공용 fallback. cold start 동안 흰 화면 → page-skeleton 으로 체감 ↑.
  - `(auth)/loading.tsx` 신설 — `/login`, `/signup`, `/find-id`, `/forgot-password`, `/reset-password`, `/onboarding` 진입 시 form 형태 skeleton.
  - CDN cache 확대 — `/quiz`, `/ranking` (public + non-user-specific) 추가. 기존 region/destination 외 2 페이지 더 CDN edge 캐싱.
  - 미적용 대상 명시 — `/quiz/result`, `/quiz/share` 는 사용자별 결과라 cache 제외.
  - i18n cookies() 의존으로 ISR 직접 사용은 여전히 차단 — loading.tsx + CDN cache 가 그 대안. BACKLOG `2026-06-10` ISR 항목의 후속.
  - 검증: tsc 0 / vitest 192 passed (FestivalCarousel.test 의 stubResponse param type narrow).
- **2026-06-12**: 보강 추가 패스 (전수 진단 medium ROI):
  - dependency safe patch — axios 1.16→1.17 / embla-carousel 8.3→8.6 (React 19 안정성 향상) / @tanstack/react-query 5.100→5.101.
  - npm audit — esbuild dev 한정 CVE 3건 (high) 확인. 운영 runtime 영향 0 (dev server 만 영향). vite 8 breaking change 동반이라 별도 milestone 후보.
  - 신규 테스트 +12 (177→189) — `DdayBadge.test` (3) / `FestivalCarousel.test` 3단계 폴백 분기 (4) / `client-error-reporter.test` (5). 회귀 위험 큰 영역 우선 커버.
- **2026-06-12**: Top 5 보강 일괄 (전수 진단 후속):
  - i18n en 누락 3 key 추가 — `tournament.play.emptyPool.{title,hint,back}`. 영어 사용자 미번역 노출 해소.
  - **observability 최소선** — `/api/client-error` route + `lib/client-error-reporter.ts` (sendBeacon 우선 + fetch fallback + dev console). `installGlobalErrorReporters()` 가 window.onerror / unhandledrejection 글로벌 캡쳐. react-query queryCache.onError 도 5xx + network 만 보고 (4xx 사용자 입력 skip). PII 미포함. Sentry 없이 운영 client crash 가시성 확보.
  - **auth-store PII 축소** — persist partialize 가 email/id/username 제외, `nickname/avatarUrl/isOnboarded/homeRegion/travelType` 만 저장. XSS 1회 시 PII 노출 위험 차단. 메모리 state 는 전체 (useMe refetch 시 복원).
  - **홈 RSC streaming** — HomeDashboard 를 Server Component 화. season-aware QuickActions 만 `HomeQuickActions.tsx` client island 로 분리. shell HTML 즉시 paint + 위젯 streaming.
  - **PWA install gate** — visit count ≥ 3 일 때만 InstallPromptBanner 노출. 즉시 거부로 영구 dismiss 되던 회귀 차단.
  - **theme_color light/dark 분기** — viewport.themeColor 를 prefers-color-scheme media 별 #ffffff / #0a0a0a 로. light 모드 dark status bar 부조화 해소.
- **2026-06-12**: Figma MCP 워크플로우 가이드 — `docs/FIGMA_INTEGRATION.md` 신설. Tokens Studio variable 명을 코드 CSS 변수 (`--color-bg`, `--space-N`, `--radius-*` 등) 와 1:1 매핑하는 매니페스트 + MCP server 등록 (`figma-developer-mcp`) + 운영 룰 (raw hex/px 금지 / primitive 재사용 우선 / dark·360 검증). 디자이너 측 Tokens Studio 셋업만 끝나면 Claude 가 Figma URL → 기존 토큰/primitive 자동 매핑.
- **2026-06-12**: `local` 카테고리 cleanup — UI 의 모든 영역에서 미노출 + BE 도 안 보내는 dead enum. mock seed (destinations / tournament / travel-types), i18n (ko/en category.local 라벨), `RecommendationBanner` 의 local tone 분기, `emoji-map` 의 local 키, "local 미노출" 정책 코멘트 모두 제거. `RegionContentType = Exclude<DestinationCategory, 'local'>` narrowing 도 무용해져 폐기. 남은 잔재는 `src/api/generated/schemas/destinationCategory.ts` 의 enum 정의만 — BE 측 swagger 갱신 후 orval 재생성으로 자동 정리.

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

- **hreflang alternates + URL-based locale** (L, 8-12 시간) — `layout.tsx` generateMetadata 에 `alternates.languages` 추가 + next-intl routing 변경 (`defineRouting` + middleware locale prefix + 32+ Link/router import 교체). 현재 cookie 기반 locale → URL prefix 도입 시 부수 효과로 `cookies()` 의존 제거 → **static generation / ISR 직접 사용 가능 → cold start 추가 개선**. 다만 한 번 시도 후 revert 경험 (commit `8f0d83c` 의 Option A — `app/[locale]/...` segment 요구로 모든 페이지 404). 영어권 유입 비중이 의미 있게 늘 때 (analytics 확인 후) 도입. **2026-06-14 결정: 보류** — 본 작업 비용 (1.5일 + 회귀 risk) 대비 한국 시장 한정 단계에선 ROI 낮음. cold start 는 loading.tsx + CDN cache 로 우선 cover.
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

(현재 비어있음. 2026-06-10 `getBlurDataURL` + `plaiceholder` devDep 삭제 — 호출 0건 dead infra 청소. LCP 측정 후 실제 후보 식별되면 재작성 권장: SSR `cache(async (src) => plaiceholder buffer → base64)` 38줄 + `next/image` 의 `placeholder="blur"` + `blurDataURL` 조합. 단, 진짜 LCP element 인 `DestinationPhotos` 가 raw `<img>` 라 next/image 마이그 선행 필요.)

---

## 3-1. 운영 BE 배포 (진행 중)

**도메인**:

- **BE**: `tripbite.duckdns.org` (DuckDNS dynamic DNS + docker). 사용자가 BE 컨테이너 빌드/배포 중.
- **FE** (임시): `trip-bite-mxue.vercel.app` (Vercel 자동 생성). custom domain 받으면 갱신.

⚠ 두 도메인은 **cross-origin** (eTLD+1 다름) — cookie 가 SameSite=None+Secure 필요.

**BE 측 확인 사항** (FE 가 정합하려면 BE 가 이렇게 설정):

- HTTPS 필수 — Let's Encrypt + reverse proxy (nginx/caddy) 또는 cloudflare tunnel. DuckDNS 자체는 HTTP 만 제공
- CORS: `Access-Control-Allow-Origin: https://trip-bite-mxue.vercel.app` (정확 일치, wildcard X) + `Access-Control-Allow-Credentials: true`
- Cookie: cross-origin 이므로 **`Set-Cookie: SID=...; SameSite=None; Secure; HttpOnly; Path=/`** 필수
- Session cookie 이름: `SID` (FE `NEXT_PUBLIC_SESSION_COOKIE` 기본값과 일치)
- Preview 배포 도메인 (`*.vercel.app`) 도 CORS allow 하면 PR preview 검증 가능 — 옵션

**BE 측 차단 발견** (2026-06-11 운영 smoke):

- `POST /v1/auth/login` → `403 {"code":"CSRF","message":"잘못된 요청입니다."}`. 모든 state-changing 요청 차단 (Origin 헤더 유무 무관).
- BE 측 CSRF 정책 결정 필요 — 권장: **Origin allowlist** (`Origin === https://trip-bite-mxue.vercel.app` 통과) + `Set-Cookie: SID=...; SameSite=None; Secure`.
- 운영 `/v1/docs-json` 404 — Swagger 비활성. orval 운영 build fail 방지를 위해 **FE 가 `src/api/generated/` 를 git commit** (2026-06-11 적용) + `prebuild` fail-soft.

**BE 정리 요청** (2026-06-12 발견):

- `DestinationCategory` enum 에서 `'local'` 제거 — UI 의 모든 영역에서 미노출이고 BE 응답에도 안 보내는 dead enum. swagger 갱신 후 FE 가 orval 재생성하면 자동 정리 (cleanup 완료된 generated 파일이 깨끗해짐).

**FE 측 배포 후 작업** (BE CSRF 통과 시):

1. Vercel env 등록 (`docs/DEPLOY.md` 참조) — `NEXT_PUBLIC_API_URL=https://tripbite.duckdns.org/v1` (말미 `/v1` 필수 — next.config rewrites 가 path 만 부여)
2. `OPENAPI_URL=https://tripbite.duckdns.org/v1/docs-json` (BE 노출 시. 미노출이면 prebuild fail-soft 가 cached generated 사용)
3. `npm run be:check` — smoke / anon / onboarded / login 4종 회귀 (운영 API 대상, script env 인자화 후)
4. `images.remotePatterns` 갱신 — BE 가 이미지를 자체 도메인에서 호스팅하는 경우 (R2/S3 등)
5. Vercel preview → production 승격
6. 매뉴얼 smoke (`docs/PWA_VERIFICATION.md` 의 매뉴얼 체크리스트)

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
- ✅ **매뉴얼 검증 체크리스트** — `docs/PWA_VERIFICATION.md` 신설 (A~I 영역: 가상키보드 / pull-to-refresh / install / 푸시 / SW/오프라인 / UX / 결과 템플릿 / 빈도 / Android 별도)
- **남은 작업**: 운영 빌드 실기기로 위 체크리스트 1회 수행. **M**.

### 5-3. 푸시 — 클라이언트 잔여

- 권한 거부 후 재요청 UX (iOS OS 설정 안내)
- Subscription expire 자동 갱신
- `MockPushTrigger` 운영 build 에서 자동 미노출 검증 (`MSW_ENABLED` 분기 ✅)

---

## 6. 테스트 커버리지

### 6-1. vitest 단위 (총 177개 — 28 files)

핵심 도메인 + UI primitive 모두 커버:

- `bracket.ts` (23) — Fisher-Yates / pairRound / nextPow2 / roundLabelKey
- `tournament-store.ts` (7) — persist + partialize
- `Bracket.tsx` (5) — 1/2/3/4 인 매치 시나리오
- `use-letters.ts` (4) — like/save optimistic + 롤백
- `AuthBootstrap.tsx` (5) — 4 redirect 분기
- `use-push-notification.ts` (5) — 5 상태
- **UI primitive 5종 (2026-06-10 추가, +32 cases)** — `TextField` / `MediaThumb` / `RadioGroup` / `Dialog` / `Tabs`
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
