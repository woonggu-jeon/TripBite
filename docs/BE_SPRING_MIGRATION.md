# BE Spring 마이그레이션 진행 플로우

> BE가 **NestJS → Spring Boot(springdoc)** 로 교체됨에 따른 FE API 재연동 작업 추적 문서.
> 각 feature: **구현 → 검증(tsc/test) → 본 문서 갱신** 사이클로 진행.

## 배경

| 항목         | 기존 (NestJS)      | 신규 (Spring Boot)                                     |
| ------------ | ------------------ | ------------------------------------------------------ |
| OpenAPI JSON | `…/docs-json`      | `https://trip-bite.o-r.kr/v3/api-docs`                 |
| Swagger UI   | `…/docs`           | `https://trip-bite.o-r.kr/swagger-ui/index.html`       |
| Base URL     | `…/v1` (prefix 有) | `https://trip-bite.o-r.kr` (**prefix 無**)             |
| 응답 형태    | data 직접          | `ApiResponse<T> = { success, message, data }` 엔벨로프 |
| id 타입      | 일부 string        | `number`                                               |
| 엔드포인트   | 다수               | 19 ops / 7 tags                                        |

## 전략 (사용자 승인)

- **겹치는 기능만 연동 + BE 없는 기능은 mock 유지.**
- 구 `src/api/generated/` **동결** → BE 미지원 기능(letter·notification·onboarding·settings·location 등) old shape 보존해 mock 무변경 동작.
- 신규 Spring 클라이언트 → `src/api/be/` (orval live output).
- 규칙: **새 BE에 있는 엔드포인트만 `be/`로 rewiring, 없으면 frozen `generated/`(mock) 유지.**
- 어댑터에서 `ApiResponse.data` unwrap 후 기존 도메인 타입으로 매핑 (도메인 타입/UI 최대한 유지).

## 공통 완료 항목

- [x] `orval.config.ts` output target → `src/api/be/`, input → 새 swagger
- [x] `.env.local` / `.env.example` → `OPENAPI_URL`, `NEXT_PUBLIC_API_URL=https://trip-bite.o-r.kr`
- [x] `src/api/be/` 생성 (7 tags), 구 `generated/` 동결
- [x] baseline: `tsc` 0 에러

## Feature 진행 현황

진행 순서: 독립적 read-only → 얽힌 것 → 세션 필요 → 인증(store ripple 큰 것) 순.
(destination 은 tournament/region/home/상세페이지에 얽혀 있어 뒤로 재배치)

> **현황(최신): BE 오퍼레이션 19→28개로 증가(BE 가 letters 9개 추가). FE 는 27/28 연동 완료(미연동 1건은 소비처 없는 GET /destinations 목록). tsc 0, ESLint 0 error, 유닛 269 passed / 3 skipped, 미커밋.**
>
> **2026-07-23 재감사에서 발견:** BE 가 letters(다섯글자 편지) 9개 + 를 추가 → 이전 "letters mock 유지"는 outdated. letters 전체 be/ 연동 + updateMe(닉네임) be/ 연동 완료.
> **letters 실 BE 실측:** GET received/sent 200(엔벨로프 LetterPageDto) ✅. **POST /letters(compose)는 payload 무관 500(BE 내부 오류 — 400 아님 → 요청 shape 는 통과, BE 버그로 추정)**. 편지 detail/like/save/delete 는 편지가 없어(compose 불가) 실 BE 미검증(스펙+유닛만).
>
> **⚠️ compose 심층 조사 결과(2026-07-23):** `POST /letters` 는 body 2자/5자/6자·location 유무·anonymous 무관 **전부 500**(길이 @Size 검증(400)조차 안 뜸 → 서비스 진입 직후 예외). 게다가 **`POST /auth/signup` 도 모든 payload(full/최소/username만)에서 500** — 즉 신규 유저 생성 자체 불가. 반면 같은 세션에서 `POST /mypage/tournaments`(save 201)·`POST /mypage/tournament-history`(record 201)·login/submit 은 정상 → **BE 전역 장애 아님, signup·letters(compose) 두 엔드포인트가 서버측에서 특정적으로 깨진 BE 버그**. FE 요청은 스펙과 일치(=FE 매핑 정상). **BE 팀 수정 필요.** signup 이 막혀 2번째 유저를 못 만들어 compose 매칭 가설은 검증 불가(단 compose 는 그와 무관하게 500).
>
> → BE 팀 전달용 상세 이슈/재현: **[`BE_REQUEST_signup_letters_500.md`](../BE_REQUEST_signup_letters_500.md)** (repo 루트).
>
> **어댑터 매핑 단위 테스트(mock):** `tournament.test.ts`·`ranking.test.ts`·`mypage.test.ts`·`letter/api/letter.test.ts` — envelope unwrap + 필드 매핑 pin.
>
> **실 BE contract 테스트(mock 아님):** `src/api/be-contract.test.ts` — `BE_CONTRACT=1 npm run be:contract`. MSW 중지 + axios baseURL 을 실 BE 로 교체 + 로그인 세션(JSESSIONID) 주입 → **실제 어댑터 함수를 실 BE 에 붙여** 매핑 검증(me/quiz/rankings/festivals/stamps/destination detail(images→photos)/saved/history/letters received). node 환경 필수(happy-dom 은 Set-Cookie 숨김). compose·signup 500 은 `it.fails` 로 표시(BE 수정 시 실패로 알림). 결과: **8 passed + 2 expected-fail** (실 BE 실측). `BE_CONTRACT` 미설정 시 자동 skip → 오프라인 스위트 무영향.
>
> **실 BE 실측 검증 완료 (2026-07-23, 테스트 계정 test/1234):** 로그인(→JSESSIONID)/me/quiz/submit/rankings(weekly·regions)/stamps/saved(save·list·delete)/history/record/logout 전부 실제 호출 → 응답이 어댑터 매핑과 일치.
> 확인 사항: 엔벨로프 `{success,message,data}`, id 는 number, 상세는 `images`(→photos), save 응답에 luckyColor 없음(→''), login 은 `{userId}`만·프로필은 /me, logout `data:null`.
> 실 BE 특이점: **record(POST /mypage/tournament-history)는 winnerId 없으면 500** — FE 는 실 모드에서 정수 winnerId 를 항상 전송하므로 정상. quiz optionId 는 문항별 1~4(내 mock seed 는 전역 1~20 — mock 내부 일관성만 있어 무해).

