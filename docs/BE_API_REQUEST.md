# BE API 요청서 — 준비중 기능 / 필요한 엔드포인트

> FE(Spring 정합 완료)가 **아직 못 만드는 기능**을 위해 BE에 요청하는 API 목록.
> 상세 마이그레이션 배경은 `BE_SPRING_MIGRATION.md`, 이 문서는 **요청분만** 정리.
> 최종 갱신: 2026-08-22 (실 BE `https://trip-bite.o-r.kr` 실측 기준).

## 공통 규약 (모든 신규 API 동일)

- 응답 봉투: `ApiResponse<T> = { success: boolean, message: string | null, data: T }`
- 인증: 세션 쿠키 `JSESSIONID`. 미인증 접근은 **403**(빈 body).
- 에러: `{ code, message, details[] }` (예: `VALIDATION`, `DUPLICATE_*`).
- id: 정수(`number`). 지역코드 enum 소문자(`cheongju` …).

## 한눈에

| #   | 우선순위    | 기능                    | 엔드포인트                                           | 없을 때 FE 현재                                |
| --- | ----------- | ----------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| 1   | 🔴 필요     | 아이디/이메일 중복확인  | `GET /auth/check-username` · `GET /auth/check-email` | 가입 제출 시 409 사후안내만 (실시간 확인 X)    |
| 2   | 🔴 필요     | 토너먼트 결과 딥링크    | `GET /tournaments/{id}`                              | 공유링크/새로고침 시 결과 복원 불가            |
| 3   | 🔴 필요     | 여행지 상세 필드 보강   | `DestinationDetailDto` 필드 추가                     | 연락처·좌표 등 상세 행 미표시, 길찾기 이름검색 |
| 4   | 🟡 품질     | 아바타 캐시 무효화      | avatarUrl 버전/캐시헤더                              | 재업로드 시 옛 이미지 캐시 (FE 임시 우회 중)   |
| 5   | 🟢 개선     | 추천 여행지             | `GET /destinations/recommendations`                  | 무작위(`random`)로 대체 — "추천"이 실제 랜덤   |
| 6   | 🟢 개선     | 시군 콘텐츠 목록        | `GET /regions/{code}/contents`                       | `destinations` 3회 병렬 호출로 대체            |
| 7   | ⚪ 낮음     | 연관 여행지             | `GET /destinations/{id}/related`                     | 같은 시군 목록으로 대체(충분)                  |
| 8   | 🔴 배포차단 | 회원가입 동의(consents) | `SignupRequestDto.consents`                          | 법무 트랙 (별도)                               |

> **hard-block(앱이 안 돌아감)은 없음.** 위 전부 "있으면 완성/품질↑". 🔴는 UX상 필요, 🟢은 우회 동작 중이나 실 API가 확실히 나음.

---

## 🔴 1. 아이디 / 이메일 중복확인

```
GET /auth/check-username?username={username}
GET /auth/check-email?email={email}
→ 200 ApiResponse<{ available: boolean }>   // true = 사용 가능
```

- **왜**: 회원가입 폼에서 입력 중 실시간 중복확인. 현재는 제출해야 409(`DUPLICATE_USERNAME`/`DUPLICATE_NICKNAME`)로 알 수 있어 UX 나쁨.
- **FE 연결점**: `SignupForm` 중복확인 버튼(현재 준비중) → 즉시 활성.
- 공개 엔드포인트(비인증 허용).

## 🔴 2. 토너먼트 결과 딥링크

```
GET /tournaments/{id}
→ 200 ApiResponse<{
    id: number,
    winner: DestinationDto,
    runnerUp: DestinationDto | null,
    matchesPlayed: number,
    tournamentSize: number,
    completedAt: string   // ISO
  }>
```

- **왜**: 결과 공유 링크·새로고침(cold 진입) 시 결과 화면 복원. 현재 결과는 클라 store 전용이라 새로고침하면 사라짐.
- **참고**: 기록은 이미 `POST /mypage/tournament-history` 로 저장됨 → 그 id 로 조회 가능하게.
- **FE 연결점**: `/tournament/result` cold 진입 분기.

## 🔴 3. 여행지 상세 필드 보강 (`DestinationDetailDto` 확장)

현재 제공: `id·name·category·region·imageUrl·images·address·type·admissionFee·description·tags·eventStart·eventEnd`

추가 요청 필드 (TourAPI 원본에 존재):

| 필드           | 타입           | 용도                                  |
| -------------- | -------------- | ------------------------------------- |
| `phone`        | string \| null | 상세 연락처 행                        |
| `website`      | string \| null | 홈페이지 링크 행                      |
| `openingHours` | string \| null | 운영시간 행                           |
| `restDate`     | string \| null | 휴무일 행                             |
| `parking`      | string \| null | 주차 정보 행                          |
| `lat`, `lng`   | number \| null | **좌표 기반 길찾기**(현재는 이름검색) |

