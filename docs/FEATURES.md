# 기능 명세 — 인증 / 알림 / 푸시

BE 인계용 정책·시나리오·보안 명세 (Swagger 가 cover 못 하는 영역). endpoint shape 은 **BE Swagger** (`{API}/docs`) 가 SoT — 본 문서는 정책 / 흐름 / 발송 매핑 / 보안 체크리스트.

> 로컬 Swagger: <http://localhost:3000/docs> · OpenAPI JSON: <http://localhost:3000/docs-json>
> orval 이 빌드 전 자동 생성 → `src/api/generated/`.

---

## 0. 공통

### 인증 방식 — sessionID 단일 쿠키 (한국 표준)

- 단일 cookie `SID` — `HttpOnly; Secure; SameSite=Lax; Path=/`
- BE 가 매 요청 cookie → DB/Redis `Session` 테이블 조회로 검증
- 만료 / Revocation 모두 DB row 변경으로 즉시 반영 (관리자 강제 로그아웃 가능)
- FE 는 쿠키를 직접 읽지 않고 `withCredentials=true` 로 자동 전송
- 만료 권장:
  - session 자체 — 14일 absolute / 1시간 sliding (선택)
  - sliding 활성 시 매 인증 요청에서 BE 가 `Session.expiresAt` 갱신

> ⚠ 본 명세는 JWT (access/refresh) 모델에서 sessionID 단일 쿠키로 전환됨.
> JWT 로 구현 중이면 `access_token` 폐기 + `/auth/refresh` endpoint 제거 + DB Session lookup guard 로 마이그.

### 401 처리 (FE interceptor)

- 401 응답 → 즉시 `window.location.href = '/login'` (refresh 시도 X)
- auth 페이지 (`/login`, `/signup`, `/find-id`, `/forgot-password`, `/reset-password`, `/onboarding`) 에 있으면 hard redirect skip — reload 무한 루프 회피.

### 에러 표준화

BE 는 다음 두 필드만 보장 (FE interceptor 가 normalize):

```json
{
  "code": "AUTH_INVALID_CREDENTIALS",
  "message": "아이디 또는 비밀번호가 올바르지 않습니다."
}
```

- `code` — SCREAMING_SNAKE_CASE. FE 의 `error-normalize.ts` 가 우선 매핑.
- `message` — 사용자 표시용 한글. `code` 매핑 실패 시 fallback.
- HTTP status 만으로도 동작 (code 없으면 상태 코드 기반 generic 메시지).

표준 code:

- 인증: `AUTH_INVALID_CREDENTIALS` / `AUTH_USERNAME_TAKEN` / `AUTH_EMAIL_TAKEN`
- 토큰: `AUTH_TOKEN_INVALID` / `AUTH_TOKEN_EXPIRED`
- 비번: `AUTH_PASSWORD_WEAK` / `AUTH_PASSWORD_REUSED` / `AUTH_CURRENT_PASSWORD_WRONG`
- 공통: `RATE_LIMIT` / `VALIDATION` / `AUTH_REQUIRED`

### CORS

- `Access-Control-Allow-Origin: <FE origin>` (정확 매칭, 와일드카드 X)
- `Access-Control-Allow-Credentials: true`
- preflight: `Access-Control-Allow-Headers: Content-Type, Authorization`

---

# A. 인증 / 세션 (Auth)

## A-1. 로그인 — `POST /auth/login`

### Request

```ts
{
  username: string;
  password: string;
}
```

### Response 성공 — 200

- Body: `{ success: true }` (FE 는 success 필드 안 읽음)
- **Set-Cookie**: `SID=<sessionId>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=...`
- FE: 즉시 `GET /me` 재호출 → `useAuthStore.setAuth(user)` → `?redirect=` 또는 `/`.

### Response 실패