| #   | feature                    | 연동 대상(be/)                              | mock 유지                                                       | 상태 |
| --- | -------------------------- | ------------------------------------------- | --------------------------------------------------------------- | ---- |
| 1   | region                     | ongoing-festivals                           | contents, summary                                               | ✅   |
| 2   | travel-type (ranking quiz) | quiz, submit                                | quiz 내결과, apply                                              | ✅   |
| 3   | tournament (rankings)      | weekly, region rankings                     | 브래킷 GET, home 추천                                           | ✅   |
| 4   | destination                | 상세·random                                 | related, 목록(getList1 미소비), home 추천                       | ✅   |
| 5   | mypage                     | stamps, 저장목록·저장·삭제, history, record | avatar, summary(BE없음)                                         | ✅   |
| 6   | me                         | getMe                                       | updateMe(소비처 없음), avatar, changePassword, withdraw(BE없음) | ✅   |
| 7   | auth                       | login, logout, me, signup                   | findId·forgot/reset·check·changePassword·withdraw(BE없음)       | ✅   |

상태 범례: ⬜ 대기 · 🟡 진행중 · ✅ 완료(검증됨)

## ⚠️ 결정 필요 — 발견한 blocker/degradation

### 1. destination id 공간 불일치 (destination/mypage 진행 전 결정 필요)

- 새 BE: 여행지 id 가 **정수**(`getDetail(id: number)`, `DestinationDto.id: number`).
- 현 FE: mock/seed/route/bracket/저장토너먼트가 **문자열 복합 id**(`'boeun-attraction-1'`) 사용.
- `Number('boeun-attraction-1') = NaN` → mock/테스트 파손. 정수화하려면 seeds·route(`/destination/[id]`)·bracket·saved 전반 수정 필요(대공사).
- 선택지: (a) mock seed 를 정수 id 로 전환(대공사) / (b) destination 상세·random 은 당분간 mock 유지하고 실 BE 목록/상세만 정수 id 로 동작(실 BE 모드에선 일관, mock 모드는 문자열 유지 — 어댑터가 숫자면 그대로, 아니면 mock 경로) / (c) 상세/random 은 다음 스프린트로 보류.

### 2. destination 상세 필드 축소

- old DestinationDetailDto: photos·coords·phone·website·openingHours·restDate·parking 등.
- new: images·type·admissionFee·tags (coords/phone/website/openingHours/restDate/parking 없음).
- 상세페이지는 해당 필드를 `if` 가드해 섹션 숨김 → 파손은 없으나 정보량 감소.

