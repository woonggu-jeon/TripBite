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

| 메서드·경로                  | 요청                                                                                                                             | 응답                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `POST /auth/signup`          | `{name, username(/^[A-Za-z0-9_]{4,20}$/), password(10~72), birthDate(YYYY-MM-DD), email, phone(/^01[016789]-?\d{3,4}-?\d{4}$/)}` | `201` (바디 없음, 쿠키 없음) / 409 `AUTH_USERNAME_TAKEN`·`AUTH_EMAIL_TAKEN` / 422 `AUTH_PASSWORD_WEAK`        |
| `POST /auth/login`           | `{username, password}`                                                                                                           | `200 {success:true}` + `Set-Cookie: SID` / 401 `AUTH_INVALID_CREDENTIALS` / 429                               |
| `POST /auth/logout`          | —                                                                                                                                | `204` (SID 만료)                                                                                              |
| `POST /auth/find-id`         | `{name, email}`                                                                                                                  | `200 {username: string                                                                                        | null}`(마스킹`tes\*\*\*01`) |
| `POST /auth/forgot-password` | `{email}`                                                                                                                        | `204` (항상)                                                                                                  |
| `POST /auth/reset-password`  | `{token, password}`                                                                                                              | `204` / 400 `AUTH_TOKEN_INVALID` / 410 `AUTH_TOKEN_EXPIRED` / 422 `AUTH_PASSWORD_WEAK`·`AUTH_PASSWORD_REUSED` |
| `GET /me`                    | —                                                                                                                                | `200 User` (아래) / 401                                                                                       |
| `POST /me/change-password`   | `{currentPassword, newPassword}`                                                                                                 | `204` / 422 `AUTH_CURRENT_PASSWORD_WRONG`·`AUTH_PASSWORD_WEAK`                                                |
| `DELETE /me`                 | —                                                                                                                                | `204` (회원탈퇴: 소프트삭제+세션무효)                                                                         |

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