| 상태 | code                       | 의미               | FE 처리                         |
| ---- | -------------------------- | ------------------ | ------------------------------- |
| 401  | `AUTH_INVALID_CREDENTIALS` | 아이디/비번 불일치 | form root error 토스트 + 메시지 |
| 429  | `RATE_LIMIT`               | 시도 너무 많음     | "잠시 후 다시 시도해주세요"     |
| 5xx  | (any)                      | 서버 오류          | "네트워크 오류" 표준 메시지     |

### 보안

- 아이디 존재 여부 응답 구분 X (account enumeration 차단).
- BE 가 시도 횟수 추적, 일정 횟수 이상 시 `429` 또는 captcha.

## A-2. 회원가입 — `POST /auth/signup`

### Request

```ts
{
  name: string; // 1~30자, 제어/HTML 문자 차단
  username: string; // /^[a-zA-Z0-9_]{4,20}$/
  password: string; // 10~72자
  birthDate: string; // YYYY-MM-DD
  email: string; // RFC
  phone: string; // /^01[016789]-?\d{3,4}-?\d{4}$/
}
```

### Response 성공 — 201

- Body 비어있음. **Set-Cookie 발급 안 함** (자동 로그인 X).
- FE: `/login?signup=success` 이동 → toast.

### Response 실패

| 상태 | code                  | 의미                     | FE 처리              |
| ---- | --------------------- | ------------------------ | -------------------- |
| 400  | `VALIDATION`          | 형식 위반 (BE 추가 검증) | form root error      |
| 409  | `AUTH_USERNAME_TAKEN` | 아이디 중복              | username field error |
| 409  | `AUTH_EMAIL_TAKEN`    | 이메일 중복              | email field error    |
| 422  | `AUTH_PASSWORD_WEAK`  | 비번 강도 위반           | password field error |

### BE 추가 검증 권장

- 비속어 / 예약어 username
- 비번 사전 매칭, 연속 문자, username 포함 차단
- 이메일 disposable domain 차단

## A-3. 아이디 찾기 — `POST /auth/find-id`

### Request / Response

```ts
// Request
{
  name: string;
  email: string;
}
// Response 200
{
  username: string | null;
} // 매칭 "tes***01" / 미매칭 null
```

### 보안

- **메일 발송 X** (정책). 화면에 마스킹된 아이디 노출.
- 미매칭 시 `null` + 200 OK (enumeration 방지).
- 마스킹: 앞 3자 + `***` + 끝 2자. 4자 미만은 절반만.
- BE rate limit 필수.

## A-4. 비밀번호 찾기 — 전체 여정

```
[1] /login → "비밀번호를 잊으셨나요?"
       ↓
[2] /forgot-password → 이메일 입력
       ↓ POST /auth/forgot-password
[3] "메일을 발송했어요" (204 무조건 노출)
       ↓ (이메일 수신 + 링크 클릭)
[4] /reset-password?token=... → 새 비번 입력
       ↓ POST /auth/reset-password
[5] /login?reset=success → toast → 새 비번 로그인
```

### A-4-1. 링크 발송 — `POST /auth/forgot-password`

#### Request / Response

```ts
{
  email: string;
} // → 204 (무조건, enum 방지)
```

- BE: 이메일 존재 시 토큰 발급 + 메일. 미존재도 204 + 메일 X.
- 토큰 만료: **1시간** (운영 기본).

#### Rate limit (필수)

- 같은 **이메일**: 1시간 3회 초과 시 429
- 같은 **IP**: 1시간 10회 초과 시 429
- 존재 안 하는 이메일도 동일하게 카운트 (enum 방지)

#### 메일 발송 spec

| 변수                | 값                                                 |
| ------------------- | -------------------------------------------------- |
| `${FE_URL}`         | `NEXT_PUBLIC_SITE_URL` (예: `https://tripbite.kr`) |
| `${TOKEN}`          | URL-safe base64 / UUID (충돌 X, 추측 불가)         |
| `${EXPIRES_AT_KST}` | 토큰 만료 시각 (KST)                               |
| `${USERNAME}`       | 사용자 아이디 (가능 시)                            |

