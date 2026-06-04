# Auth Flows — BE 인계 명세

프론트가 이미 구현 완료. BE 가 다음 endpoint 들을 정확히 매칭하면 추가 FE 작업 없이 동작.

`@/services/api/client` 의 axios `baseURL = NEXT_PUBLIC_API_URL`. 모든 요청은
`withCredentials: true` (쿠키 기반).

> **실시간 BE 명세는 Swagger UI 에서 확인**:
>
> - 로컬: http://localhost:3000/docs
> - OpenAPI JSON: http://localhost:3000/docs-json
>   본 MD 문서는 정책/시나리오/에러 코드 매핑 — Swagger 는 endpoint shape contract.

---

## 공통

### 인증 방식

- **쿠키 기반** — `Set-Cookie` 로 `access_token` / `refresh_token` 발급.
- FE 는 응답 body 의 토큰을 절대 읽지 않음 (XSS 위험 회피).
- 쿠키 속성 권장: `HttpOnly; Secure; SameSite=Lax; Path=/`.
  · `refresh_token` 은 `Path=/auth/refresh` 로 좁히는 것 권장.
  · 만료: access 짧게(15분), refresh 길게(2주~30일).

### 토큰 갱신 (interceptor 자동)

- 401 응답을 받으면 axios interceptor 가 `POST /auth/refresh` 호출 → 성공 시
  원 요청 재시도. 실패 시 `clearAuth()` + `/login?redirect=...` 푸시.
- BE 는 `/auth/refresh` 가 access_token 쿠키만 갱신해서 204 또는 200 반환.
- 무한 refresh 루프 방지: `/auth/refresh` 호출 자체에는 retry 안 함 (interceptor
  에서 ensure).

### 에러 표준화

BE 는 다음 두 가지만 보장하면 됨 (interceptor 가 normalize):

```json
{
  "code": "AUTH_INVALID_CREDENTIALS",
  "message": "아이디 또는 비밀번호가 올바르지 않습니다."
}
```

- `code`: SCREAMING_SNAKE_CASE. FE 의 `error-normalize.ts` 가 우선 매핑.
- `message`: 사용자 표시용 한글. `code` 매핑 실패 시 fallback 으로 사용.
- HTTP status 만으로도 동작 (code 없으면 상태 코드 기반 generic 메시지).

표준 code 예시:

- `AUTH_INVALID_CREDENTIALS` (로그인 실패)
- `AUTH_USERNAME_TAKEN` (회원가입 — 아이디 중복)
- `AUTH_EMAIL_TAKEN` (회원가입 — 이메일 중복)
- `AUTH_TOKEN_EXPIRED` (reset 링크 만료)
- `AUTH_TOKEN_INVALID` (reset 링크 위변조 / 이미 사용됨)
- `AUTH_PASSWORD_WEAK` (비밀번호 정책 위반 — BE 추가 검증)
- `AUTH_PASSWORD_REUSED` (이전 N개 비밀번호 중 하나와 동일)
- `AUTH_CURRENT_PASSWORD_WRONG` (변경 시 현재 비번 불일치)
- `RATE_LIMIT` (forgot-password / login 등 시도 과다)

---

## 1. 로그인 — `POST /auth/login`

### Request

```ts
{
  username: string; // 1~20자
  password: string; // 1자 이상
}
```

### Response 성공 — 200

- Body: `{ "success": true }` (현재 FE 가 success 필드 안 읽음)
- **Set-Cookie**: `access_token=...; HttpOnly; ...`, `refresh_token=...; HttpOnly; ...`
- FE 동작: 즉시 `GET /me` 재호출 → `useAuthStore.setAuth(user)` → `?redirect=`
  쿼리 또는 `/` 로 이동.

### Response 실패

| 상태 | code                       | 의미               | FE 처리                         |
| ---- | -------------------------- | ------------------ | ------------------------------- |
| 401  | `AUTH_INVALID_CREDENTIALS` | 아이디/비번 불일치 | form root error 토스트 + 메시지 |
| 429  | `RATE_LIMIT`               | 시도 너무 많음     | "잠시 후 다시 시도해주세요"     |
| 5xx  | (any)                      | 서버 오류          | "네트워크 오류" 표준 메시지     |

