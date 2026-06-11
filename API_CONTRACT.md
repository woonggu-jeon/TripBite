# API Contract — BE 실제 구현 (FE mock 동기화용)

현재 BE(`main`)가 실제로 제공하는 계약. **FE 는 이 문서로 `handlers.ts` mock 을 맞추면 됨.**
실시간 shape 은 Swagger(`/docs`, `/docs-json`)에도 있음. 모든 경로 prefix `/v1`,
모든 요청 `withCredentials: true`(쿠키).

---

## 0. 공통

- **인증**: sessionID 단일 쿠키 `SID` (HttpOnly; SameSite; 운영 Secure). 서버가
  매 요청 검증. FE 는 쿠키 안 읽음.
- **에러**: `{ "code": "SCREAMING_SNAKE", "message": "한글", "details"?: any }`.
  - 검증 실패 → `400 VALIDATION`, 미인증 → `401 AUTH_REQUIRED`, 없음 → `404 NOT_FOUND`,
    과다요청 → `429 RATE_LIMIT`.
- 성공 바디 없는 응답은 `204`.
- **커서 페이지네이션(무한스크롤 공통 규칙)**: `?cursor=&limit=` → `{ items, nextCursor: number|null }`.
  `cursor`=offset(기본 0), `limit`=페이지 크기(엔드포인트별 기본/최대 상이, 초과 시 clamp).
  `nextCursor`를 다음 요청 `cursor`로 넘기고 `null`이면 마지막 페이지. 적용:
  `letters/{received,sent,liked,saved}`, `regions/:code/contents`, `mypage/tournament-history`, `notifications`.

---

## ⚠️ 1. FE mock 수정 포인트 (원래 handlers.ts 대비 변경)

1. **인증 모델: JWT(access/refresh) → sessionID 단일 쿠키 `SID`.**
   - **`POST /auth/refresh` 삭제** — FE 인터셉터에서 호출 제거. 401 받으면 바로 `/login`.
   - 401 코드는 `AUTH_REQUIRED`.
2. **`DELETE /me` 추가** — 회원탈퇴(204). mock 에 추가 필요.
3. **`GET /weather/current` 삭제** — 날씨 기능 제거. mock 에서 제거.
4. **`GET /me` 응답 필드 변경** (아래 2-9) — `username/avatarUrl/travelType` 추가됨.
5. **여행지 id 체계 변경**: 실데이터는 **`tour-<contentid>`** (기존 mock 의
   `cheongju-attraction-1` 형식 아님). `/destinations/*`·랭킹·시군콘텐츠 모두 실 TourAPI id.
6. **여행지 상세에 필드 추가**: `photos[] / phone / website / openingHours / restDate /
parking / coords / summary / address`.
7. **시군 콘텐츠**(`/regions/:code/contents`)가 실 `Destination`(`tour-*`) 반환. `type=category`.
8. **랭킹**: `recommended`=TourAPI 인기순 관광지, `by-region`=실 우승집계,
   `weekly-winners`=실 집계, `hidden-gems`=실 미우승 여행지.
9. **`ongoing-festivals`**: `eventStart/eventEnd` 포함, 진행중/예정만(없으면 `[]`).
10. **알림 `type`** 은 dot 표기 유지(`letter.received` 등).

---

## 2. 엔드포인트

### Auth

