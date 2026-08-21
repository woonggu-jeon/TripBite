# TripBite — Spring BE 연동 현황 · API 검증 · BE 요청 (통합 문서)

> **단일 소스**. NestJS→Spring 마이그레이션 최종 상태 + 실 BE API 전수 검증 결과 + BE 추가 요청을 하나로 통합.
> 최종 검증: **2026-08-21** (실 BE `https://trip-bite.o-r.kr`). Spring **46 ops**(2026-08 계정/프로필 7 ops 추가) 커버리지.
>
> **2026-08-21 업데이트 — P1 계정/프로필 5기능 BE 추가 완료 → FE 전면 배선 + 실 BE 스모크 통과.**
> find-id·forgot-password·reset-password·change-password·회원탈퇴(`DELETE /me`)·프로필이미지(`POST/DELETE /me/avatar`)가
> 모두 준비중 해제되어 실동작(상세 §1). **남은 요청은 hard-block 0건** — §5-A(BE 필요 개선)·§5-B(FE 우회 동작 중)뿐.

---

## 1. 배경 & 최종 아키텍처

| 항목     | 구 (NestJS)         | 신 (Spring Boot, springdoc)                               |
| -------- | ------------------- | --------------------------------------------------------- |
| OpenAPI  | `…/docs-json`       | `https://trip-bite.o-r.kr/v3/api-docs` (39 ops / 10 tags) |
| Base URL | `…/v1` prefix 有    | `https://trip-bite.o-r.kr` (**prefix 無**)                |
| 응답     | data 직접           | `ApiResponse<T> = { success, message, data }` 엔벨로프    |
| id       | 일부 string         | `number`                                                  |
| 세션     | 세션쿠키            | **JSESSIONID** (익명 요청에도 항상 발급)                  |
| 미인증   | 401 `AUTH_REQUIRED` | **403** (빈 body)                                         |

**FE 구조:**

- `src/api/be/` — orval 이 Spring swagger 로 자동 생성(client+react-query+zod+msw). Spring 지원 엔드포인트 단일 소스. `npm run generate:api`.
- `src/types/api-domain.ts` — FE 도메인 타입 단일 소스, **Spring 스키마 파생 뷰**(필드명·enum·존재여부를 Spring 과 일치, 소비 지점에서 required 로 좁힘). 지어낸 필드/타입 없음. 컴포넌트/어댑터는 이 모듈만 import.
- **구 `src/api/generated`(NestJS) 완전 삭제** (2026-08). 어댑터 규칙: Spring 有→`be/` 호출 후 `.data` 언랩+얕은 coerce. Spring 無→**전환**(기존 Spring 재구성) 또는 **준비중**(`ComingSoon`/toast). 프로덕션 `api.*` mock 호출 0(잔여는 Idempotency-Key·mock 문자열 id fallback·USE_MSW 게이팅 한정).

**인증/미들웨어:** Spring 이 익명에도 JSESSIONID 를 발급 → "쿠키=로그인" 불성립. FE 가 **마커 쿠키 `tripbite.authed`**(auth-store setAuth/clearAuth 관리)를 두고 middleware 가 그것으로 보호경로 게이팅(`NEXT_PUBLIC_AUTH_COOKIE`). 실제 게이트는 API 403. interceptor 가 403(빈 body)을 미인증으로 처리.

**로컬/포트:** dev·start·e2e 전부 **포트 3000** (Spring CORS 가 localhost:3000 만 허용). `.env.local`: `NEXT_PUBLIC_API_URL=https://trip-bite.o-r.kr`, `NEXT_PUBLIC_USE_MSW=false`, `NEXT_PUBLIC_AUTH_COOKIE=tripbite.authed`.

**편지 compose 계약:** `body`(정확히 5자) + `location.regionCode`(충북 시군, 필수) + `isAnonymous`(필수, 구 `anonymous` rename). BE 가 잘못된 입력에 500→**400 VALIDATION+details** 로 수정 완료.