| `POST /location/reverse` | `{latitude, longitude}` | `200 {latitude, longitude, label, regionCode}` |
| `GET /location/ip` | — | `200 {latitude, longitude, label, regionCode}` |

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
}
```

### Region

| `GET /regions/:code/contents?type=&cursor=&limit=` | — | `200 { items: RegionContent[], nextCursor: number\|null }` (커서 페이지네이션/무한스크롤) |
| `GET /regions/:code/summary` | — | `200 { code, heroImage?, description, popularity:number }` |
| `GET /regions/ongoing-festivals?region=` | — | `200 Festival[]` (진행중/예정, 없으면 `[]`) |

`RegionContent` = `{ id, contentId, type:category, region, title, summary?, imageUrl? }`
`Festival` = `{ id, contentId, type:'festival', region, title, summary?, imageUrl?, eventStart?, eventEnd? }` (날짜 ISO)

> `contents` 페이지네이션(편지 목록과 동일 컨벤션): `cursor`=offset(기본 0), `limit`=페이지 크기(기본 20, 최대 60).
> 응답 `nextCursor`=다음 요청에 그대로 넘길 offset, 마지막 페이지면 `null`. 무한스크롤은 `nextCursor`가
> `null`이 될 때까지 이어서 요청. `type` 필터는 페이지네이션과 함께 동작.

### Rankings

| `GET /rankings?type=&limit=` | — | `200 RankItem[]` |

`type`: `weekly-winners` | `by-region` | `recommended` | `hidden-gems`
`RankItem` = `{ rank:number, destination:{id,name,category,region,imageUrl?}, score:number }`

- `recommended` = TourAPI 인기순 관광지(오늘의 추천). `by-region` = 시군별 실 우승수.

### Letters (인증 필요)

`Letter` = `{ id, body, author:{nickname, location}, arrivedAt: string|null, createdAt, isMine, liked, saved, likeCount }`
| `POST /letters` | `{body(grapheme≤5), location:{label, region?, lat?, lng?}, isAnonymous?}` | `201 Letter` |
| `GET /letters/{received\|sent\|liked\|saved}?cursor=&limit=` | — | `200 { items: Letter[], nextCursor: number|null }` |
| `GET /letters/:id` | — | `200 Letter` (본인 발신/수신만) / 404 |
| `POST /letters/:id/like` | — | `200 Letter` (토글) |
| `POST /letters/:id/save` | — | `200 Letter` (토글) |
| `DELETE /letters/:id` | — | `204` |

> 배송: 작성 후 15~60분(랜덤) 뒤 본인 제외 1명에게 매칭 → `received` 에 노출 + 알림.

### Tournament (record 인증 필요)

`TournamentRecord` = `{ id, winner:Destination, runnerUp:Destination|null, matchesPlayed, tournamentSize, completedAt }`
| `POST /tournaments` | `{winnerId, runnerUpId?, matchesPlayed, tournamentSize, theme?}` | `200 TournamentRecord` |
| `GET /tournaments/:id` | — | `200 TournamentRecord` (공개) / 404 |

### MyPage (인증 필요)

`SavedTournament` = `{ id, destination:Destination, luckyColor, meetChance, savedAt }`
| `GET /mypage` | — | `200 { profile:{nickname, isDefault:false}, savedTournaments:SavedTournament[], savedLetters:Letter[], likedLetters:Letter[], travelType: TravelType|null }` |
| `PATCH /mypage/profile` | `{nickname}` | `200 {nickname, isDefault:false}` |
| `GET /mypage/stamps` | — | `200 { visited: string[], total: 11 }` |
| `GET /mypage/tournaments` | — | `200 SavedTournament[]` |
| `POST /mypage/tournaments` | `{destinationId}` | `200 SavedTournament` |
| `DELETE /mypage/tournaments/:id` | — | `204` / 404 |
| `GET /mypage/tournament-history` | — | `200 { items:[{id, theme, category, count, winnerId, winnerName, winnerRegion, completedAt}], nextCursor:null }` |

### Notifications (인증 필요)

`AppNotification` = `{ id, type:'letter.received'|'letter.liked'|'tournament.shared'|'event'|'security', title, body?, link?, imageUrl?, read, createdAt }`
| `GET /notifications` | — | `200 { items: AppNotification[], unreadCount } ` (createdAt DESC) |
| `POST /notifications/:id/read` | — | `204` (멱등) / 404 |
| `POST /notifications/read-all` | — | `204` |
| `POST /notifications/subscribe` | `{endpoint, keys:{p256dh, auth}}` | `201` (endpoint upsert) |
| `POST /notifications/unsubscribe` | `{endpoint}` | `204` |

### Settings (인증 필요)

`NotificationSettings` = `{ pushEnabled, inAppEnabled, letterReceived, letterLiked }` (모두 boolean, 기본 true)
| `GET /settings` | — | `200 { notifications: NotificationSettings }` (없으면 기본값 생성 후 반환, 404 없음) |
| `PATCH /settings/notifications` | `Partial<NotificationSettings>` (부분 갱신) | `200 { notifications: NotificationSettings }` |

### TravelType / Quiz

`TravelType` = `{ code, title, description, keywords: string[], emoji, recommended: Destination[] }`
| `GET /travel-types/quiz` | — | `200 { questions:[{id, text, options:[{id, text}]}] }` (public) |
| `POST /travel-types/submit` | `{answers:[{questionId, optionId}]}` | `200 TravelType` |
| `GET /travel-types/me` | — | `200 TravelType | null` |
| `PATCH /travel-types/me` | `{code}` | `200 TravelType` (recommended: []) / 404 |

---

## 3. 미제공 (FE 가 호출하면 안 됨)

- ~~`POST /auth/refresh`~~ (sessionID 모델 — 삭제)
- ~~`GET /weather/current`~~ (날씨 기능 제거)
- 아바타 업로드 / `POST /__mock/*` (mock 전용)

## 4. 데이터 메모

- 여행지(`Destination`)는 충북 11시군 TourAPI 실데이터(~1100건, id `tour-<contentid>`),
  매일 04:00 sync. 축제는 4시간마다 sync(기간 포함). ~7% 는 이미지 없음(`imageUrl:null`).
- 날씨 없음. 푸시는 VAPID 연결됨(FE 가 실 구독 등록 시 발송).