링크: `${FE_URL}/reset-password?token=${TOKEN}` (정확 매칭).

#### 메일 재발송

- 같은 이메일 다시 제출 → BE 가 기존 토큰 무효화 + 새 토큰 (둘 다 유효 X).
- rate limit 카운터는 그대로.

#### 계정 보호 알림 (권장)

토큰 발급 직후 BE 가 선택적으로:

- 메일: "재설정 요청을 받았어요" 통지
- 인앱: `notifications.security` type inbox 추가

### A-4-2. 토큰 사전 검증 — `GET /auth/reset-password/validate?token=...` (선택)

- `200 { valid: true; expiresAt: string }` / `410 AUTH_TOKEN_EXPIRED` / `400 AUTH_TOKEN_INVALID`
- 우선순위 낮음 — POST 시점 검증으로 충분.

### A-4-3. 비밀번호 재설정 — `POST /auth/reset-password`

#### Request / Response

```ts
{
  token: string;
  password: string;
} // → 204
```

| 상태 | code                   | 의미               | FE 처리                                 |
| ---- | ---------------------- | ------------------ | --------------------------------------- |
| 400  | `AUTH_TOKEN_INVALID`   | 위변조 / 이미 사용 | root error                              |
| 410  | `AUTH_TOKEN_EXPIRED`   | 만료 (1시간 초과)  | "재설정 링크가 만료됐어요" + 재발송 CTA |
| 422  | `AUTH_PASSWORD_WEAK`   | 비번 강도 부족     | password field error                    |
| 422  | `AUTH_PASSWORD_REUSED` | 이전 비번 동일     | password field error                    |

#### 보안

- **1회용 토큰** (성공 시 즉시 무효화).
- 토큰 재발급 시 기존 토큰 무효화.
- **재설정 성공 시 user 의 모든 Session row 삭제** (탈취 대응 — 다른 디바이스 강제 로그아웃).

#### 이전 비번 재사용 차단

- BE 가 마지막 N=3개 비밀번호 hash 보관 (rolling queue).
- 새 비번이 이전 N개와 일치 → `422 AUTH_PASSWORD_REUSED`.

## A-5. 비밀번호 변경 (로그인 상태) — `POST /me/change-password`

```ts
{
  currentPassword: string;
  newPassword: string;
} // → 204
```

| 상태 | code                          | 의미              |
| ---- | ----------------------------- | ----------------- |
| 401  | `AUTH_REQUIRED`               | 미인증            |
| 422  | `AUTH_CURRENT_PASSWORD_WRONG` | 현재 비번 불일치  |
| 422  | `AUTH_PASSWORD_WEAK`          | 새 비번 강도 부족 |

- 변경 성공 시 기존 Session 전부 무효화 권장.
- FE 폼은 `confirmPassword` 도 받지만 zod refine 후 BE 에는 전달 X.

## A-6. 로그아웃 — `POST /auth/logout`

- 204 — BE: `Set-Cookie: SID=; Max-Age=0` + DB Session row `revokedAt=now` 또는 삭제.
- FE: 응답 무관 (`onSettled`) `clearAuth()` + `queryClient.clear()` + SW cache → `/`.

## A-7. 내 정보 — `GET /me`

```ts
{
  id: string;
  username: string;
  nickname: string;
  email: string;
  isOnboarded: boolean;
  // travelType, avatarUrl 등 옵션
}
```

- FE 가 `userSchema.parse()` 로 런타임 검증.
- 401 → interceptor 가 즉시 `/login?redirect=` 푸시.

## A-8. Set-Cookie 예시

```http
Set-Cookie: SID=<opaque-random-id>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=1209600
```

Session 테이블:

```
sessionId (PK) | userId (FK) | userAgent | ip | expiresAt | revokedAt | createdAt
```

## A-9. 테스트 시나리오 체크리스트

### 로그인

