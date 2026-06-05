# Notifications & Web Push — BE 인계 명세

프론트가 이미 구현 완료. BE 가 다음 endpoint + push 발송 흐름을 매칭하면 추가
FE 작업 없이 동작.

`@/services/api/client` 의 axios `baseURL = NEXT_PUBLIC_API_URL` 기준.
모든 요청은 `withCredentials: true` (쿠키 기반 인증).

알림은 **두 채널** 으로 분리:

1. **인앱 알림함** (Notification Inbox) — 헤더 종 버튼 → dropdown.
   인증된 사용자가 앱을 열어 둔 동안만. 폴링 30초.
2. **Web Push** — OS 레벨 알림. 앱이 닫혀 있어도 수신.
   VAPID + Service Worker 기반.

동일 이벤트는 **양쪽 채널에 동시 발행** 권장 (둘 다 enabled 일 때).

---

## A. 인앱 알림함 (Notification Inbox)

### 알림 종류 (`NotificationType`)

```ts
type NotificationType =
  | 'letter.received' // 받은 편지 도착
  | 'letter.liked' // 내 편지에 좋아요
  | 'tournament.shared' // 토너먼트 공유 (수신자에게)
  | 'event'; // 일반 이벤트/공지
```

추가 필요 시 type 유니온 확장 + FE `NotificationDropdown` 의 `TYPE_ICON` 매핑.

### A-1. `GET /notifications` — 인박스 조회

#### Response 200

```ts
{
  items: AppNotification[];
  unreadCount: number;
}

type AppNotification = {
  id: string;
  type: 'letter.received' | 'letter.liked' | 'tournament.shared' | 'event';
  title: string;              // 표시용 텍스트 ("새로운 편지가 도착했어요")
  body?: string;              // 부가 정보 (보낸 사람 닉네임 / 편지 미리보기 등)
  link?: string;              // 클릭 시 이동 경로 (예: "/letter/abc123")
  imageUrl?: string;          // 부가 이미지 (선택)
  read: boolean;
  createdAt: string;          // ISO 8601
};
```

#### 정렬

`createdAt DESC` — 최신이 위. FE 는 그대로 표시.

#### 페이지네이션

현재 FE 미사용. 30개 이상 누적되면 cursor 추가 권장:

```
GET /notifications?cursor=<id>&limit=20
→ { items, unreadCount, nextCursor }
```

#### 폴링

FE 는 `refetchInterval: 30s` + `refetchOnWindowFocus`. BE 부하 고려해 응답에
`ETag` / `Last-Modified` 추가하고 304 활용 권장.

#### Response 실패

- 401: 미인증. interceptor 자동 처리.

### A-2. `POST /notifications/:id/read` — 단건 읽음

#### Response 204

- Body 비어있음.
- BE: 해당 알림의 `read=true` 갱신. unreadCount 자동 감소.

#### Response 실패

- 404: 존재 안 함 (이미 삭제 등) — FE 는 silent fallback (invalidate 후 새 목록).

### A-3. `POST /notifications/read-all` — 일괄 읽음

#### Response 204

- BE: 본인의 모든 미읽음 알림을 read=true 로.

---

## B. Web Push (OS 알림)

### 인증 — VAPID

서버가 VAPID key pair 생성:

```bash
npx web-push generate-vapid-keys
```

- **Public key** → FE 빌드 환경변수 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
  · base64url 형식 (예: `BNbxqv...`)
- **Private key** → BE 서버에만 보관 (절대 노출 금지)

`web-push` (Node) / `pywebpush` (Python) / `webpush` (Go) 등 라이브러리로 발송.

### B-1. `POST /notifications/subscribe` — 구독 등록

#### Request

```ts
{
  endpoint: string; // 푸시 서비스 endpoint URL (예: https://fcm.googleapis.com/fcm/send/...)
  keys: {
    p256dh: string; // base64url ECDH public key
    auth: string; // base64url auth secret
  }
}
```

- FE 가 `pushManager.subscribe({ applicationServerKey })` 후 그 결과를 그대로 POST.
- 자세한 형식: `src/features/notification/utils/subscription.ts:42`

#### Response 201 (또는 204)

- Body 비어있음.
- BE: 사용자 ID 와 함께 DB 에 저장. **endpoint 가 UNIQUE KEY**.
  · 같은 사용자가 여러 디바이스에서 구독 → 여러 row.
  · 같은 endpoint 재등록 → upsert (key 가 갱신되었을 수 있음).

#### Response 실패

- 400: payload 형식 위반
- 401: 미인증

#### 보안