### 보안

- 아이디 존재 여부를 응답으로 구분하지 않음 (account enumeration 차단).
- BE 가 시도 횟수 추적, 일정 횟수 이상 시 `429` 또는 captcha.

---

## 2. 회원가입 — `POST /auth/signup`

### Request (FE 검증 통과한 값)

```ts
{
  name: string; // 1~30자, 제어/HTML 문자 차단
  username: string; // /^[a-zA-Z0-9_]{4,20}$/
  password: string; // 10~72자, 제어 문자 차단
  birthDate: string; // YYYY-MM-DD
  email: string; // RFC 이메일
  phone: string; // /^01[016789]-?\d{3,4}-?\d{4}$/
}
```

### Response 성공 — 201

- Body 비어있음. **Set-Cookie 발급 안 함** (자동 로그인 X).
- FE 동작: `/login?signup=success` 로 이동 → toast "회원가입 완료. 로그인해주세요".

### Response 실패

| 상태 | code                  | 의미                     | FE 처리              |
| ---- | --------------------- | ------------------------ | -------------------- |
| 400  | `VALIDATION`          | 형식 위반 (BE 추가 검증) | form root error      |
| 409  | `AUTH_USERNAME_TAKEN` | 아이디 중복              | username field error |
| 409  | `AUTH_EMAIL_TAKEN`    | 이메일 중복              | email field error    |
| 422  | `AUTH_PASSWORD_WEAK`  | BE 비번 강도 정책 위반   | password field error |
| 429  | `RATE_LIMIT`          | abuse                    | root error           |

### BE 추가 검증 권장

- 비속어 / 예약어 username
- 비번 사전(dictionary) 매칭, 연속 문자, username 포함 등
- 이메일 도메인 disposable 차단

---

## 3. 아이디 찾기 — `POST /auth/find-id`

### Request

```ts
{
  name: string; // 가입 시 이름과 정확히 일치
  email: string; // 가입 시 이메일과 정확히 일치
}
```

### Response 성공 — 200

```ts
{
  username: string | null; // 매칭 시 마스킹된 아이디 "tes***01" / 미매칭 시 null
}
```

### 보안 정책

- **메일 발송 안 함** (현재 정책). 화면에 마스킹된 아이디 노출.
- 미매칭 시 `null` 반환 — 200 OK 유지 (enumeration 방지).
- 마스킹 규칙: 앞 3자 노출 + `***` + 끝 2자 노출. 4자 미만은 절반만 노출.
- BE rate limit 필수 (반복 조회 차단).

### Response 실패

| 상태 | code         | 의미            |
| ---- | ------------ | --------------- |
| 400  | `VALIDATION` | email 형식 위반 |
| 429  | `RATE_LIMIT` | 시도 너무 많음  |

---

## 4. 비밀번호 찾기 — 전체 여정

### 사용자 단계별 흐름

```
[1] /login → "비밀번호를 잊으셨나요?" 클릭
       ↓
[2] /forgot-password 페이지 — 이메일 입력
       ↓ POST /auth/forgot-password
[3] "메일을 발송했어요" 안내 화면 (204 무조건 노출)
       ↓ (이메일 수신)
[4] 이메일 본문의 링크 클릭
       ↓
[5] /reset-password?token=... 페이지 — 새 비번 + 확인 입력
       ↓ POST /auth/reset-password
[6] /login?reset=success → toast "비밀번호가 변경됐어요. 다시 로그인해주세요"
       ↓
[7] 새 비번으로 로그인
```

각 단계의 endpoint / 정책은 아래 4-1, 4-2, 4-3 절에서 상세.

---

## 4-1. 재설정 링크 발송 — `POST /auth/forgot-password`

### Request

```ts
{
  email: string;
}
```

### Response 성공 — 204