- [ ] 정상 자격 → 200 + 쿠키 발급
- [ ] 잘못된 비번 → 401 `AUTH_INVALID_CREDENTIALS`
- [ ] 존재 안 하는 username → **동일하게 401** (enum 방지)
- [ ] 5회 실패 → 429 또는 captcha

### 회원가입

- [ ] 정상 → 201 (쿠키 X)
- [ ] 중복 username → 409 `AUTH_USERNAME_TAKEN`
- [ ] 중복 email → 409 `AUTH_EMAIL_TAKEN`
- [ ] 약한 비번 → 422 `AUTH_PASSWORD_WEAK`

### 아이디 찾기

- [ ] 매칭 → `{ username: "tes***01" }`
- [ ] 미매칭 → `{ username: null }` (200)
- [ ] rate limit → 429

### 비번 재설정 (forgot + reset)

- [ ] 존재하는 이메일 forgot → 메일 + 204 + 토큰 1시간
- [ ] 존재 안 함 → 메일 X + **204** (enum 방지)
- [ ] 같은 이메일 1시간 4회째 → 429
- [ ] 같은 IP 1시간 11회째 → 429
- [ ] forgot 재호출 → 기존 토큰 무효화 + 새 토큰
- [ ] 메일 본문 링크: `${FE_URL}/reset-password?token=${TOKEN}`
- [ ] 정상 reset → 204 + 모든 Session 삭제
- [ ] 만료 토큰 → 410 `AUTH_TOKEN_EXPIRED`
- [ ] 1회 사용 토큰 재사용 → 400 `AUTH_TOKEN_INVALID`
- [ ] 위변조 → 400 `AUTH_TOKEN_INVALID`
- [ ] 최근 3개 중 일치 → 422 `AUTH_PASSWORD_REUSED`
- [ ] reset 후 기존 세션 GET /me → 401

### 세션

- [ ] 로그인 → 200 + `SID` Set-Cookie + DB Session row 생성
- [ ] 로그아웃 → 204 + 쿠키 만료 + DB row revoked/delete
- [ ] 만료 SID 보호 endpoint → 401 → FE /login
- [ ] 다른 디바이스 동시 로그인 → 별도 Session row (UA/IP)
- [ ] 관리자 강제 로그아웃 → DB row 삭제 즉시 차단

---

# B. 알림 (Notifications) & Web Push

알림은 **두 채널** 으로 분리:

1. **인앱 알림함** (`/notifications` 페이지, 헤더 종 → navigate) — 인증 필요, cursor 무한스크롤 + 30s 폴링.
2. **Web Push** — OS 레벨 알림, VAPID + Service Worker, 앱 닫혀도 수신.

동일 이벤트는 양쪽 채널 동시 발행 권장 (둘 다 enabled 일 때).

## B-1. 알림 종류 (`NotificationType`)

```ts
type NotificationType =
  | 'letter.received' // 받은 편지 도착
  | 'letter.liked' // 내 편지에 좋아요
  | 'letter.delivered' // 내가 보낸 편지가 누군가에게 도착 (배달 완료)
  | 'tournament.shared' // 토너먼트 공유 (수신자에게)
  | 'event' // 일반 이벤트/공지
  | 'security'; // 보안 알림 (비밀번호 변경 등)
```

확장 시 FE `NotificationsClient.TYPE_ICON` 매핑도 갱신.

## B-2. 인박스 — `GET /notifications?cursor=&limit=`

### Response 200

```ts
{
  items: AppNotification[];
  unreadCount: number;
  nextCursor: number | null;
}

type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  imageUrl?: string;
  read: boolean;
  createdAt: string; // ISO 8601
};
```

- 정렬: `createdAt DESC`.
- `cursor`: offset (기본 0), 첫 요청 생략.
- `limit`: 기본 20, 최대 60. 헤더 badge 는 `limit=1`.

### 헤더 badge

`useNotificationBadge` 가 `limit=1` 로 가장 가벼운 fetch + `CACHE.realtime` (30s stale + 30s 폴링 + `refetchOnWindowFocus`). markRead 시 `notificationKeys.all` invalidate.