- endpoint URL 은 push service 인증 토큰 — 노출 시 임의 push 가능.
  서버 로그에 마스킹 권장.

### B-2. `POST /notifications/unsubscribe` — 구독 해제

#### Request

```ts
{
  endpoint: string;
}
```

#### Response 204

- BE: 해당 endpoint row 삭제. 동일 사용자의 다른 endpoint 는 유지.

### B-3. Push 발송 (BE → 사용자)

#### Payload 형식 (FE SW 가 기대하는 JSON)

```ts
{
  title: string;              // 알림 제목 (필수)
  body?: string;              // 본문 (1~2줄)
  link?: string;              // 클릭 시 이동 경로 ("/letter/abc123")
  tag?: string;               // 같은 tag → OS 가 중복 알림 합침
  icon?: string;              // 알림 아이콘 (절대 URL 또는 절대 경로). 기본 /icons/icon-192x192.png
  badge?: string;             // Android 상단 표시줄 작은 배지. 기본 /icons/icon-72x72.png
}
```

SW handler 위치: `src/app/sw.ts:132` (push event).

#### web-push 발송 예시 (Node.js)

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
    tag: `letter:${letterId}`, // 같은 편지 중복 알림 합치기
  }),
  { TTL: 60 * 60 * 24 }, // 24시간 보관 후 폐기
);
```

#### 발송 실패 → 구독 정리

- **410 Gone** / **404 Not Found**: 사용자가 브라우저에서 구독 해제했거나
  push service 가 endpoint 만료 처리. **DB 에서 해당 row 삭제 필수**.
- 5xx: 일시 오류, retry queue (지수 백오프).
- 그 외 (403 등): VAPID key 불일치 등 — 로그 후 알림.

### B-4. 알림 클릭 → 화면 이동

SW `notificationclick` 이벤트가 처리:

- 우리 origin 의 열린 탭이 있으면 → focus + `postMessage({ type: 'NAVIGATE', link })`
  → `ServiceWorkerNavigateBridge` 가 router.push.
- 없으면 → `clients.openWindow(link)`.

→ BE 는 `link` 만 정확한 path 로 채우면 됨.

---

## C. 알림 설정 (User Settings)

### C-1. `GET /settings` — 설정 조회

#### Response 200

```ts
{
  notifications: {
    pushEnabled: boolean; // Web Push 수신 토글
    inAppEnabled: boolean; // 인앱 알림함 사용 토글
    letterReceived: boolean; // "편지 도착" 카테고리 on/off
    letterLiked: boolean; // "내 편지 좋아요" 카테고리 on/off
  }
  // 추후 확장 (테마, 언어, 위치 권한 등)
}
```

### C-2. `PATCH /settings/notifications` — 부분 갱신

#### Request

`NotificationSettings` 의 일부 필드 (`Partial<NotificationSettings>`):

```json
{ "pushEnabled": false }
```

#### Response 200

- 갱신된 전체 `UserSettings` 객체 반환 (`PUT` 시맨틱).
- FE 가 `qc.setQueryData(settingsKeys.user(), updated)` 로 캐시 통째 교체.

### 설정 ↔ 발송 정책

- `pushEnabled=false` → BE 는 해당 사용자에게 push 발송 안 함 (구독은 유지).
- `inAppEnabled=false` → 인박스에 row 추가 안 함 (또는 무시).
- `letterReceived=false` → `letter.received` type 만 skip.
- `letterLiked=false` → `letter.liked` type 만 skip.

→ BE 발송 로직: `if (settings.pushEnabled && settings[`${type}` 카테고리])` 형태로
이중 게이트.

---

## D. iOS Safari 특수 정책 (FE 가 미리 가드)

iOS 16.4+ 부터만 Web Push 지원. 추가 조건:

- **PWA standalone 모드** 에서만 동작 (홈 화면 추가 후 실행).
- 일반 Safari 탭에서 `Notification.requestPermission()` 호출은 silent fail.

FE 가 `canUsePushOnIOS()` 로 사전 차단 (`utils/subscription.ts:96`). BE 는
iOS 사용자 endpoint 도 동일하게 처리 — Apple push service 가 알아서 라우팅.

→ BE 측 특별 분기 불필요. (단, endpoint 호스트가 `web.push.apple.com` 인 경우
TTL 짧게 설정 권장 — Apple service 는 만료 빠름.)

---

## E. Mock / Dev 흐름 (참고)

FE 는 dev 환경에서 BE 없이도 푸시 흐름 검증 가능:

- `triggerMockPush()` (utils/subscription.ts:112) — main thread `new Notification()`
- SW `MOCK_PUSH` postMessage 경로 (sw.ts:113) — SW 의 showNotification

BE 합류 후 mock 코드는 제거하지 않고 dev 도구로 유지 (`NEXT_PUBLIC_USE_MSW=true`
환경에서만 활성).

---

## F. 발송 이벤트 매핑 (실 비즈니스 룰)

| 트리거             | type                | title                          | body                                       | link                                | tag                            |
| ------------------ | ------------------- | ------------------------------ | ------------------------------------------ | ----------------------------------- | ------------------------------ | --------------------- | -------------------- |
| 새 편지 도착       | `letter.received`   | `편지가 도착했어요`            | `{senderNickname                           |                                     | '익명의 여행자'}가 보낸 5글자` | `/letter/${letterId}` | `letter:${letterId}` |
| 내 편지에 좋아요   | `letter.liked`      | `좋아요를 받았어요`            | `${likerCount}명이 당신의 편지를 좋아해요` | `/letter/${letterId}`               | `like:${letterId}`             |
| 토너먼트 공유 받음 | `tournament.shared` | `친구가 토너먼트를 공유했어요` | `${sharerNickname}: ${winnerName}`         | `/tournament/result?id=${recordId}` | `tournament:${recordId}`       |
| 이벤트/공지        | `event`             | (관리자 입력)                  | (관리자 입력)                              | (관리자 입력)                       | `event:${id}`                  |

`tag` 가 같은 알림은 OS 가 중복 표시 안 함 — 같은 편지에 여러 좋아요는 마지막
하나만 보임 (의도).

---

## G. 보안 / 운영 체크리스트

### 구독 관리

- [ ] endpoint 가 UNIQUE — 같은 endpoint 중복 저장 X (upsert)
- [ ] 사용자 탈퇴 시 모든 endpoint 삭제
- [ ] 410/404 응답 받은 endpoint 즉시 DB 에서 삭제
- [ ] endpoint 마지막 발송 시각 기록 — 30일 이상 미사용 endpoint 정리 권장

### 발송

- [ ] VAPID private key 는 환경변수 / secrets manager 만
- [ ] settings 양쪽 게이트 (pushEnabled + 카테고리) 확인 후 발송
- [ ] retry queue + 지수 백오프 (5xx 대응)
- [ ] TTL 24h 기본 (오프라인 사용자 대비), 일부 이벤트성은 1h
- [ ] 시간대별 rate limit (스팸 방지)

### 인박스

- [ ] read 처리 멱등 (이미 read 인 알림에 PATCH 도 200 응답)
- [ ] 30일 이상 알림 자동 삭제 권장 (DB cleanup job)

---

## H. 테스트 시나리오 체크리스트 (BE 작성 시)

### 인박스

- [ ] 미읽음 3건 + 읽음 5건 → `unreadCount: 3`, `items` 8건 (createdAt DESC)
- [ ] `POST /notifications/:id/read` → 204 + 해당 row read=true
- [ ] 이미 read 인 알림에 PATCH → 동일 204 (멱등)
- [ ] 다른 사용자의 알림 ID → 404
- [ ] 미인증 → 401

### 구독

- [ ] 신규 endpoint → 201 + DB 1 row
- [ ] 같은 endpoint 재호출 → 201/200 + DB 여전히 1 row (upsert)
- [ ] `unsubscribe` → 204 + DB 0 rows (해당 endpoint)
- [ ] 같은 사용자가 2개 디바이스 구독 → DB 2 rows, 둘 다 push 수신

### 발송

- [ ] 편지 도착 → 인박스 + push 둘 다 발행
- [ ] `pushEnabled=false` → 인박스만, push X
- [ ] `letterReceived=false` → 둘 다 X
- [ ] 만료된 endpoint (410) → 다음 발송 시 DB 정리됨
- [ ] tag 같은 알림 연속 → OS 가 중복 합쳐서 표시 (FE 검증)

### 설정

- [ ] `PATCH { pushEnabled: false }` → 다음 push 발송 차단
- [ ] 설정 미존재 사용자 → 기본값 객체 반환 (404 X)

---

## I. 환경변수 요약

### FE (`NEXT_PUBLIC_*` — 빌드 시 inline)

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — VAPID public key (base64url)
- `NEXT_PUBLIC_API_URL` — API base URL

### BE (서버 secrets)

- `VAPID_PUBLIC_KEY` — 동일 값 (검증용)
- `VAPID_PRIVATE_KEY` — 서명용 (절대 노출 금지)
- `VAPID_SUBJECT` — `mailto:contact@tripbite.app` 형식

VAPID key 변경 시 모든 기존 구독 무효화 — 신중히.