### 3. tournament setup 후보 필터 축소

- old random: theme(kind/value) + categories[] + regions[] + tournamentSize.
- new getRandom: category?/region?/season?/size (단일 필터, theme 없음). 멀티선택·테마 필터 손실.

## Behavior 변경 주의

- **signup**: 새 응답 `ApiResponseUnit`(빈 data) → 기존 `response.user` 흐름 제거, 가입 후 `/me` 재조회 or pendingUser 흐름 조정 필요.
- **getMe**: `UserResponseDto`(≠ 기존 `UserDto`) → `auth-store` user 타입/필드 조정 필요.

## 변경 로그

- (작성 시작) 공통 항목 완료, feature 작업 착수 예정.
- **region ✅** — `ongoingFestivals` → `be/region.getOngoingFestivals` (엔벨로프 unwrap, region 파라미터 제거). MSW 핸들러/테스트를 엔벨로프+id number 로 갱신. `getSummary`/`listContents` 는 BE 미지원 → 구 generated mock 유지. 검증: tsc 0, region test 4/4.
- **travel-type ✅** — `getTravelTypeQuiz`→`be/travel-type.getQuiz`(id number→string 정규화), `submitTravelType`→`be/travel-type.submit`(answer string→number, thin 결과 tags→keywords·recommended:[]·compatibility 생략). quiz seed 를 numeric id 로 재구성 + scoreMap 재키잉, MSW quiz/submit 엔벨로프화(/me 는 full 저장), 테스트 갱신. `getMyTravelType`(GET /me)·`setMyTravelType`(PATCH /me)·`list` 은 BE 미지원 → 구 generated mock 유지. 검증: tsc 0, ranking test 13/13.
- **tournament(rankings) ✅** — `rankingApi.list` type 분기: `weekly-winners`→`be/tournament.getWeeklyTopDestinations({size})`, `by-region`→`be/tournament.getRegionRankings()`. weekly items 는 {destinationId,destinationName,winCount} 로 image/region 미제공(새 BE 한계) → RankedDestination 부분 매핑(캐스팅). by-region 은 region+winCount 무손실 매핑. MSW 에 `/tournaments/rankings/{weekly,regions}` 엔벨로프 핸들러 추가, weekly 테스트를 새 엔드포인트로 갱신. recommended/by-category/seasonal/by-travel-type 은 BE 미지원 → 구 `/rankings` mock 유지. 검증: tsc 0, ranking test 13/13.
- **⏸ 체크포인트 (3/7 완료)** — 전체 회귀 검증: tsc 0, 유닛 253 passed / 3 skipped. 남은 destination(#4)/mypage(#5)/me(#6)/auth(#7) 은 위 "결정 필요" (특히 id 공간 불일치) + behavior 변경(signup/getMe) 확인 후 진행.
- **결정 반영** — id 공간: "실 BE 모드만 정수"(어댑터가 숫자 id→be, 문자열→mock 분기). me·auth: 지금 함께 진행.
- **destination ✅** — `getDestinationDetail` 숫자 id→`be/destination.getDetail`(images→photos, coords/phone 등 미제공) · 문자열→구 generated mock 분기. `fetchCandidates`→`be/destination.getRandom`(season←theme.value, category/region 단일일 때만, size←tournamentSize; theme·멀티필터 손실). MSW `/destinations/random` 엔벨로프+`size` 파라미터 갱신. `related`·`getRecord`·home 추천은 BE 미지원 → 구 generated mock 유지. 검증: tsc 0, tournament 42/42, 전체 253 passed.
- **mypage 🟡 (stamps 완료)** — `getStamps`→`be/mypage.getStamps`(엔벨로프, visited=region code 배열 구/신 동일). MSW `/mypage/stamps` 엔벨로프화. summary/updateNickname/avatar 는 BE 미지원 → mock. **저장목록·저장·삭제·history·record 는 후속** — 사유: id 공간(새 BE 정수) + shape 결합(SavedTournamentDto 에 luckyColor 없음, TournamentSummaryDto 는 winner destination 없이 winnerName 만, record 는 winnerName 필수인데 호출부 미보유 + result page 가 구 TournamentRecordDto rich shape 기대 + getRecord(GET /tournaments/{id}) 무대응). listSaved 는 create+resolve 결합으로 단일 id 분기 불가. → 정수 seed 전환 또는 result-page/record 배선 재설계 필요. 검증: tsc 0, mypage 5/5, 전체 253 passed.
- **me ✅ / auth 🟡** — `authApi.me`→`be/me.getMe`(ApiResponse<UserResponseDto>→도메인 UserDto 매핑: avatarUrl null·homeRegion 생략·isOnboarded true·travelType code→brief). `login`→`be/auth.login`(LoginDto≡LoginRequestDto), `logout`→`be/auth.logout`. middleware 는 `tripbite.visited` 쿠키·SID 존재만 검사 → user 객체 비의존이라 매핑 안전. MSW `/auth/login`·`/me` 엔벨로프화, use-auth.test `/me` 응답 엔벨로프로 갱신. **signup 은 후속** — 신규 SignupRequestDto 가 name·birthDate 필수인데 SignupForm 미수집(BE_REQUEST_signup_consent_integration.md 폼 확장 후 전환). checkUsername/checkEmail/forgot/reset/changePassword/findId/withdraw 는 BE 미지원 → mock. 검증: tsc 0, auth 45 passed/3 skip, 전체 253 passed.
- **✅ 마무리 (7/7 착수, 5 완료 + 2 부분)** — 전체 회귀: tsc 0, 유닛 253 passed / 3 skipped. 남은 부분(mypage saved/history/record, auth signup)은 위 "결정 필요"의 id 정수화 / 폼 확장 후속 작업.

### 후속작업 진행

- **mypage saved(list/save/remove) ✅** — `listSaved`→`be/mypage.getList`(엔벨로프→도메인 SavedTournamentDto 매핑, luckyColor='' — 새 BE 미제공). `saveToMypage`/`removeSaved` 는 **실 BE 모드(정수 id)→be/(save·\_delete), mock(문자열 복합 id)→구 generated** 분기(destination 상세와 동일 패턴). MSW `GET /mypage/tournaments` 엔벨로프화. 기존 테스트는 non-numeric id 라 mock 경로 → 무변경 통과. 검증: tsc 0, tournament 42/42, 전체 253 passed.
- **mypage history ✅** — `listHistory`→`be/mypage.getRecentTournaments`(flat TournamentSummaryDto[] → 구 `{items,nextCursor}` 페이지 shape 매핑: count←tournamentSize, winnerRegion/winnerId/theme 는 소비처 미사용이라 생략, nextCursor null). MSW `/mypage/tournament-history` 를 엔벨로프 flat 로 갱신(cursor 제거). 소비처(TournamentHistorySection)는 id/category/completedAt/count/winnerName 만 사용 → 무손실. 검증: tsc 0, 전체 253 passed.
- **mypage record ✅** — `recordResult`→`POST /mypage/tournament-history`(be RecordTournamentRequestDto). 호출부(TournamentPlayClient)가 winner destination 의 name/region/category 전달. Idempotency-Key 헤더 유지(api.post 직접). 응답 thin(id 만 사용) — 정상 result 화면은 store 사용. runnerUp/matchesPlayed 는 새 BE 미지원(미전송). `getRecord` 딥링크는 새 BE 무대응이라 구 generated mock 유지(실 BE cold 딥링크는 store fallback). MSW `POST /mypage/tournament-history` 추가(tournamentRecords 저장해 mock 딥링크 유지). 검증: tsc 0, 전체 통과.
- **auth signup ✅** — SignupForm 에 name(실명)·birthDate(생년월일, `type=date`) 필드 + zod(NAME/BIRTHDATE 검증)·i18n(ko/en) 추가. `authApi.signup`→`be/auth.signup`(SignupRequestDto→ApiResponseUnit). useSignup 은 응답에 user 없으므로 **폼 입력값(variables)으로 pendingSignupUser 구성**(완료 화면 닉네임 표시; 시작하기 후 useMe 가 /me hydrate). 세션은 signup 이 발급한다고 가정(mock: setMockSignedIn). MSW `/auth/signup` 엔벨로프 Unit. 테스트 갱신(schema fixture + name/birthDate 케이스 + useSignup). 검증: tsc 0, auth 48 passed/3 skip.
- **✅ 전체 완료** — 7/7 feature 및 후속(saved/history/record, signup) 모두 연동. 전체 회귀: tsc 0, 유닛 **256 passed / 3 skipped**, lint 클린. 전부 **미커밋**.
  - 남은 참고(제품/후속): signup 의 consent(법적 동의) 트랙은 별개(BE_REQUEST_signup_consent_integration.md). `getRecord` 실 BE cold 딥링크·avatar/summary/withdraw/reset 등은 새 BE 엔드포인트 신설 시 연동.