BE 부하 고려해 `ETag` / `Last-Modified` + 304 권장.

### 멱등 / 읽음

- `POST /notifications/:id/read` — 204. 이미 read 도 동일 (멱등). 404 시 FE silent fallback.
- `POST /notifications/read-all` — 204. 본인 미읽음 일괄 read=true.

## B-3. Web Push — VAPID

```bash
npx web-push generate-vapid-keys
```

- **Public** → FE env `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (base64url)
- **Private** → BE 서버 secrets only (절대 노출 X)

라이브러리: `web-push` (Node) / `pywebpush` / `webpush` (Go) 등.

### B-3-1. 구독 — `POST /notifications/subscribe`

```ts
{
  endpoint: string; // 푸시 service URL (FCM / Mozilla / Apple)
  keys: {
    p256dh: string;
    auth: string;
  }
}
```

- FE 가 `pushManager.subscribe({ applicationServerKey })` 결과 그대로 POST.
- 자세히: `src/features/notification/utils/subscription.ts:42`
- Response 201/204. **endpoint UNIQUE** — 같은 endpoint 재등록 upsert.

### B-3-2. 구독 해제 — `POST /notifications/unsubscribe`

```ts
{
  endpoint: string;
} // → 204
```

해당 endpoint row 삭제, 다른 endpoint 유지.

### B-3-3. Push 발송 (BE → 사용자)

#### Payload (FE SW 기대 형식)

```ts
{
  title: string;    // 필수
  body?: string;
  link?: string;    // "/letter/abc123"
  tag?: string;     // 같은 tag → OS 중복 합침
  icon?: string;    // 기본 /icons/icon-192x192.png
  badge?: string;   // 기본 /icons/icon-72x72.png
}
```

SW handler: `src/app/sw.ts:132` (push event).

#### web-push 예시 (Node.js)

```js
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:contact@tripbite.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