---

## 2. 검증 현황 (2026-08-08)

| 게이트                                | 결과                                    |
| ------------------------------------- | --------------------------------------- |
| 타입체크 (앱코드)                     | ✅ 0                                    |
| lint                                  | ✅ 에러 0                               |
| vitest (유닛, MSW)                    | ✅ 225 passed / 13 skip                 |
| jest (순수 로직)                      | ✅ 38 passed                            |
| **be:contract (실 Spring, 세션주입)** | ✅ 12 passed                            |
| **프로덕션 빌드**                     | ✅ 성공                                 |
| 다크모드 런타임                       | ✅ light↔dark 전환                      |
| e2e (playwright, MSW, 6프로젝트)      | ✅ exit 0 (631 passed, 하드실패 0 — §6) |

## 3. 실 BE API 전수 audit (39 ops, 인증 세션 + 유효 payload)

**모든 엔드포인트 정상 동작.** 비-2xx 는 전부 의도된 것:

| 결과          | 엔드포인트                                                                                                                                                                                                                                                                                                                                                                                             | 비고                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| ✅ 2xx        | auth(login·logout·**signup**), destinations(list·random), letters(**compose**·liked·received·saved·sent·getById), me(get·patch), mypage(stamps·tournaments GET/POST·history GET/POST), notifications(list·unread-count·subscriptions·vapid·subscribe·unsubscribe·read-all·{id}/read), regions(ongoing-festivals), settings(get·patch), tournaments(rankings weekly·regions), travel-types(quiz·submit) | 정상                                        |
| ⚪ 404 (정상) | `GET /destinations/{id}`, `DELETE /mypage/tournaments/{id}`, `DELETE /notifications/subscriptions/{id}`                                                                                                                                                                                                                                                                                                | 없는 id 조회                                |
| ⚪ 403 (정상) | `POST /letters/{id}/like·save`, `DELETE /letters/{id}`                                                                                                                                                                                                                                                                                                                                                 | 본인 편지 권한 규칙(`LETTER_ACCESS_DENIED`) |

**엔드포인트 호출 커버리지: 39/39** (2026-08-09 전수 점검). 모든 Spring op 에 FE 호출 경로 존재 — 이전 미연동 3건(`GET /notifications/vapid-public-key`, `GET /notifications/subscriptions`, `DELETE /notifications/subscriptions/{id}`)을 push 구독 흐름(VAPID 서버 조회) + 설정 "알림 기기" 관리 UI 로 연동. `POST /mypage/tournament-history` 는 Idempotency-Key 위해 `api.post` 로 호출(be/ fn 대신).

**실 BE 버그: 0건** (이전 signup/compose 500 → BE 수정 확인됨).
**미검증 1건(코드결함 아님):** 타인→나 수신편지 like/save happy-path — BE 매칭이 랜덤/지연이라 통제 계정에 배달 안 됨. getById 200·본인편지 403 까지는 확인.

> ⚠️ 위 audit 는 **인증 세션 기준**. 아래 엔드포인트는 **익명 요청 시 403**(인증 필수) — 실측 확인(2026-08-16).

### 3-A. 인증 필수 엔드포인트 & 익명 처리 (실측)

익명(로그인 안 함)으로 호출 시 403 나는 것 vs 공개(200):