| 메서드·경로                  | 요청                                                                                                                             | 응답                                                                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `POST /auth/signup`          | `{name, username(/^[A-Za-z0-9_]{4,20}$/), password(10~72), birthDate(YYYY-MM-DD), email, phone(/^01[016789]-?\d{3,4}-?\d{4}$/)}` | `201 { user: User }` + `Set-Cookie: SID` (**자동 로그인** — 별도 login/me 불필요) / 409 `AUTH_USERNAME_TAKEN`·`AUTH_EMAIL_TAKEN` / 422 `AUTH_PASSWORD_WEAK` |
| `POST /auth/login`           | `{username, password}`                                                                                                           | `200 {success:true}` + `Set-Cookie: SID` / 401 `AUTH_INVALID_CREDENTIALS` / 429                                                                             |
| `POST /auth/logout`          | —                                                                                                                                | `204` (SID 만료)                                                                                                                                            |
| `POST /auth/find-id`         | `{name, email}`                                                                                                                  | `200 {username: string                                                                                                                                      | null}`(마스킹`tes\*\*\*01`) |
| `POST /auth/forgot-password` | `{email}`                                                                                                                        | `204` (항상)                                                                                                                                                |
| `POST /auth/reset-password`  | `{token, password}`                                                                                                              | `204` / 400 `AUTH_TOKEN_INVALID` / 410 `AUTH_TOKEN_EXPIRED` / 422 `AUTH_PASSWORD_WEAK`·`AUTH_PASSWORD_REUSED`                                               |
| `GET /me`                    | —                                                                                                                                | `200 User` (아래) / 401                                                                                                                                     |
| `POST /me/change-password`   | `{currentPassword, newPassword}`                                                                                                 | `204` / 422 `AUTH_CURRENT_PASSWORD_WRONG`·`AUTH_PASSWORD_WEAK`                                                                                              |
| `DELETE /me`                 | —                                                                                                                                | `204` (회원탈퇴: 소프트삭제+세션무효)                                                                                                                       |
| `POST /me/avatar`            | `multipart/form-data` (필드 `file`)                                                                                              | `201 {avatarUrl}` / 422 `AVATAR_TYPE_UNSUPPORTED`·`AVATAR_TOO_LARGE` / 400 `VALIDATION` / 503 `STORAGE_NOT_CONFIGURED`                                      |
| `DELETE /me/avatar`          | —                                                                                                                                | `200 {avatarUrl: null}`                                                                                                                                     |

**아바타 업로드 (서버 경유 multipart, 단일 요청)**: FE 가 `multipart/form-data` 의 **`file`** 필드로
이미지 1개(`image/jpeg\|png\|webp`, **≤10MB**)를 전송 → BE 가 **512×512 webp 로 리사이즈+재인코딩**(EXIF 제거)
후 R2 에 저장하고 `{avatarUrl}`(항상 `.webp`) 반환(→ `User.avatarUrl`). 즉 저장본은 수십 KB로 작음.
파일은 우리 API 를 경유하므로 **버킷 CORS 불필요**. 스토리지 미설정 시 `503`.

> ⚠ 이 요청만 `Content-Type: multipart/form-data` (axios 는 `FormData` 넣으면 자동). 나머지 API 는 JSON.

**User** (`GET /me`, onboarding 응답):

```ts
{
  id: string; username: string; nickname: string; email: string;
  homeRegion: string;            // RegionCode (미설정 시 "cheongju")
  isOnboarded: boolean;
  avatarUrl: string | null;
  travelType: { code: string; title: string; emoji: string } | null;
}
```

### Onboarding

| `POST /me/complete-onboarding` | `{nickname?, homeRegion?}` | `200 User` (isOnboarded:true) |

### Location

| `POST /location/reverse` | `{latitude, longitude, accuracy?}` | `200 { latitude, longitude, label, sido, sigungu, regionCode: string\|null }` |

> **역지오코딩(전국)**: 시군구 경계 GeoJSON(통계청, 앱 내장) 으로 in-memory point-in-polygon — 외부 API/키 없음.
> `label`=`"경기도 오산시"` 같은 전국 라벨, `sido`/`sigungu` 분리. `regionCode`=충북 시군이면 RegionCode,
> **충북 밖이면 `null`**. 대한민국 행정구역 밖(해상/국외) 좌표는 `label:""`, `regionCode:null`. (`GET /location/ip` 는 제거됨)

### Destination