- Body 비어있음.
- BE 가 이메일 존재 시 → 토큰 발급 + 링크 메일 발송.
- 미존재 시 → **여전히 204 반환** + 메일 발송 X (account enumeration 방지).
- 토큰 만료: **1시간** (운영 기본).

### Response 실패

| 상태 | code         | 의미                       | FE 처리                     |
| ---- | ------------ | -------------------------- | --------------------------- |
| 400  | `VALIDATION` | email 형식 위반            | email field error           |
| 429  | `RATE_LIMIT` | 같은 이메일/IP 재시도 과다 | "잠시 후 다시 시도해주세요" |

### Rate limit 정책 (필수)

- 같은 **이메일** 기준: 1시간 내 3회 초과 시 429.
- 같은 **IP** 기준: 1시간 내 10회 초과 시 429 (계정 enumeration 방어).
- 카운터는 **존재 안 하는 이메일도 동일하게 적용** (enum 방지).

### 메일 발송 spec

발신/제목/본문은 BE 책임. 변수 보간만 합의:

| 변수                | 값                                                               |
| ------------------- | ---------------------------------------------------------------- |
| `${FE_URL}`         | `NEXT_PUBLIC_SITE_URL` (예: `https://trip-bite-mxue.vercel.app`) |
| `${TOKEN}`          | URL-safe base64 / UUID 등 (충돌 X, 추측 불가)                    |
| `${EXPIRES_AT_KST}` | 토큰 만료 시각 (KST, "2026-06-04 22:30")                         |
| `${USERNAME}`       | 사용자 아이디 (가능 시 — 본인 확인 용도)                         |

링크 형식 (정확 매칭):

```
${FE_URL}/reset-password?token=${TOKEN}
```

권장 메일 본문 (참고):

```
[TripBite] 비밀번호 재설정 안내

${USERNAME} 님, 비밀번호 재설정을 요청하셨어요.

아래 링크를 눌러 새 비밀번호를 설정하세요:
${FE_URL}/reset-password?token=${TOKEN}

이 링크는 ${EXPIRES_AT_KST} 까지 유효해요. 만료 후엔 다시 요청해주세요.

본인이 요청하지 않았다면 이 메일은 무시하셔도 됩니다.
다만 같은 알림이 반복된다면 계정 보안을 점검해주세요.
```

발신 주소 / 메일 템플릿 디자인은 BE 가 결정.

### 메일 재발송 (resend) — 별도 endpoint 없음

- 사용자가 메일을 못 받은 경우 `/forgot-password` 폼에서 동일 이메일로 다시 제출.
- BE 가 **기존 토큰 무효화 후 새 토큰 발급** (둘 다 유효 X).
- rate limit 카운터는 그대로 적용 — 1시간 3회 제한.

### 계정 보호 알림 (선택, 권장)

악의적 재설정 시도 인지를 위해 BE 가 다음 중 하나 발송 권장:

- **메일**: "재설정 요청을 받았어요. 본인이 아니라면 비밀번호를 즉시 변경해 주세요"
  → forgot-password 호출이 본인이라면 정상 안내, 타인이라면 경고.
- **인앱 알림** (사용자 로그인 중이면): `notifications.security` type 으로 inbox 추가.
  · `NOTIFICATIONS.md` 의 `AppNotification` type 에 `security` 추가 필요.

발송 시점: 토큰 발급 직후 (즉, 이메일 매칭된 경우만).

---

## 4-2. 토큰 사전 검증 — `GET /auth/reset-password/validate?token=...` (선택)

FE 의 `/reset-password` 페이지가 진입 시점에 즉시 만료 여부 표시할 수 있도록.
구현 시 FE 도 함께 연동 필요 (현재는 POST 시점에 검증).

### Response 200

```ts
{
  valid: true;
  expiresAt: string;
} // ISO
```

### Response 410 / 400

- `AUTH_TOKEN_EXPIRED` / `AUTH_TOKEN_INVALID` 동일 code.

