# BE 요청 — `POST /auth/signup` 응답에 session cookie + user 추가

> 작성: 2026-06-10
> 영향: 회원가입 후 자동 로그인 1-round-trip 화. 현재는 FE 가 signup + login 2회 호출 (network 비효율 + 부분 실패 위험)
> 우선순위: P2 (UX 개선, blocking 아님)

---

## 요약

`/v1/auth/signup` 응답에 두 가지 변경:

1. **응답 body** — `void` → `{ user: UserDto }` (login response 와 동일 spec)
2. **응답 헤더** — `Set-Cookie: SID=...` (login 과 동일 세션 발급)

`UserDto` 는 `me`/`login` 과 동일 schema.

---

## 배경

**현재 흐름** (FE):

1. 사용자가 SignupForm 제출 → `POST /v1/auth/signup` (cookie 미발급)
2. BE 응답 받고 동일 credential 로 `POST /v1/auth/login` 자동 호출 (이번 commit 추가)
3. login 응답으로 session cookie 발급 → `me` fetch → store hydrate → onboarding 으로 navigate

**문제점**:

- network round-trip 2회 (signup + login + me = 3회)
- signup 성공 + login 실패 (rate limit / 일시 네트워크) → 사용자는 가입 됐지만 로그인 안 됨. fallback `/login?signup=success&username=...` 로 가야 함 (구현됨).
- 부분 실패 시나리오가 BE/FE 모두 헤더 ↔ 응답 정합 책임 분산.

**목표**:

1. `POST /auth/signup` 가 BE 측에서 가입 + 세션 생성을 atomic 하게 처리
2. 응답에 session cookie 가 set 되어 있어서 FE 는 추가 login 호출 불필요
3. `user` 도 함께 반환 → FE 가 즉시 store hydrate (별도 `me` fetch 도 생략 가능)

---

## 요청 변경 사항

### 응답 spec

**Before** (현재):

```http
POST /v1/auth/signup
→ 201 Created
   (empty body, no cookie)
```

**After** (요청):

```http
POST /v1/auth/signup
→ 201 Created
   Set-Cookie: SID=<token>; HttpOnly; Secure; SameSite=Lax; Path=/
   {
     "user": {
       "id": "...",
       "username": "...",
       "name": "...",
       "email": "...",
       "phone": "...",
       "isOnboarded": false,
       ...UserDto 전체
     }
   }
```

`login` 응답과 동일 spec — `LoginResponseDto` 가 이미 `{ user: UserDto }` 형태면 그 type 그대로 재사용 가능.

### 응답 정책

- signup 성공 → cookie + user 함께 반환 (atomic)
- duplicate username/email → 기존 409 그대로 (변경 없음)
- validation 실패 → 기존 400 (변경 없음)

backward compatible — 새 응답 필드 `user` 가 추가될 뿐, FE 의 기존 try/catch 흐름 무영향.

---

## FE 측 후속 작업 (BE 작업 완료 시)

```ts
// src/features/auth/hooks/use-auth.ts
export function useSignup() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: SignupRequest) => authApi.signup(data), // 응답 type = LoginResponseDto
    onSuccess: (response) => {
      setAuth(response.user); // 별도 login + me 호출 불필요
      router.replace('/onboarding');
      router.refresh();
    },
  });
}
```

예상 작업량: S (≤15분) — orval 재생성 후 hook 단순화.

---

## 검증 방법 (BE 측)

작업 완료 후:

1. Swagger UI `/docs` 의 `POST /v1/auth/signup` 응답 schema 가 `{ user: UserDto }` 노출
2. 실제 가입 호출 시 Response Headers 에 `Set-Cookie: SID=...` 발견
3. 응답 body 에 `user` 객체 채워짐
4. 동일 응답으로 즉시 `GET /me` 호출 시 200 (세션 유효)

FE 측은 위 보강 후 회귀 (signup → onboarding 진입) 확인.

---

## 보안 고려

- signup 직후 cookie 발급 = login 직후 cookie 발급과 동일한 보안 모델 (이메일 verify 흐름이 없는 현재 spec 기준)
- 만약 이메일 verify 단계를 추후 추가하면, 그 단계 통과 전엔 cookie 발급 보류 정책으로 변경 가능
- session cookie 의 expiry / SameSite / HttpOnly / Secure 모두 login 응답과 동일하게

---

## 연관 문서

- 현재 FE 임시 구현: `src/features/auth/hooks/use-auth.ts` 의 `useSignup` (signup + login 연쇄)
- 보류 사유 기록: [BACKLOG.md](BACKLOG.md) "최근 완료" §2026-06-10