`Destination` = `{ id, name, category: 'attraction'|'festival'|'experience'|'local', region, description?, imageUrl? }`
| `GET /destinations/random?categories=&regions=&tournamentSize=&themeKind=&themeValue=` | — | `200 Destination[]` (토너먼트 매치업: 시군 균형, **유효 대진 크기로 내림**, id 중복 없음) |
| `GET /destinations/:id/related` | — | `200 Destination[]` (같은 시군 6) |
| `GET /destinations/:id` | — | `200 DestinationDetail` |

> `random` 파라미터: `regions`=CSV **시군코드**(없으면 충북 전체), `tournamentSize`=`4|8|16|32`(기본 8),
> `categories`=CSV. 시군당 1개 우선 분배 후 부족분은 **같은 풀(선택한 시군/카테고리) 내** 다른 곳으로 채움
> — 다른 시군/카테고리로는 절대 안 채움. 필터 결과가 tournamentSize 보다 적으면 채워질 수 있는
> **가장 큰 유효 대진 크기(4/8/16/32)로 내림** (예: 16강 요청·풀 12개 → 8강 8개 반환). 풀이 4 미만이면
> 있는 만큼 반환(대진 구성 불가, FE 처리). (구 `count`/`pool`/`region` 단수 파라미터 폐기)
>
> **계절 필터(`themeKind=season&themeValue=spring|summer|autumn|winter`)**: **축제(`festival`)에만 적용** —
> 축제 행사기간(`eventStart~eventEnd`)이 해당 계절에 걸치는 것만 통과(여러 계절에 걸치면 모두 매칭).
> `eventStart` 없는 축제는 제외. **다른 카테고리(관광지/체험/음식)는 계절 메타가 없어 계절과 무관하게 통과**
> (TourAPI `areaBasedList2`에 계절 정보 없음). `themeKind`/`themeValue` 가 없거나 값이 4계절 외면 계절 필터 미적용.

**DestinationDetail** (tour-\* 는 TourAPI 보강):

```ts
{
  id; name; category; region;
  description?; imageUrl?; address?;
  summary: string;                    // overview 첫 문장(≤120자), 없으면 "이름 — 지역 대표 카테고리"(한글)
  coords?: { lat: number; lng: number };
  phone?; website?;                 // detailCommon2
  openingHours?; restDate?; parking?; // detailIntro2
  photos: string[];                  // detailImage2
  eventStart?; eventEnd?;            // 축제 일정(festival 전용, ISO YYYY-MM-DD). 그 외 카테고리·일정없음 → omit. schema.org Event 용
}
```

### Region

| `GET /regions/:code/contents?type=&cursor=&limit=` | — | `200 { items: RegionContent[], nextCursor: number\|null }` (커서 페이지네이션/무한스크롤) |
| `GET /regions/:code/summary` | — | `200 { code, heroImage?, description, popularity:number }` |
| `GET /regions/ongoing-festivals?region=` | — | `200 Festival[]` (진행중/예정, 없으면 `[]`) |

`RegionContent` = `{ id, contentId, type:category, region, title, summary?, imageUrl? }`
`Festival` = `{ id, contentId, type:'festival', region, title, summary?, imageUrl?, eventStart?, eventEnd? }` (`eventStart`/`eventEnd`: ISO `YYYY-MM-DD`)

> `contents` 페이지네이션(편지 목록과 동일 컨벤션): `cursor`=offset(기본 0), `limit`=페이지 크기(기본 20, 최대 60).
> 응답 `nextCursor`=다음 요청에 그대로 넘길 offset, 마지막 페이지면 `null`. 무한스크롤은 `nextCursor`가
> `null`이 될 때까지 이어서 요청. `type` 필터는 페이지네이션과 함께 동작.

### Rankings

| `GET /rankings?type=&limit=` | — | `200 RankItem[]` |

`type`: `weekly-winners` | `by-region` | `recommended` | `hidden-gems` (기본 `limit=5`)
`RankItem` = `{ rank:number, destination:{id,name,category,region,imageUrl?}, score:number }`