| 익명 200 (공개)                                                                                                                                                                                                                                                                                                        | 익명 403 (인증 필수)                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /destinations/random`·`/destinations`·`/destinations/{id}` · `GET /tournaments/rankings/weekly`·`/regions` · `GET /regions/ongoing-festivals` · `GET /travel-types/quiz` · `POST /travel-types/submit` · `GET /notifications/vapid-public-key` · auth(login/signup/logout/find-id/forgot-password/reset-password) | `POST /mypage/tournament-history` · `GET /me` · `/mypage/*` · `/letters/*` · `/notifications/*` · `/settings` · `/me/*`(change-password/avatar) |

**퀴즈 공개 전환 — ✅ 해결 (2026-08-21 실측)**: BE 가 `GET /travel-types/quiz` + `POST /travel-types/submit` 을 **whitelist**(익명 200/400 확인) → FE 게이트 제거:

| 엔드포인트                        | 이전(임시)             | 현재(2026-08) | FE 처리                                                                                           |
| --------------------------------- | ---------------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `GET /travel-types/quiz`          | 인증 필수(임시 게이트) | **공개**      | `useTravelTypeQuiz` 게이트 제거 — 익명 응시 가능(`TravelTypeQuiz` 로그인 안내 삭제)               |
| `POST /travel-types/submit`       | 인증 필수              | **공개**      | 익명 제출 → 결과 캐시(`setQueryData`)로 `/quiz/result` 표시. "내 유형으로 적용"(PATCH /me)만 인증 |
| `POST /mypage/tournament-history` | 선택 인증(게스트 기록) | **인증 필수** | (변경 없음) `recordResult` 를 `isAuthenticated` 게이트 — 익명은 store-only, 인증만 저장           |

> 남은 optional-auth 후보: 토너먼트 게스트 기록(`POST /mypage/tournament-history`)을 랭킹 집계에 반영하려면 optional-auth 로 전환 요청(현재는 인증 필수 유지).
>
> 관측: interceptor 는 401/403 을 **정상 인증 신호**로 취급(전역 토스트 skip, 로그 warn). timing interceptor 도 401/403 은 error→warn 강등(콘솔 빨간 에러 오인 방지).

---

## 4. Spring 미지원 엔드포인트 — 대체가능성 분석

FE 는 아래를 `api.*` 직접 호출(현재 MSW mock). 그런데 **상당수는 기존 Spring 엔드포인트로 재구성 가능**(BE 신규 개발 불필요). 아래처럼 3단계로 분류.

> 검증된 enabler: `PATCH /me`(UpdateMeRequestDto)가 **password·travelType·nickname** 등 수정 가능 / `GET /me`가 **travelType(code)** 반환 / `GET /destinations?region=&category=` **region 필터 지원** / `GET /destinations/{id}` 응답에 **region 포함**.

### 4-A. ✅ 전환 완료 — BE 개발 불필요 (FE 리팩터로 해결됨, 2026-08-08)

5건 모두 기존 Spring 엔드포인트로 재구성 완료. `api.*`(MSW) 직접 호출 제거 → `be/` 실 BE 호출. (숫자 id 없는 mock 문자열 id 는 fallback 유지 — e2e MSW 용.)

| 현 호출(제거)                    | 전환 방법                                                                                                    | 구현 위치                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `GET /travel-types/me`           | `GET /me`.travelType(code) + FE 정적 유형맵(`TRAVEL_TYPE_META` 4종) 재구성. recommended 빈배열.              | `constants/travel-types.ts`, `features/ranking/api/ranking.ts` |
| `PATCH /travel-types/me`         | `PATCH /me { travelType: code }` → 정적맵 재구성                                                             | `features/ranking/api/ranking.ts`                              |
| `POST /me/complete-onboarding`   | `PATCH /me { nickname }`(닉네임 있을 때만; 없으면 no-op). 완료표식은 `tripbite.visited` 쿠키(device 신호).   | `features/onboarding/api/onboarding.ts`                        |
| `GET /destinations/{id}/related` | `GET /destinations/{id}` 의 region+category → `GET /destinations?category=&region=` (같은 시군, 자기 제외 6) | `features/tournament/api/tournament.ts`                        |
| `GET /regions/{code}/contents`   | `GET /destinations?category=&region={code}` (탭별 category / 'all' 은 3 카테고리 병렬 병합, pageNo cursor)   | `features/region/api/region.ts`                                |

> 전환 근거(enabler)는 모두 실 BE 검증됨: `GET /destinations` 는 **category 필수**·region 선택. `PATCH /me` 는 travelType/nickname 수정. `GET /me` 는 travelType(code) 반환.
> 잔여 MSW mock 핸들러(travel-types/me·complete-onboarding·regions/contents)는 실 BE 모드에서 미도출(inert) — e2e mock 및 문자열 id fallback 위해 존치.

### 4-B. ✅ 전환/정적 처리 완료 (2026-08-08, FE 전면 정합)

| 현 호출                                  | 처리                                                                                                                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /location/reverse` (편지 필수)     | 클라측 충북 11시군 centroid 최근접(`features/location/lib/nearest-region.ts`) → regionCode/label 산출. 편지 compose 가 regionCode 필수 전송. BE·외부 지오코딩 의존 0.                 |
| `GET /auth/check-username`·`check-email` | 사전확인 게이팅 제거 → 가입 제출 시 `POST /auth/signup` 409 처리. 중복확인 버튼은 준비중 안내.                                                                                        |
| `GET /regions/{code}/summary`            | `RegionHero` 정적 렌더(시군명 i18n + 설명 문구). popularity/heroImage 제거(Spring 미제공).                                                                                            |
| `GET /rankings` (추천/카테고리/계절)     | **추천(recommended)은 `GET /destinations/random` 으로 전환** — 메인 상단 배너/카테고리픽 실데이터 표시. 카테고리/계절/hidden-gems 만 빈배열 degrade. weekly/by-region 은 Spring 지원. |

### 4-C. 준비중 처리 (Spring 엔드포인트 추가 시 되살림)

Spring 이 진짜로 없는 기능은 UI 진입점(라우트·버튼)은 남기고 **준비중 안내**(`ComingSoon` / toast)로 표현. 죽은 어댑터/훅/폼/mock 은 제거.

**✅ 2026-08-21 해제 완료** — 아래 계정/프로필 6종은 BE 추가되어 준비중 → 실동작 배선 완료(§5 P1):
`POST /auth/find-id`·`forgot-password`·`reset-password`, `POST /me/change-password`,
`DELETE /me`(회원탈퇴), `POST /me/avatar`·`DELETE /me/avatar`(프로필 이미지).

| 메서드·경로             | 용도                  | UI 처리                                                  |
| ----------------------- | --------------------- | -------------------------------------------------------- |
| `GET /tournaments/{id}` | 결과 딥링크 cold 복원 | 결과는 store 전용, cold 진입 noWinner 안내 (🔷 §5-A A-2) |

**요약 — FE 전면 Spring 정합 완료:** `api-domain.ts` 를 **Spring 스키마 파생 뷰**로 재작성(지어낸 필드/타입 제거: DestinationDetailDto coords·phone 등, UserDto homeRegion·isOnboarded·avatarUrl, TravelTypeDto recommended·compatibility, SavedTournamentDto luckyColor, TournamentHistoryItemDto winnerRegion·theme 등). Spring 미지원은 **전환**(4-A/4-B) 또는 **준비중**(4-C). 프로덕션 `api.*` mock 호출 0(잔여는 Idempotency-Key·mock 문자열 id fallback·USE_MSW 게이팅만). 죽은 mock 핸들러/어댑터/훅/폼/DTO 일괄 제거.

> 도메인 타입 상세 shape: `src/types/api-domain.ts`. 남은 4-B 도 필요 시 FE 리팩터로 처리 가능.

---

## 5. BE 추가 요청 — 남은 항목만 (2026-08-21 갱신)

> **완료·테스트된 항목은 제외**(계정/프로필 P1 = §1). 여기엔 **아직 Spring 에 없는 것만**.
> **⚠️ 앱을 못 쓰게 하는 hard-block 은 0건** — 아래는 전부 "있으면 완성도↑"다.
> 구분: **5-A** = FE 로 만들 수 없어 BE 있어야 되는 개선 · **5-B** = FE 우회로 이미 동작(BE 는 품질).
> 응답은 기존 `ApiResponse<T> = { success, message, data }` 엔벨로프, 미인증 403 규약 준수.

| 구분                    | 항목                                                                | 현재/판정                                      |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------- |
| **5-A 🔷 BE 필요 개선** | 아이디/이메일 중복확인 · 결과 딥링크 · 상세 필드확장 · 아바타 캐시  | 없어도 앱 동작, FE 우회는 불가                 |
| **5-B ⚙️ 대체 중**      | ★★★ 추천(→random) · ★★ 시군콘텐츠(→3배요청) · 연관여행지(→같은시군) | 실데이터 동작 중, 실 API 는 품질↑              |
| **제거**                | 카테고리/계절 랭킹 · 시군 큐레이션                                  | UI 미노출 / `/region` 스코프 제외 → 요청 안 함 |
| **P3 배포차단**         | 회원가입 동의(consents) + 정책 본문                                 | ConsentBlock 구현·법무 대기                    |

---

> 계정/프로필 P1 5기능(find-id·forgot·reset·change-password·회원탈퇴·아바타)은 **BE 추가 + FE 배선 + 실 BE 스모크 완료(2026-08-21)** → §1 로 이동, 본 요청 목록에서 제외.

### 5-A. 🔷 BE 있어야 되는 개선 (FE 우회 불가 — 단, 없어도 앱은 동작)

FE 가 데이터를 생성할 수 없는 것들. **필수는 아니고**(현재도 대체 흐름으로 앱은 정상), BE 가 주면 기능이 완성된다.

**A-1. 아이디/이메일 중복확인 — `GET /auth/check-username?username=` · `GET /auth/check-email?email=`**

- res `ApiResponse<{ available: boolean }>`.
- 현재: 가입 제출 시 **409 로 중복 차단 = 기능 자체는 정상**. 다만 입력 중 **인라인 실시간 확인은 불가**(`SignupForm` 중복확인 버튼 준비중). → UX 개선.

**A-2. 토너먼트 결과 딥링크 — `GET /tournaments/{id}`**

- res `ApiResponse<{ id, winner:DestinationDto, runnerUp, matchesPlayed, tournamentSize, completedAt }>`.
- 현재: 결과는 세션 내 정상 표시. **공유 링크/새로고침 cold 진입만 복원 불가**(store 비어있음). → 공유 기능 보강. (기록은 `POST /mypage/tournament-history` 로 저장됨 — 그 id 로 복원 가능하게.)

**A-3. 여행지 상세 필드 확장 — `DestinationDetailDto` 에 `phone`·`website`·`openingHours`·`restDate`·`parking`·`coords(lat/lng)` 추가**

- 현재 Spring DTO = id·name·category·region·imageUrl·images·address·type·admissionFee·description·tags·eventStart·eventEnd (상세 페이지 정상 동작, 해당 행만 숨김).
- TourAPI 원본엔 존재. 좌표 제공 시 길찾기를 **좌표 기반 정밀 경로**로 승격(현재 이름검색). FE: `WinnerDetailPanel` 행 + `DestinationActions` 좌표 분기 복원(주석에 방법 명시).

**A-4. 아바타 캐시 무효화 + 작은 이미지 처리** (Spring 구현 특성발 품질 이슈)

- avatarUrl `{userId}.jpg` **고정** → 재업로드해도 URL 불변, 캐시 stale. **FE `?v={/me dataUpdatedAt}` 우회 적용 중**(당장은 동작). BE 가 **버전 URL(`?v=hash|epoch`)** 또는 `/uploads/avatars/*` `Cache-Control: no-cache` 제공 시 FE 우회 제거.
- 작은/비정상 이미지 업로드 시 `500`(정상 크기 PNG 는 201) → `422`(형식/크기)로 정규화 요청.

### 5-B. ⚙️ 대체 중 — FE 우회로 동작, 실 엔드포인트는 품질 개선(권장 ★)

FE 가 기존 Spring API 로 재구성해 **정상 동작 중**. 아래 ★ 항목은 우회 한계가 뚜렷해 실 엔드포인트를 권장.

**B-1. 추천 여행지 — `GET /destinations/recommendations` · ★★★ 강력 권장**

- 우회: `GET /destinations/random`(+category).
- **한계(치명적)**: 화면엔 "추천"이라 뜨지만 실제는 **무작위**다. ① 진입마다 결과가 바뀜(비결정적) → 추천으로 신뢰 못 함, ② 개인화·가중치·인기도 반영 0, ③ `random` 은 토너먼트 풀 겸용이라 `size<4` 면 409.
- **노출 범위**: 홈 상단 배너 · 카테고리픽 · 유형결과 "이런 여행지가 어울려요" — **앱 첫 화면 핵심**.
- 실 API 이점: 안정적·랭킹/인기 기반 추천. (유형별 추천 목록도 `type` 파라미터로 함께 해결.)

**B-2. 시군 콘텐츠 목록 — `GET /regions/{code}/contents` · ★★ 권장**

- 우회: `GET /destinations`(region·category 필터)를 **카테고리 3개 병렬 호출 후 클라 병합**.
- **한계**: ① 요청 **3배**, ② 페이지네이션 근사치("어느 카테고리든 꽉 차면 더 있음"), ③ 서버 큐레이션 정렬 없음.
- 실 API 이점: 단일 요청 + 정확한 커서 + 서버 큐레이션.

**B-3. 연관 여행지 — `GET /destinations/{id}/related` · ☆ 낮음**

- 우회: 상세의 `region`+`category` 로 **같은 시군 동일 카테고리 6개** 재구성(`tournament.ts` getRelatedDestinations). 사용자에겐 자연스러운 "주변 비슷한 곳".
- 실 API 이점: 진짜 유사도/추천 기반 연관. 현 우회로도 충분해 우선순위 낮음.

> **완전 대체 → 요청 안 함**(품질 손실 0): `GET·PATCH /travel-types/me` → `GET·PATCH /me`(travelType 코드) **완전 동등**(실측 PATCH `explorer`→GET 반영). 목록 `DestinationDto.address` 이미 Spring 제공.
> **제거 → 요청 안 함**: 카테고리/계절 랭킹(`GET /rankings`) = 랭킹 페이지에 UI 미노출(구 mock 섹션 제거됨). 시군 큐레이션(`GET /regions/{code}/summary`) = `/region` 스코프 제외(기획).
> **그 외**: `POST /mypage/tournament-history` 게스트 기록을 랭킹 집계 반영하려면 optional-auth 전환(현재 인증 필수).

---

### P3 — 회원가입 동의 / 정책 (운영 배포 차단 — 법무 트랙)

**P3-1. `SignupRequestDto` 에 `consents` 필드 추가**

```ts
consents: {
  type: 'age14' | 'terms' | 'privacy' | 'location' | 'marketing';
  agreed: boolean;
  version: string;
}
[];
```

| type                    | 필수 | 거부 시                                              |
| ----------------------- | ---- | ---------------------------------------------------- |
| age14 / terms / privacy | 필수 | 가입 거부 `400 CONSENT_REQUIRED` (`details.missing`) |
| location / marketing    | 선택 | 가입 진행 (기능/발송 제한)                           |

- 저장: `user_consents`(userId+type+agreed+version+agreedAt), 철회/재동의는 새 row(이력). `location`/`marketing` 은 `/me/consents` 로 추후 변경.
- version 불일치 → `400 CONSENT_VERSION_MISMATCH` (재동의 화면). FE `ConsentBlock` 이미 구현 — 필드만 수신하면 됨.

**P3-2. 정책 본문 / 책임자 (법무+BE)**

- `/policy/terms`·`/policy/privacy` 본문 placeholder → 법무 검토 본문 필요.
- 개인정보처리방침 `privacy@example.com` → 실 책임자 이메일 필요.

---

### (참고) 스키마 정합 요청 — 기존 응답 필드 보강

- ~~`UserResponseDto.avatarUrl`~~ ✅ 추가됨(2026-08, P1-5 연동 완료).
- `TournamentSummaryDto` 에 `winnerId`(정수) 추가 시 히스토리에서 우승지 상세 딥링크 가능(현재 winnerName 만).
- `DestinationDetailDto` 확장(§5-A A-3) — phone·website·openingHours·restDate·parking·coords.

> **"기존 mock 에만 있던 컬럼" 정리 결과:** luckyColor·compatibility·homeRegion·isOnboarded·winnerRegion 등은 화면에서 소비된 적 없어 안전 제거. 상세 phone/website/좌표·region 인기도는 mock 전용이라 실 BE 기준 손실 없음 — 필요 시 §5-A 로 복원. 깨진 참조 0(tsc + 전수 grep 확인).

### 화면 × API 매핑 전수 감사 (2026-08-10)

> 코드 내 `BE-TODO(§5 …)` 주석과 1:1 대응 (전수: `grep -rn "BE-TODO" src`). ✅ 정상 · 🔷 BE 필요 개선(§5-A, FE 우회불가·없어도 앱 동작) · ⚙️ 대체됨(§5-B, 실 Spring 재구성) · 🗑️ 제거(요청 안 함).

| 화면 (route)                       | 사용 Spring API                                                                                                                   | 상태                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 로그인 `/login`                    | POST /auth/login · GET /me                                                                                                        | ✅                                                                             |
| 회원가입 `/signup`                 | POST /auth/signup                                                                                                                 | ✅ · 중복확인 🔷(§5-A A-1, 현재 409 사후 안내)                                 |
| 아이디찾기 `/find-id`              | POST /auth/find-id                                                                                                                | ✅ (P1-1)                                                                      |
| 비번찾기/재설정 `/forgot`·`/reset` | POST /auth/forgot-password · reset-password                                                                                       | ✅ (P1-2)                                                                      |
| 홈 `/`                             | GET /destinations/random · /regions/ongoing-festivals                                                                             | ✅                                                                             |
| 홈 상단 배너/카테고리픽            | GET /destinations/random (recommended 전환)                                                                                       | ✅ ⚙️(§5-B, 실데이터 표시)                                                     |
| 랭킹 `/ranking`                    | GET /tournaments/rankings/weekly·regions                                                                                          | ✅ (RSC 프리페치) · 카테고리/계절 랭킹 🗑️(제거 — UI 미노출)                    |
| 퀴즈 `/quiz`                       | GET /travel-types/quiz · POST /travel-types/submit                                                                                | ✅ **공개**(BE whitelist 2026-08, 익명 응시) — 결과 "적용"만 인증              |
| 토너먼트 `/tournament`·`/play`     | GET /destinations/random                                                                                                          | ✅                                                                             |
| 토너먼트 결과 `/tournament/result` | POST /mypage/tournament-history · GET /destinations/{id}                                                                          | ✅ · 기록 저장 🔒 인증만(익명 생략, §3-A) · 딥링크복원 🔷(§5-A A-2)            |
| 여행지 상세 `/destination/{id}`    | GET /destinations/{id}                                                                                                            | ✅ · phone/website/좌표 🔷(§5-A A-3) · 길찾기 ⚙️(이름검색) · 연관 ⚙️(§5-B B-3) |
| 시군 `/region`·`/region/{code}`    | GET /destinations(필터) · /regions/ongoing-festivals                                                                              | ✅ · summary 🗑️(스코프 제외) · contents ⚙️(§5-B B-2)                           |
| 편지 `/letter`·compose·sent·{id}   | GET/POST /letters\* · like/save · GET /letters/{id}                                                                               | ✅ · 위치 ⚙️(클라 centroid 매핑)                                               |
| 마이 `/mypage`                     | GET /me · /mypage/stamps · /mypage/tournaments · /mypage/tournament-history · POST/DELETE /me/avatar                              | ✅ · 아바타 ✅(P1-5, 캐시버스트 후속)                                          |
| 도장책 `/mypage/stamps`            | GET /mypage/stamps                                                                                                                | ✅                                                                             |
| 여행유형 결과 `/quiz/result`       | POST /travel-types/submit · GET /me                                                                                               | ✅ · 추천 여행지 ⚙️(§5-B, category-random)                                     |
| 알림 `/notifications`              | GET /notifications · unread-count · POST {id}/read · read-all                                                                     | ✅                                                                             |
| 설정 `/settings`                   | GET /settings · PATCH /settings/notifications · vapid·subscribe·subscriptions·unsubscribe · POST /me/change-password · DELETE /me | ✅ · 비번변경 ✅(P1-3) · 탈퇴 ✅(P1-4)                                         |

**✅ 계정/프로필 5기능 준비중 해제 완료**(2026-08-21, BE 추가+FE 배선+스모크). **hard-block 0건.** 🔷 **BE 필요 개선(FE 우회 불가, 없어도 앱 동작)** = §5-A(중복확인·결과딥링크·상세필드·아바타캐시). **⚙️ 대체됨(FE 우회 동작)** = §5-B(추천·시군콘텐츠·연관여행지). **🗑️ 제거** = 카테고리/계절 랭킹(UI 미노출)·시군 큐레이션(스코프 제외). 나머지 ✅ = 완전 정상.

---

## 6. e2e 현황 (하드닝 완료 2026-08-09)

6 프로젝트 전량 실행 **exit 0 (631 passed, 하드 실패 0)**. 하드닝 과정에서 e2e 가 드러낸 실제 앱 버그 2건 수정:

- **signup 가입 불가 버그**: `SignupForm` 이 Spring 필수 `name`·`birthDate` 필드를 렌더 안 해 `isValid` 영구 false → 제출 불가. 두 필드 추가로 해결.
- **tournament 쿼리 프리필 버그**: `?theme=season&season=spring` 을 `useState` 초기화에서만 읽어 SSR 하드로드/새로고침 시 step 1 고정. 마운트 후 재동기화 `useEffect` 추가.

테스트 안정화: interactions '지역 카드 없음'(설명 텍스트 오매칭 → radio 개수 단정), full-sweep A-02/A-05(빈 폼 disabled 게이팅 인정), tournament-full(category '다음' 클릭), C-04(타임아웃 상향). config: `workers` 상한(로컬3/CI2) + `retries` 로컬1 + expect/action/nav 타임아웃 상향.

- 잔여 flaky(a11y axe 스캔·full-sweep best-effort 등)는 `retries:1` 로 흡수 — 하드 실패 아님.
- visual 회귀: `maxDiffPixelRatio 0.1` 허용 내 통과(정합 UI 변경분 반영). darwin/win32 baseline 은 플랫폼별 파일로 공존.

## 7. 운영(Vercel) 배포 체크리스트

- env: `NEXT_PUBLIC_API_URL=https://trip-bite.o-r.kr`, `NEXT_PUBLIC_AUTH_COOKIE=tripbite.authed`, `NEXT_PUBLIC_USE_MSW`(정책).
- **BE CORS 에 Vercel 도메인 추가** (현재 localhost:3000 만 허용).
- 운영 쿠키 cross-site: `Secure; SameSite=None` — BE 확인.
- §5 동의/정책 3건 (법적 배포 차단).

## 8. 개발/테스트 실행

```bash
npm run dev            # 포트 3000, 실 Spring (USE_MSW=false)
npm run test:run       # vitest (MSW)
npm run test:jest      # jest (node)
npm run be:contract    # 실 Spring 어댑터 계약 (BE_CONTRACT=1)
npm run kill:3000 && npm run test:e2e        # e2e (MSW, dev 종료 후 — 포트 공유)
npm run kill:3000 && npm run test:e2e:real   # 실 BE 스모크(18): 공개12+상세+배너+다크3+인증8라우트
```
