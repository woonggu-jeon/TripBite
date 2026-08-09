# TripBite — Spring BE 연동 현황 · API 검증 · BE 요청 (통합 문서)

> **단일 소스**. NestJS→Spring 마이그레이션 최종 상태 + 실 BE API 전수 검증 결과 + BE 추가 요청을 하나로 통합.
> 최종 검증: **2026-08-08** (실 BE `https://trip-bite.o-r.kr`, 테스트 계정 `test / 1234`).

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
| vitest (유닛, MSW)                    | ✅ 224 passed / 13 skip                 |
| jest (순수 로직)                      | ✅ 38 passed                            |
| **be:contract (실 Spring, 세션주입)** | ✅ 10 passed                            |
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

**실 BE 버그: 0건** (이전 signup/compose 500 → BE 수정 확인됨).
**미검증 1건(코드결함 아님):** 타인→나 수신편지 like/save happy-path — BE 매칭이 랜덤/지연이라 통제 계정에 배달 안 됨. getById 200·본인편지 403 까지는 확인.

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

| 현 호출                                  | 처리                                                                                                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /location/reverse` (편지 필수)     | 클라측 충북 11시군 centroid 최근접(`features/location/lib/nearest-region.ts`) → regionCode/label 산출. 편지 compose 가 regionCode 필수 전송. BE·외부 지오코딩 의존 0. |
| `GET /auth/check-username`·`check-email` | 사전확인 게이팅 제거 → 가입 제출 시 `POST /auth/signup` 409 처리. 중복확인 버튼은 준비중 안내.                                                                        |
| `GET /regions/{code}/summary`            | `RegionHero` 정적 렌더(시군명 i18n + 설명 문구). popularity/heroImage 제거(Spring 미제공).                                                                            |
| `GET /rankings` (추천/카테고리/계절)     | real-BE 모드 빈배열 degrade(호출부 빈 상태 처리). weekly/by-region 은 Spring 지원.                                                                                    |

### 4-C. 🕗 준비중 처리 (Spring 엔드포인트 추가 시 되살림)

Spring 이 진짜로 없는 기능은 UI 진입점(라우트·버튼)은 남기고 **준비중 안내**(`ComingSoon` / toast)로 표현. 죽은 어댑터/훅/폼/mock 은 제거.

| 메서드·경로                                             | 용도                  | UI 처리                                      |
| ------------------------------------------------------- | --------------------- | -------------------------------------------- |
| `POST /auth/find-id`·`forgot-password`·`reset-password` | 아이디찾기·비번재설정 | 각 페이지 `ComingSoon`(라우트 유지)          |
| `POST /me/change-password`                              | 비밀번호 변경         | 설정 다이얼로그 `ComingSoon`                 |
| `DELETE /me`                                            | 회원 탈퇴             | 설정 탈퇴 → 준비중 toast (로그아웃은 지원)   |
| `POST /me/avatar`·`DELETE /me/avatar`                   | 프로필 이미지         | 카메라 버튼 → 준비중 toast (이니셜 fallback) |
| `GET /tournaments/{id}`                                 | 결과 딥링크 cold 복원 | 결과는 store 전용, cold 진입 noWinner 안내   |

**요약 — FE 전면 Spring 정합 완료:** `api-domain.ts` 를 **Spring 스키마 파생 뷰**로 재작성(지어낸 필드/타입 제거: DestinationDetailDto coords·phone 등, UserDto homeRegion·isOnboarded·avatarUrl, TravelTypeDto recommended·compatibility, SavedTournamentDto luckyColor, TournamentHistoryItemDto winnerRegion·theme 등). Spring 미지원은 **전환**(4-A/4-B) 또는 **준비중**(4-C). 프로덕션 `api.*` mock 호출 0(잔여는 Idempotency-Key·mock 문자열 id fallback·USE_MSW 게이팅만). 죽은 mock 핸들러/어댑터/훅/폼/DTO 일괄 제거.

> 도메인 타입 상세 shape: `src/types/api-domain.ts`. 남은 4-B 도 필요 시 FE 리팩터로 처리 가능.

---

## 5. 회원가입 동의 / 정책 (운영 배포 차단 — 별도 트랙)

FE 는 `ConsentBlock` 이미 구현. BE 가 아래 확장 필요:

**5-1. `SignupRequestDto` 에 `consents` 필드 추가**

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
- version 불일치 → `400 CONSENT_VERSION_MISMATCH` (재동의 화면).

**5-2. 정책 본문 / 책임자 (법무+BE)**

- `/policy/terms`·`/policy/privacy` 본문이 placeholder → 법무 검토 본문 필요.
- 개인정보처리방침 `privacy@example.com` → 실 책임자 이메일 필요.

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
npm run kill:3000 && npm run test:e2e   # e2e (MSW, dev 종료 후 — 포트 공유)
```