- `weekly-winners` = **이번주(월~) 가장 많이 우승한 여행지 TOP n** (실시간 집계, `score`=우승 횟수, 없으면 `[]`).
- `recommended` = TourAPI 인기순 관광지(오늘의 추천). `by-region` = 시군별 실 우승수. `hidden-gems` = 미우승 여행지.

### Letters (인증 필요)

`Letter` = `{ id, body, author:{nickname, location}, arrivedAt: string|null, createdAt, isMine, liked, saved, likeCount, read }`

> `read`=수신자 읽음 여부(received NEW 배지용). `GET /letters/:id` 를 **수신자가 열면 true 로 마킹**(1회). received 목록의 미열람 편지는 `read:false`.
> | `POST /letters` | `{body(grapheme≤5), location:{label, region?, lat?, lng?}, isAnonymous?}` | `201 Letter` |
> | `GET /letters/{received\|sent\|liked\|saved}?cursor=&limit=` | — | `200 { items: Letter[], nextCursor: number|null }` |
> | `GET /letters/:id` | — | `200 Letter` (본인 발신/수신만) / 404 |
> | `POST /letters/:id/like` | — | `200 Letter` (토글) |
> | `POST /letters/:id/save` | — | `200 Letter` (토글) |
> | `DELETE /letters/:id` | — | `204` |

> 배송: 작성 후 15~60분(랜덤) 뒤 본인 제외 1명에게 매칭 → `received` 에 노출 + 알림.

### Tournament

`TournamentRecord` = `{ id, winner:Destination, runnerUp:Destination|null, matchesPlayed, tournamentSize, completedAt }`
| `POST /tournaments` | `{winnerId, runnerUpId?, matchesPlayed, tournamentSize, theme?}` | `200 TournamentRecord` — **선택 인증**: 쿠키 있으면 계정에 귀속(히스토리/충북 마스터), 없으면 **게스트 익명 기록**(랭킹 집계엔 반영). 401 없음 |
| `GET /tournaments/:id` | — | `200 TournamentRecord` (공개) / 404 |

### MyPage (인증 필요)

`SavedTournament` = `{ id, destination:Destination, luckyColor, meetChance, savedAt }`
| `GET /mypage` | — | `200 { profile:{nickname, isDefault:false}, savedTournaments:SavedTournament[], savedLetters:Letter[], likedLetters:Letter[], travelType: TravelType|null }` |
| `PATCH /mypage/profile` | `{nickname}` | `200 {nickname, isDefault:false}` |
| `GET /mypage/stamps` | — | `200 { visited: string[], total: 11 }` |
| `GET /mypage/tournaments` | — | `200 SavedTournament[]` |
| `POST /mypage/tournaments` | `{destinationId}` | `200 SavedTournament` / **409 `SAVED_LIMIT_REACHED`** (저장 한도 20 초과 → "꽉 찼어요" 알림 발행) |
| `DELETE /mypage/tournaments/:id` | — | `204` / 404 |
| `GET /mypage/tournament-history?cursor=&limit=` | — | `200 { items:[{id, theme, category, count, winnerId, winnerName, winnerRegion, completedAt}], nextCursor: number\|null }` (커서 페이지네이션, completedAt DESC) |

### Notifications (인증 필요)

`AppNotification` = `{ id, type:'letter.received'|'letter.liked'|'letter.delivered'|'tournament.shared'|'event'|'security', title, body?, link?, imageUrl?, read, createdAt }`