**우선순위 낮음** — POST 시점 검증으로도 UX 큰 차이 없음. 필요해지면 추가.

---

## 5. 비밀번호 재설정 — `POST /auth/reset-password`

### Request

```ts
{
  token: string; // 메일 링크의 query token
  password: string; // 새 비번 10~72자
}
```

### Response 성공 — 204

- Body 비어있음.
- FE 동작: `/login?reset=success` 로 이동 → toast.

### Response 실패

| 상태 | code                   | 의미                      | FE 처리                                 |
| ---- | ---------------------- | ------------------------- | --------------------------------------- |
| 400  | `AUTH_TOKEN_INVALID`   | 토큰 위변조 / 이미 사용됨 | root error                              |
| 410  | `AUTH_TOKEN_EXPIRED`   | 토큰 만료 (1시간 초과)    | "재설정 링크가 만료됐어요" + 재발송 CTA |
| 422  | `AUTH_PASSWORD_WEAK`   | 비번 강도 부족            | password field error                    |
| 422  | `AUTH_PASSWORD_REUSED` | 이전 비번과 동일          | password field error                    |

### 보안

- **1회용 토큰** (성공 시 즉시 무효화).
- **토큰 재발급 시 기존 토큰 무효화** — 둘 다 유효 상태 금지.
- **재설정 성공 시 user 의 모든 기존 session 무효화** (refresh_token DB 전부 삭제).
  → 다른 디바이스에서 로그아웃됨 → 탈취 대응.

### 이전 비밀번호 재사용 차단

- BE 가 **마지막 N개 비밀번호 hash 보관** (권장 N=3) — 새 비번이 이전 N개와 일치 시
  422 `AUTH_PASSWORD_REUSED` 응답.
- hash 비교 — 평문 보관 절대 금지.
- 보관 정책: 최근 N개 + 가장 오래된 것 폐기 (롤링 큐).

---

## 6. 비밀번호 변경 (로그인 상태) — `POST /me/change-password`

### Request

```ts
{
  currentPassword: string;
  newPassword: string; // 10~72자
}
```

FE 폼은 `confirmPassword` 도 받지만 zod refine 으로 일치 검증 후 BE 에는 전달 X.

### Response 성공 — 204

### Response 실패

| 상태 | code                          | 의미                      |
| ---- | ----------------------------- | ------------------------- |
| 401  | `AUTH_REQUIRED`               | 미인증 (interceptor 처리) |
| 422  | `AUTH_CURRENT_PASSWORD_WRONG` | 현재 비번 불일치          |
| 422  | `AUTH_PASSWORD_WEAK`          | 새 비번 강도 부족         |

### 권장

- 변경 성공 시 기존 refresh_token 무효화 → 다른 디바이스 강제 로그아웃.

---

## 7. 로그아웃 — `POST /auth/logout`

### Request — Body 없음

### Response — 204

### 동작

- BE: 쿠키 만료 (`Set-Cookie: access_token=; Max-Age=0`), refresh_token DB
  에서 무효화.
- FE: 응답 무관 (`onSettled`) `useAuthStore.clearAuth()`, queryClient.clear(),
  SW cache 비움 → `/` 로 이동 (middleware 가 미인증 시 `/login` 으로).

---

## 8. 토큰 갱신 — `POST /auth/refresh`

### Request — Body 없음, refresh_token 쿠키만

### Response 성공 — 204 + 새 access_token Set-Cookie

### Response 실패 — 401

### 동작

- FE interceptor 가 401 받으면 자동 호출. 호출 결과로 원 요청 retry.
- BE: refresh_token 검증 → 새 access_token 만 발급. refresh_token rotation
  적용 시 새 refresh_token 도 Set-Cookie (권장).

---

## 9. 내 정보 — `GET /me`

### Response 성공 — 200

```ts
{
  id: string;
  username: string;
  nickname: string;
  email: string;
  isOnboarded: boolean; // 온보딩 완료 여부 (middleware redirect 판단)
  // travelType, avatarUrl 등 옵션 필드 (zod schema 참조)
}
```

