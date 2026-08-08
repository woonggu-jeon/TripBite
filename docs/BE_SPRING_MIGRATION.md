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
- `src/types/api-domain.ts` — FE 도메인 타입 단일 소스. Spring 에 없는 타입(UserDto·DestinationCategory·TravelTypeDto·ComposeLetterDto 등)을 **required shape** 로 정의. 컴포넌트/어댑터는 이 모듈만 import.
- **구 `src/api/generated`(NestJS) 완전 삭제** (2026-08). 어댑터 규칙: Spring 有→`be/` 호출 후 `.data` 언랩+coerce, Spring 無→`api.*` 직접 호출(MSW mock, 실 BE 404).

**인증/미들웨어:** Spring 이 익명에도 JSESSIONID 를 발급 → "쿠키=로그인" 불성립. FE 가 **마커 쿠키 `tripbite.authed`**(auth-store setAuth/clearAuth 관리)를 두고 middleware 가 그것으로 보호경로 게이팅(`NEXT_PUBLIC_AUTH_COOKIE`). 실제 게이트는 API 403. interceptor 가 403(빈 body)을 미인증으로 처리.

**로컬/포트:** dev·start·e2e 전부 **포트 3000** (Spring CORS 가 localhost:3000 만 허용). `.env.local`: `NEXT_PUBLIC_API_URL=https://trip-bite.o-r.kr`, `NEXT_PUBLIC_USE_MSW=false`, `NEXT_PUBLIC_AUTH_COOKIE=tripbite.authed`.

**편지 compose 계약:** `body`(정확히 5자) + `location.regionCode`(충북 시군, 필수) + `isAnonymous`(필수, 구 `anonymous` rename). BE 가 잘못된 입력에 500→**400 VALIDATION+details** 로 수정 완료.

---

## 2. 검증 현황 (2026-08-08)

| 게이트                                | 결과                                          |
| ------------------------------------- | --------------------------------------------- |
| 타입체크 (앱코드)                     | ✅ 0                                          |
| lint                                  | ✅ 에러 0                                     |
| vitest (유닛, MSW)                    | ✅ 248 passed / 13 skip                       |
| jest (순수 로직)                      | ✅ 33 passed                                  |
| **be:contract (실 Spring, 세션주입)** | ✅ 10 passed                                  |
| **프로덕션 빌드**                     | ✅ 성공                                       |
| 다크모드 런타임                       | ✅ light↔dark 전환                            |
| e2e (playwright, MSW, 포트 3000)      | 🟡 ~90 passed / 6~7 flaky (앱 아님 — 아래 §6) |

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

### 4-B. ⚠️ 부분 대체 — 가능하나 UX/정확도/보안 저하

| 현 호출                                  | 대체 방법                                                                                | 트레이드오프                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------- |
| `POST /location/reverse` (**편지 필수**) | FE 클라측 **충북 11시군 centroid 최근접** 매핑으로 regionCode 산출(외부 지오코딩 불필요) | label(정확 주소) 근사, 충북 밖 좌표 처리 필요 |
| `POST /me/change-password`               | `PATCH /me { password }`                                                                 | **currentPassword 검증 없음(보안 약화)**      |
| `GET /auth/check-username`·`check-email` | 사전확인 제거 → `POST /auth/signup` 의 409 로 처리                                       | 인라인 사전확인 UX 상실                       |
| `GET /rankings` (추천/카테고리/계절)     | `GET /destinations/random` 또는 weekly 랭킹으로 근사                                     | 진짜 추천 로직 아님                           |
| `GET /regions/{code}/summary`            | description/popularity 는 FE 정적 문구(11 시군 고정), heroImage 는 destinations 이미지   | BE 큐레이션 데이터 상실                       |

### 4-C. ⛔ 대체 불가 — 진짜 BE 필요

| 메서드·경로                                             | 용도                       | 사유                                               |
| ------------------------------------------------------- | -------------------------- | -------------------------------------------------- |
| `POST /auth/find-id`·`forgot-password`·`reset-password` | 아이디찾기·비번재설정      | 이메일 발송/토큰 검증 — 서버 필수                  |
| `DELETE /me`                                            | 회원 탈퇴                  | 서버 삭제 필수                                     |
| `POST /me/avatar`·`DELETE /me/avatar`                   | 프로필 이미지              | 파일 스토리지 필수                                 |
| `GET /tournaments/{id}`                                 | 결과 공유 딥링크 cold 복원 | 서버 저장 없이 복원 불가(정상 흐름은 client store) |

**요약:** 18개 중 **5개 FE 전환 완료**(4-A ✅), **5개 부분 대체 가능**(4-B), **진짜 BE 필요 ~8개**(4-C). 4-A 전환으로 BE 신규 요청은 **4-C(+선택적 4-B)** 로 축소됨. **location/reverse(편지 필수)** 도 클라 매핑으로 BE 의존 제거 가능(4-B, 미전환).

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

## 6. e2e 현황 (참고 — 앱 결함 아님)

e2e 는 MSW 결정적 모드 유지가 정답(실 BE 검증은 be:contract 담당). 남은 6~7 실패는 **테스트 flakiness**로, 해당 기능은 수동/유닛/contract 로 정상 입증됨:

- tournament 위저드·signup-flow: **머지 이전부터 flaky**(hydration-race + MSW 폼검증 + 5워커 병렬부하). 앱은 radio/토글/검증 정상 렌더.
- visual 회귀 8건: darwin(로컬) baseline 없음 — CI(win32)에서 생성.
- 안정화(후속): playwright `workers` 축소 + 전역 hydration-wait + preview full-sweep 기대치 재조정.

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