> **발행되는 알림(ALM_01)**: `letter.received` "{지역}에서 N글자 편지가 왔어요"(→`/letter/{id}`) · `letter.delivered` "내 편지가 누군가에게 도착했어요 ✈"(→`/letter?tab=sent`) · `event` 충북마스터 "충북 마스터 카드를 공유해보세요!"(→`/mypage`) · `event` 저장한도 "우승지가 꽉 찼어요! 삭제 후 저장하세요"(→`/mypage?tab=saved`) · `letter.liked` 좋아요. (link 경로는 FE 라우팅에 맞게 조정 가능)
> | `GET /notifications?cursor=&limit=` | — | `200 { items: AppNotification[], unreadCount, nextCursor: number\|null }` (커서 페이지네이션, createdAt DESC; `unreadCount`=전체 미읽음) |
> | `GET /notifications/unread-count` | — | `200 { unreadCount: number }` (**GNB 배지용 경량** — 목록 미조회) |
> | `POST /notifications/:id/read` | — | `204` (멱등) / 404 |
> | `POST /notifications/read-all` | — | `204` |
> | `POST /notifications/subscribe` | `{endpoint, keys:{p256dh, auth}}` | `201` (endpoint upsert) |
> | `POST /notifications/unsubscribe` | `{endpoint}` | `204` |

### Settings (인증 필요)

`NotificationSettings` = `{ pushEnabled, inAppEnabled, letterReceived, letterLiked }` (모두 boolean, 기본 true)
| `GET /settings` | — | `200 { notifications: NotificationSettings }` (없으면 기본값 생성 후 반환, 404 없음) |
| `PATCH /settings/notifications` | `Partial<NotificationSettings>` (부분 갱신) | `200 { notifications: NotificationSettings }` |

### TravelType / Quiz

`TravelType` = `{ code, title, description, keywords: string[], emoji, recommended: Destination[] }`
| `GET /travel-types/quiz` | — | `200 { questions:[{id, text, options:[{id, text}]}] }` (public) |
| `POST /travel-types/submit` | `{answers:[{questionId, optionId}]}` | `200 TravelType` (**public** · 계산만, 저장 안 함) |
| `GET /travel-types/me` | — | `200 TravelType | null` (auth) |
| `PATCH /travel-types/me` | `{code}` | `200 TravelType` (recommended: []) / 404 — **유형 저장**(auth) |

### Policies / 약관 동의

`PolicyType` = `terms | privacy | marketing`. 약관 **내용은 FE**, BE 는 **버전·동의 이력**만 관리.
| `GET /policies` | — | `200 { items:[{type:PolicyType, version, required}] }` (**public**, 현재 요구 버전) |
| `GET /me/consents` | — | `200 { items:[{type, currentVersion, agreedVersion\|null, agreed, agreedAt\|null, required, needsConsent}], needsConsent }` (auth) |
| `POST /me/consents` | `{agreements:[{type:PolicyType, agreed:boolean}]}` | `200` (위 현황) — 버전은 서버가 현재값으로 스탬프(auth) |

> 필수(`terms`/`privacy`) 미동의·구버전이면 `needsConsent=true`(재동의 필요). signup 플로우 미변경 — 가입/로그인 후 `POST /me/consents` 호출.

---

## 3. 미제공 (FE 가 호출하면 안 됨)

- ~~`POST /auth/refresh`~~ (sessionID 모델 — 삭제)
- ~~`GET /weather/current`~~ (날씨 기능 제거)
- ~~`GET /location/ip`~~ (제거 — `POST /location/reverse` 는 시군구 경계 데이터 역지오코딩으로 부활)
- `POST /__mock/*` (mock 전용)

## 4. 데이터 메모

- 여행지(`Destination`)는 충북 11시군 TourAPI 실데이터(~1100건, id `tour-<contentid>`),
  매일 04:00 sync. 축제는 4시간마다 sync(기간 포함). ~7% 는 이미지 없음(`imageUrl:null`).
- 날씨 없음. 푸시는 VAPID 연결됨(FE 가 실 구독 등록 시 발송).

---

## 5. 에러코드 카탈로그

모든 에러는 봉투 `{ code, message, details? }`. `message` 는 그대로 노출 가능한 한글.
FE 는 **`code` 로 분기**(message 문자열 매칭 금지). 같은 status 라도 code 로 구분한다.

### 공통

