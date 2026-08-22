# BE API 요청서

안녕하세요. 프론트엔드에서 현재 지원되지 않아 준비중이거나 임시 방식으로 동작하는 기능들의 API 추가/보강을 정리해 요청드립니다. 우선순위와 사유를 함께 적었으니 검토 부탁드립니다.

- 최종 갱신: 2026-08-22 (`https://trip-bite.o-r.kr` 기준 실측)
- 아래 응답 형태(계약)는 프론트에서 필요한 **제안**이며, 실제 필드명/구조는 논의 후 확정하면 됩니다.

## 공통 규약 (기존과 동일하게 부탁드립니다)

- 응답 봉투: `ApiResponse<T> = { success: boolean, message: string | null, data: T }`
- 인증: 세션 쿠키 `JSESSIONID`, 미인증 접근은 `403`
- 에러: `{ code, message, details[] }` (예: `VALIDATION`, `DUPLICATE_*`)
- id 정수, 지역코드 enum 소문자(`cheongju` …)

## 요약

| #   | 우선순위 | 항목                     | 엔드포인트(제안)                                     |
| --- | -------- | ------------------------ | ---------------------------------------------------- |
| 1   | 높음     | 아이디/이메일 중복확인   | `GET /auth/check-username` · `GET /auth/check-email` |
| 2   | 높음     | 토너먼트 결과 조회       | `GET /tournaments/{id}`                              |
| 3   | 높음     | 여행지 상세 필드 보강    | `DestinationDetailDto` 필드 추가                     |
| 3-1 | 중간     | 위치 역지오코딩          | `POST /location/reverse`                             |
| 4   | 중간     | 아바타 캐시/업로드 검증  | avatarUrl 캐시 정책 · 업로드 에러 코드               |
| 4-1 | 중간     | 주간 랭킹 썸네일(스키마) | `WeeklyDestinationWinDto.imageUrl` 추가              |
| 5   | 낮음     | 추천 여행지              | `GET /destinations/recommendations`                  |
| 6   | 낮음     | 시군 콘텐츠 목록         | `GET /regions/{code}/contents`                       |
| 7   | 낮음     | 연관 여행지              | `GET /destinations/{id}/related`                     |
| 8   | 별도     | 회원가입 동의(consents)  | `SignupRequestDto.consents`                          |

> 참고: 위 항목이 없어도 앱은 정상 동작합니다(대체 흐름 적용). 우선순위는 사용자 경험 개선 정도 기준입니다.
> 필드 추가(스키마) 요청은 아래 "스키마 보강" 섹션에 상세: 주간 랭킹 `imageUrl`(중간) · `TournamentSummaryDto.winnerId`(낮음).

---

## 1. 아이디 / 이메일 중복확인 (높음)

```
GET /auth/check-username?username={username}
GET /auth/check-email?email={email}
→ 200 ApiResponse<{ available: boolean }>   // true = 사용 가능
```

- 현재: 중복 여부를 가입 제출 시점의 `409`(`DUPLICATE_*`)로만 알 수 있습니다.
- 요청: 입력 중 실시간 확인이 가능하도록 조회용 엔드포인트를 추가해 주시면 감사하겠습니다. (비인증 허용)

## 2. 토너먼트 결과 조회 (높음)

```
GET /tournaments/{id}
→ 200 ApiResponse<{
    id, winnerId, winnerName, region, category, tournamentSize, completedAt
  }>
```

- 현재: 결과가 클라이언트 상태에만 있어, 공유 링크로 접속하거나 새로고침하면 결과를 다시 보여줄 수 없습니다.
- 요청: 저장된 토너먼트를 id로 조회하는 엔드포인트를 부탁드립니다. 기록은 이미 `POST /mypage/tournament-history`로 저장되고 있어, **그때 저장되는 필드(winnerId·winnerName·region·category·tournamentSize)**를 그대로 반환해 주시면 됩니다. (winnerId 로 우승 여행지 상세 연결 가능. runnerUp·경기수는 현재 저장하지 않으므로 응답에 없어도 됩니다.)

## 3. 여행지 상세 필드 보강 (높음)

현재 `GET /destinations/{id}` 제공 필드: `id, name, category, region, imageUrl, images, address, type, admissionFee, description, tags, eventStart, eventEnd`

아래 필드를 추가로 내려주실 수 있을지 요청드립니다(TourAPI 원본에 있는 값으로 보입니다).

| 필드           | 타입           | 용도                     |
| -------------- | -------------- | ------------------------ |
| `phone`        | string \| null | 연락처 표시              |
| `website`      | string \| null | 홈페이지 링크            |
| `openingHours` | string \| null | 운영시간                 |
| `restDate`     | string \| null | 휴무일                   |
| `parking`      | string \| null | 주차 정보                |
| `lat`, `lng`   | number \| null | 좌표 기반 길찾기 정확도↑ |

- 좌표가 있으면 길찾기를 좌표 기반으로 안내할 수 있습니다(현재는 장소명 검색으로 연결).

## 3-1. 위치 역지오코딩 (중간)

```
POST /location/reverse  { latitude, longitude }
→ 200 ApiResponse<{ label: string, regionCode: <충북 시군 enum> }>
```

- 배경: 편지 작성 시 사용자의 현재 위치를 표시/첨부합니다. 브라우저에서 GPS 좌표는 확보되지만, 좌표를 **행정구역 라벨 + regionCode**로 바꾸는 역지오코딩이 필요합니다.
- 현재: 서버 역지오코딩이 없어 **클라이언트에서 충북 11개 시군 centroid 최근접으로 근사**하고 있습니다. 실제 도로명 주소가 아니고, 충북 밖 좌표는 가장 가까운 시군으로 귀속됩니다.
- 요청: 좌표를 실제 위치 라벨로 변환해 주시면 원래 의도(현재 위치 표시)대로 복원됩니다. FE는 이 엔드포인트가 생기면 자동으로 사용하고, 없으면 위 근사 방식으로 폴백하도록 되어 있습니다.