FE 가 `userSchema.parse()` 로 런타임 검증 — 누락 필드면 hard fail.

### Response 실패 — 401

- 미인증. interceptor refresh 시도 후 fail 시 `/login?redirect=` 푸시.

---

## FE 검증 규칙 (참고)

zod 스키마 (FE):

- `src/features/auth/schemas/login.ts` — username/password 존재만
- `src/features/auth/schemas/signup.ts` — 전체 형식 검증
- `src/features/auth/schemas/find-id.ts` — name + email
- `src/features/auth/schemas/password-reset.ts` — forgot/reset/change

BE 는 동일 규칙 + 추가 보안 검증 적용.

---

## Set-Cookie 예시 (BE 참고)

```http
Set-Cookie: access_token=eyJhbGc...; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=900
Set-Cookie: refresh_token=eyJhbGc...; Path=/auth/refresh; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000
```

CORS:

- `Access-Control-Allow-Origin: <FE origin>` (정확 매칭, 와일드카드 X)
- `Access-Control-Allow-Credentials: true`
- preflight 응답에 `Access-Control-Allow-Headers: Content-Type, Authorization`

---

## 테스트 시나리오 체크리스트 (BE 작성 시)

### 로그인

- [ ] 정상 자격 → 200 + 쿠키 발급
- [ ] 잘못된 비번 → 401 `AUTH_INVALID_CREDENTIALS`
- [ ] 존재 안 하는 username → **동일하게 401 `AUTH_INVALID_CREDENTIALS`** (enum 방지)
- [ ] 5회 실패 → 429 또는 captcha

### 회원가입

- [ ] 정상 입력 → 201 (쿠키 발급 X)
- [ ] 중복 username → 409 `AUTH_USERNAME_TAKEN`
- [ ] 중복 email → 409 `AUTH_EMAIL_TAKEN`
- [ ] 약한 비번 (BE 정책) → 422 `AUTH_PASSWORD_WEAK`

### 아이디 찾기

- [ ] 정상 매칭 → `{ username: "tes***01" }`
- [ ] 미매칭 → `{ username: null }` (200 유지)
- [ ] rate limit → 429

### 비번 재설정 (forgot + reset)

- [ ] 존재하는 이메일 forgot → 메일 발송 + 204 + 토큰 1시간 만료
- [ ] 존재 안 하는 이메일 forgot → 메일 발송 X + **204** (enum 방지)
- [ ] 같은 이메일 1시간 내 4회째 forgot → 429 `RATE_LIMIT`
- [ ] 같은 IP 1시간 내 11회째 forgot (이메일 무관) → 429
- [ ] forgot 재호출 → 기존 토큰 무효화 + 새 토큰 발급 (둘 다 유효 X)
- [ ] 메일 본문 링크: `${FE_URL}/reset-password?token=${TOKEN}` 형식
- [ ] 정상 토큰 reset → 204 + 모든 refresh_token DB 무효
- [ ] 만료 토큰 → 410 `AUTH_TOKEN_EXPIRED`
- [ ] 1회 사용한 토큰 재사용 → 400 `AUTH_TOKEN_INVALID`
- [ ] 위변조 토큰 → 400 `AUTH_TOKEN_INVALID`
- [ ] 새 비번이 최근 3개 중 하나와 일치 → 422 `AUTH_PASSWORD_REUSED`
- [ ] 약한 비번 (BE 정책 위반) → 422 `AUTH_PASSWORD_WEAK`
- [ ] reset 성공 후 기존 세션의 GET /me → 401 (강제 로그아웃 확인)
- [ ] (선택) 계정 보호 알림 — 토큰 발급 직후 메일/인앱 알림

### 로그아웃 / refresh

- [ ] 로그아웃 → 204 + 쿠키 만료 + refresh_token DB 무효
- [ ] 만료된 access + 유효 refresh → /auth/refresh 204 → 원 요청 자동 retry
- [ ] 만료된 refresh → 401 → FE 가 /login 푸시