await webpush.sendNotification(
  { endpoint, keys: { p256dh, auth } },
  JSON.stringify({
    title: '편지가 도착했어요',
    body: '익명의 누군가가 5글자를 보냈어요',
    link: `/letter/${letterId}`,
    tag: `letter:${letterId}`,
  }),
  { TTL: 60 * 60 * 24 }, // 24h
);
```

#### 발송 실패 → 구독 정리

- **410 Gone** / **404 Not Found** → DB endpoint row **즉시 삭제** (사용자가 해제 / push service 만료).
- 5xx → retry queue (지수 백오프).
- 403 / 기타 → VAPID key 불일치 로그.

### B-3-4. 알림 클릭 → 화면 이동

SW `notificationclick`:

- 열린 탭 있으면 → focus + `postMessage({ type: 'NAVIGATE', link })` → `ServiceWorkerNavigateBridge` 가 `router.push`.
- 없으면 → `clients.openWindow(link)`.

BE 는 `link` 만 정확한 path 로 채우면 됨.

## B-4. 알림 설정 — `GET/PATCH /settings`

### Response 200 — `GET /settings`

```ts
{
  notifications: {
    pushEnabled: boolean;
    inAppEnabled: boolean;
    letterReceived: boolean;
    letterLiked: boolean;
  }
  // 추후 확장
}
```

### `PATCH /settings/notifications`

`Partial<NotificationSettings>` (예: `{ pushEnabled: false }`) → 200 전체 `UserSettings` 반환 (`PUT` 시맨틱). FE 가 `qc.setQueryData()` 로 캐시 통째 교체.

### 발송 게이트

- `pushEnabled=false` → push 발송 X (구독 row 유지).
- `inAppEnabled=false` → 인박스 row 추가 X.
- `letterReceived=false` → `letter.received` type skip.
- `letterLiked=false` → `letter.liked` type skip.

BE 로직: `if (settings.pushEnabled && settings[type_category]) push()` 이중 게이트.

## B-5. iOS Safari 특수 정책

iOS 16.4+ 부터 Web Push 지원. 추가 조건:

- **PWA standalone 모드** 에서만 동작 (홈 화면 추가 후 실행).
- 일반 Safari 탭의 `Notification.requestPermission()` silent fail.

FE 가 `canUsePushOnIOS()` 사전 차단 (`utils/subscription.ts:96`).
BE 는 iOS endpoint (`web.push.apple.com`) 도 동일 처리, 단 TTL 짧게 권장 (Apple 만료 빠름).

## B-6. Mock / Dev 흐름

dev 환경에서 BE 없이 푸시 검증:

- `triggerMockPush()` (`utils/subscription.ts:112`) — main thread `new Notification()`
- SW `MOCK_PUSH` postMessage (`sw.ts:113`) — SW showNotification

BE 합류 후에도 dev 도구로 유지 (`NEXT_PUBLIC_USE_MSW=true` 환경 한정).

## B-7. 발송 이벤트 매핑

| 트리거             | type                | title                               | body                                               | link                                | tag                      |
| ------------------ | ------------------- | ----------------------------------- | -------------------------------------------------- | ----------------------------------- | ------------------------ |
| 새 편지 도착       | `letter.received`   | `편지가 도착했어요`                 | `{senderNickname \| '익명의 여행자'}가 보낸 5글자` | `/letter/${letterId}`               | `letter:${letterId}`     |
| 내 편지에 좋아요   | `letter.liked`      | `좋아요를 받았어요`                 | `${likerCount}명이 당신의 편지를 좋아해요`         | `/letter/${letterId}`               | `like:${letterId}`       |
| 내 편지 배달 완료  | `letter.delivered`  | `내 편지가 누군가에게 도착했어요 ✈` | `${receiverRegion}에서 받았어요`                   | `/letters?tab=sent`                 | `delivered:${letterId}`  |
| 토너먼트 공유 받음 | `tournament.shared` | `친구가 토너먼트를 공유했어요`      | `${sharerNickname}: ${winnerName}`                 | `/tournament/result?id=${recordId}` | `tournament:${recordId}` |
| 이벤트/공지        | `event`             | (관리자 입력)                       | (관리자 입력)                                      | (관리자 입력)                       | `event:${id}`            |

같은 `tag` 알림은 OS 가 중복 합침 — 같은 편지에 여러 좋아요는 마지막 하나만 (의도).

## B-8. 보안 / 운영 체크리스트

### 구독

- [ ] endpoint UNIQUE (upsert)
- [ ] 사용자 탈퇴 시 모든 endpoint 삭제
- [ ] 410/404 응답 endpoint 즉시 삭제
- [ ] 30일 이상 미사용 endpoint 주기 정리

### 발송

- [ ] VAPID private key 는 secrets manager / env
- [ ] settings 양쪽 게이트 (pushEnabled + 카테고리) 후 발송
- [ ] retry queue + 지수 백오프 (5xx)
- [ ] TTL 24h 기본, 이벤트성 1h
- [ ] 시간대별 rate limit (스팸 방지)

### 인박스

- [ ] read 멱등
- [ ] 30일 이상 알림 자동 삭제 (cleanup job)

## B-9. 테스트 시나리오 체크리스트

### 인박스

- [ ] 미읽음 3 + 읽음 5 → `unreadCount: 3`, items 8건 (createdAt DESC)
- [ ] `:id/read` → 204 + DB read=true
- [ ] 이미 read PATCH → 204 (멱등)
- [ ] 다른 사용자 알림 ID → 404
- [ ] 미인증 → 401

### 구독

- [ ] 신규 endpoint → 201 + DB 1 row
- [ ] 같은 endpoint 재호출 → 201/200 + DB 여전히 1 row (upsert)
- [ ] unsubscribe → 204 + DB 0 rows
- [ ] 2개 디바이스 → DB 2 rows + 둘 다 수신

### 발송

- [ ] 편지 도착 → 인박스 + push 둘 다
- [ ] `pushEnabled=false` → 인박스만, push X
- [ ] `letterReceived=false` → 둘 다 X
- [ ] 만료 endpoint (410) → 다음 발송 시 DB 정리
- [ ] tag 같은 알림 → OS 합침 (FE 검증)

### 설정

- [ ] `PATCH { pushEnabled: false }` → 다음 push 차단
- [ ] 설정 미존재 사용자 → 기본값 객체 반환 (404 X)

## B-10. 환경변수

### FE (`NEXT_PUBLIC_*`)

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — VAPID public (base64url)
- `NEXT_PUBLIC_API_URL` — API base

### BE (서버 secrets)

- `VAPID_PUBLIC_KEY` — 검증용 (동일 값)
- `VAPID_PRIVATE_KEY` — 서명용 (절대 노출 X)
- `VAPID_SUBJECT` — `mailto:contact@tripbite.app` 형식

VAPID key 변경 시 모든 기존 구독 무효화 — 신중히.

---

# C. 선택 인증 / 응답 정책 (Swagger 가 cover 못 하는 분기)

## C-1. 선택 인증 endpoint

일부 endpoint 는 인증 강제 안 함 — BE 가 쿠키 유무로 분기 응답. 401 없음.

| Endpoint            | 인증 시                            | 비로그인 시                         |
| ------------------- | ---------------------------------- | ----------------------------------- |
| `POST /tournaments` | 계정 귀속 (히스토리 / 충북 마스터) | 게스트 익명 record (랭킹 집계 반영) |

### FE 정책

- 토너먼트 흐름 (`/tournament` → `/play` → `/result`) 은 middleware `PROTECTED_PATHS` 미포함 → **게스트 진입 가능**.
- `useRecordTournament` 는 `useRequireAuth` wrap **없음** — 자유 호출.
- 호출 측 (`TournamentPlayClient`) 은 try/catch silent fail — 실패해도 결과 화면 진입.
- **개인 데이터 쓰기 액션만 인증 요구** — `useRequireAuth` action 단위 wrap → 비로그인 시 confirm dialog → `/login?redirect=` 이동:
  - 마이페이지 우승지 저장: `POST /mypage/tournaments`
  - 여행 유형 적용: `PATCH /travel-types/me`

→ 게스트 UX: 토너먼트 끝까지 플레이 + 결과 보기 가능. "저장" / "내 유형으로 적용" 누를 때만 로그인 dialog.

## C-2. `PATCH /travel-types/me` — 저장 ack only

BE 응답: `TravelType (recommended: [])` — 저장만 ack. `recommended` 빌드는 `GET /travel-types/me` 가 책임.

### FE 정책

- `useSetMyTravelType.onSuccess` 가 `setQueryData` 호출하면 캐시가 빈 `recommended` 로 덮어써져 quiz/result 의 "이런 여행지가 어울려요" 영역 사라짐.
- 따라서 `invalidateQueries({ queryKey: rankingKeys.travelType() })` 호출 → 다음 `useMyTravelType` refetch 가 `recommended` 포함 응답 → 영역 유지.

```ts
// src/features/ranking/hooks/use-ranking.ts
export function useSetMyTravelType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code) => rankingApi.setMyTravelType(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rankingKeys.travelType() }); // ← setQueryData X
      qc.invalidateQueries({ queryKey: ['mypage', 'summary'] });
    },
  });
}
```

---

## 관련 문서

- BE Swagger — endpoint shape (`/docs`)
- [ARCHITECTURE.md](./ARCHITECTURE.md) — FE 전체 구조
- [DEPLOY.md](./DEPLOY.md) — 운영 배포
- FE 진실:
  - `src/features/auth/` (login/signup/find-id/forgot/reset/change)
  - `src/features/notification/` (inbox/badge/utils)
  - `src/middleware.ts` — 보호 경로 + sessionID 모델
  - `src/services/interceptors/auth.ts` — 401 처리
  - `src/app/sw.ts` — push handler