## 4. 아바타 캐시 / 업로드 검증 (중간)

현재 `POST /me/avatar` 응답 `avatarUrl`이 `.../uploads/avatars/{userId}.jpg` 로 고정 경로입니다.

- **캐시**: URL이 매번 동일해 재업로드해도 브라우저/CDN이 이전 이미지를 계속 보여줄 수 있습니다. `avatarUrl`에 버전 파라미터(`?v=…`)를 포함하거나, 해당 경로에 `Cache-Control: no-cache`를 적용해 주시면 감사하겠습니다.
- **업로드 검증**: 형식이 맞지 않거나 매우 작은 이미지 업로드 시 `500`이 반환됩니다(정상 크기 이미지는 `201`). 잘못된 입력은 `4xx`(형식/크기)로 내려주시고, 허용 형식·최대 용량 기준을 알려주시면 좋겠습니다.

## 5. 추천 여행지 (낮음)

```
GET /destinations/recommendations?type={type}&limit={n}
→ 200 ApiResponse<Array<{ rank, destination, score }>>
```

- 현재: 추천 영역(홈 배너, 카테고리 추천, 여행유형 결과의 추천 목록)을 `GET /destinations/random`으로 채우고 있습니다.
- 한계: 무작위라 진입할 때마다 결과가 바뀌고, 인기도·가중치가 반영되지 않습니다. 정렬 기준이 있는 추천 엔드포인트가 있으면 사용자 경험이 개선됩니다. (여행유형별 추천도 `type` 파라미터로 함께 처리 가능하면 좋겠습니다.)

## 6. 시군 콘텐츠 목록 (낮음)

```
GET /regions/{code}/contents?category={category}&cursor={n}&limit={n}
→ 200 ApiResponse<{ items: DestinationDto[], nextCursor: number | null }>
```

- 현재: `GET /destinations`(지역·카테고리 필터)를 카테고리별로 나눠 여러 번 호출해 합치고 있습니다.
- 한계: 요청 수가 늘고 페이지네이션이 정확하지 않습니다. 단일 엔드포인트로 커서 페이지네이션을 지원해 주시면 좋겠습니다.

## 7. 연관 여행지 (낮음)

```
GET /destinations/{id}/related
→ 200 ApiResponse<DestinationDto[]>
```

- 현재: 같은 지역·카테고리 목록으로 대체하고 있으며, 사용상 큰 문제는 없습니다. 유사도 기반 연관 추천이 필요해지면 요청드리겠습니다(우선순위 낮음).

## 8. 회원가입 동의(consents) (별도 — 정책/법무 연계)

`SignupRequestDto`에 동의 정보 배열(`consents`) 추가 요청드립니다. 각 항목 필드:

```
consents: [ { type, agreed, version }, ... ]
  - type    : age14 | terms | privacy | location | marketing
  - agreed  : boolean
  - version : string   (동의한 약관 버전)
```

| type                    | 필수 | 미동의 시                                  |
| ----------------------- | ---- | ------------------------------------------ |
| age14 / terms / privacy | 필수 | 가입 거부 (`400`, 미동의 항목을 details로) |
| location / marketing    | 선택 | 가입 진행                                  |

- 저장/이력(동의 시각·버전), 버전 불일치 시 재동의 처리 방식은 논의 후 확정하면 좋겠습니다.
- 함께 필요: 이용약관/개인정보처리방침 **본문**과 개인정보 책임자 연락처(정책팀 확인 부탁드립니다).

## 스키마 보강

- **주간 랭킹 썸네일 (중간)** — `WeeklyDestinationWinDto`에 `imageUrl`(가능하면 `region`도) 추가 요청드립니다. 현재 `destinationId·destinationName·winCount`만 내려와서, **랭킹 상위 목록이 실제 이미지 없이 기본(emoji)으로 표시**됩니다. 이미지가 있으면 랭킹 화면이 시안대로 채워집니다.
- `TournamentSummaryDto`에 `winnerId`(정수)가 있으면 히스토리에서 우승 여행지 상세로 연결할 수 있습니다(현재는 이름만 제공). (낮음)

---

## 참고: 요청 불필요 항목

혼선 방지를 위해, 검토 중 나왔으나 **추가가 필요하지 않은** 것들을 적어둡니다.

- 마이페이지 요약(`GET /mypage`): `GET /me` 로 재구성해 사용 중입니다.
- 내 여행유형 조회/저장: `GET·PATCH /me`(travelType)로 충분합니다.
- 카테고리/계절 랭킹(`GET /rankings`), 시군 요약(`GET /regions/{code}/summary`): 현재 화면에서 사용하지 않습니다.
- 목록 주소: `DestinationDto.address`로 이미 제공되고 있습니다.

## 참고: 최근 반영 감사

2026-08 추가해 주신 아래 항목은 프론트 연동 및 실환경 확인을 마쳤습니다. 감사합니다.

- `POST /auth/find-id` · `forgot-password` · `reset-password`
- `POST /me/change-password`, `DELETE /me`(회원 탈퇴), `POST·DELETE /me/avatar`
- `GET /travel-types/quiz` · `POST /travel-types/submit` 비인증 허용
- `UserResponseDto.avatarUrl` 추가