| code            | HTTP | 의미                      | FE 처리                                            |
| --------------- | ---- | ------------------------- | -------------------------------------------------- |
| `VALIDATION`    | 400  | 입력값 검증 실패          | `details[]`(field·constraints) 로 필드별 에러 표시 |
| `AUTH_REQUIRED` | 401  | 미인증/세션 만료          | 인터셉터에서 `/login` 으로 이동(refresh 시도 X)    |
| `NOT_FOUND`     | 404  | 리소스 없음               | 404 화면 또는 토스트                               |
| `RATE_LIMIT`    | 429  | 요청 과다(전역 throttler) | "잠시 후 다시 시도" 안내                           |

### 인증 / 계정

| code                          | HTTP | 의미                      | FE 처리                              |
| ----------------------------- | ---- | ------------------------- | ------------------------------------ |
| `AUTH_INVALID_CREDENTIALS`    | 401  | 로그인 실패(아이디/비번)  | 로그인 폼 공통 에러(존재여부 노출 X) |
| `AUTH_USERNAME_TAKEN`         | 409  | 아이디 중복               | username 필드 에러                   |
| `AUTH_EMAIL_TAKEN`            | 409  | 이메일 중복               | email 필드 에러                      |
| `AUTH_PASSWORD_WEAK`          | 422  | 비번 강도 미달            | 비번 규칙 안내                       |
| `AUTH_PASSWORD_REUSED`        | 422  | 최근 3개 비번 재사용      | 다른 비번 요구                       |
| `AUTH_CURRENT_PASSWORD_WRONG` | 422  | 현재 비번 불일치(변경 시) | currentPassword 필드 에러            |
| `AUTH_TOKEN_INVALID`          | 400  | 재설정 토큰 무효/사용됨   | 재설정 링크 재요청 안내              |
| `AUTH_TOKEN_EXPIRED`          | 410  | 재설정 토큰 만료(1h)      | 재설정 링크 재요청 안내              |

### 아바타 / 저장

| code                      | HTTP | 의미                      | FE 처리                          |
| ------------------------- | ---- | ------------------------- | -------------------------------- |
| `AVATAR_TYPE_UNSUPPORTED` | 422  | 이미지 형식 미지원/손상   | 업로드 에러 토스트(JPG/PNG/WEBP) |
| `AVATAR_TOO_LARGE`        | 422  | 10MB 초과                 | 크기 안내                        |
| `SAVED_LIMIT_REACHED`     | 409  | 우승지 저장 한도(20) 초과 | "삭제 후 저장" 안내              |

### 서버/외부 (FE 엔 드묾 — 일반 오류 처리)

| code                                                                           | HTTP            | 의미                                   |
| ------------------------------------------------------------------------------ | --------------- | -------------------------------------- |
| `STORAGE_NOT_CONFIGURED`                                                       | 503             | R2 미설정(업로드 비활성)               |
| `TOUR_API_BAD_REQUEST` / `TOUR_API_AUTH` / `TOUR_API_LIMIT` / `TOUR_API_ERROR` | 400/502/429/502 | TourAPI 호출 오류(주로 sync·cron 내부) |

### DB 폴백 (PrismaExceptionFilter — 서비스에서 못 거른 DB 예외)

| code             | HTTP | 의미                                                                                                            |
| ---------------- | ---- | --------------------------------------------------------------------------------------------------------------- |
| `CONFLICT`       | 409  | unique 제약 위반(보통 서비스가 먼저 도메인 코드로 처리)                                                         |
| `FK_CONSTRAINT`  | 400  | 잘못된 참조(FK)                                                                                                 |
| `CONFLICT_RETRY` | 409  | 트랜잭션 쓰기 충돌(serializable) — **재시도하면 성공**(예: 동시 저장)                                           |
| `CSRF`           | 403  | 교차 도메인(SameSite=none) 배포에서 상태변경 요청에 `X-Requested-With` 헤더 누락. FE 는 axios 에 해당 헤더 설정 |
| `DB_ERROR`       | 400  | 그 외 DB 오류(상세 비노출, 서버에서 Sentry 기록)                                                                |