- **FE 연결점**: `WinnerDetailPanel` 상세 행 + `DestinationActions` 길찾기 좌표 분기.

## 🟡 4. 아바타 캐시 무효화 + 업로드 검증

현재 `POST /me/avatar` 응답 avatarUrl = `https://trip-bite.o-r.kr/uploads/avatars/{userId}.jpg` (고정 경로).

- **문제 1 (캐시)**: 재업로드해도 URL이 동일 → 브라우저/CDN이 옛 이미지를 계속 보여줌.
  - 요청: avatarUrl에 **버전 쿼리 내장**(`?v={hash|updatedAtEpoch}`) **또는** `/uploads/avatars/*` 응답에 `Cache-Control: no-cache`.
  - (FE는 현재 `?v={/me 갱신시각}` 임시 우회 중 — BE가 버전 URL 주면 우회 제거.)
- **문제 2 (검증)**: 작은/비정상 이미지 업로드 시 `500` 발생(정상 크기 PNG는 201). → 잘못된 입력은 `422`(형식/크기)로 정규화 요청. 정책 명문화(허용 MIME / 최대 바이트).

## 🟢 5. 추천 여행지 (★★★ — 우회 한계 큼)

```
GET /destinations/recommendations?type={type}&limit={n}
→ 200 ApiResponse<RankedDestination[]>   // { rank, destination, score }
```

- **현재 우회**: `GET /destinations/random`(+category) 사용.
- **우회의 한계(중요)**: 화면엔 "추천"이라 뜨지만 **실제는 무작위**다. ① 진입마다 결과가 바뀜(비결정적), ② 개인화·인기도·가중치 0, ③ `random`은 토너먼트 풀 겸용이라 `size<4`면 409.
- **노출 범위**: 홈 상단 배너 · 카테고리픽 · 여행유형 결과 "이런 여행지가 어울려요" — **앱 첫 화면 핵심**.
- (유형별 추천은 이 API의 `type`으로 함께 해결 가능.)

## 🟢 6. 시군 콘텐츠 목록 (★★)

```
GET /regions/{code}/contents?category={category}&cursor={n}&limit={n}
→ 200 ApiResponse<{ items: DestinationDto[], nextCursor: number | null }>
```

- **현재 우회**: `GET /destinations`(region·category 필터)를 카테고리 3개 병렬 호출 후 클라 병합.
- **우회의 한계**: ① 요청 **3배**, ② 페이지네이션 근사치(정확한 다음 페이지 보장 못 함), ③ 서버 큐레이션 정렬 없음.

## ⚪ 7. 연관 여행지 (☆ — 우선순위 낮음)

```
GET /destinations/{id}/related
→ 200 ApiResponse<DestinationDto[]>
```

- **현재 우회**: 상세의 `region`+`category`로 같은 시군 동일 카테고리 6개 재구성. 사용자에겐 자연스러워 **현 우회로 충분** — 진짜 유사도 추천이 필요할 때만.

## 🔴 8. 회원가입 동의 (배포 차단 — 법무 트랙)

`SignupRequestDto`에 `consents` 추가:

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

- 저장: `user_consents`(userId+type+agreed+version+agreedAt), 철회/재동의는 새 row. version 불일치 → `400 CONSENT_VERSION_MISMATCH`.
- 별도: `/policy/terms`·`/policy/privacy` 본문(법무), 개인정보 책임자 실 이메일.
- FE `ConsentBlock` 이미 구현 — 필드만 수신하면 됨.

---

## 스키마 보강 (선택)

- `TournamentSummaryDto.winnerId`(정수) 추가 시 히스토리 → 우승지 상세 딥링크 가능(현재 winnerName만).

## 요청하지 않는 것 (참고 — 이미 해결/불필요)

- **`GET·PATCH /travel-types/me`**: `GET·PATCH /me`(travelType 코드)로 **완전 대체됨**(실측 확인) → 불요.
- **카테고리/계절 랭킹(`GET /rankings`)**: 랭킹 화면에서 해당 UI 제거됨 → 불요.
- **시군 큐레이션(`GET /regions/{code}/summary`)**: `/region` 화면 스코프 제외(기획) → 불요.
- **목록 주소**: `DestinationDto.address` 이미 제공됨.

---

## 완료 확인 (참고 — 이미 반영됨, 요청 아님)

BE가 2026-08 추가 → FE 배선 + 실 BE 스모크(2026-08-21) 통과:
`POST /auth/find-id` · `forgot-password` · `reset-password` · `POST /me/change-password` · `DELETE /me`(탈퇴) · `POST·DELETE /me/avatar` · `GET /travel-types/quiz`·`POST /travel-types/submit` 공개 전환 · `UserResponseDto.avatarUrl` 추가.
