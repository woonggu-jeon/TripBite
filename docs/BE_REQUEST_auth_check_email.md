# BE 요청서 — check-email + forgot-password 의 username 추가

**상태**: 신설 / 전달 대기
**작성일**: 2026-06-18
**관련**: `GET /v1/auth/check-email`, `POST /v1/auth/forgot-password`

## 배경

회원가입 폼 검증 강화 + 비밀번호 찾기 흐름 보강:

1. **이메일 중복확인 버튼** — 회원가입 폼에 "이메일 중복확인" 버튼 UI 추가됨. BE check-email endpoint 신설 필요. (현재 FE 버튼은 disabled 상태로 BE 대기.)
2. **비밀번호 찾기에 username 추가** — 사용자가 "비밀번호 찾기 → 아이디 + 이메일 입력" 흐름 요구. 보안 강화 (이메일만으로 reset 토큰 발급 X — 아이디 일치도 확인).

## 요청 1 — `GET /v1/auth/check-email?email=`

`check-username` 과 동일 패턴:

```ts
// 응답: CheckAvailabilityDto (이미 generated 에 정의됨)
GET /v1/auth/check-email?email=user@example.com
→ 200 { available: boolean }
```

FE 측 활용 (구현 완료, BE 대기 중):

```ts
// src/features/auth/api/auth.ts (BE 신설 후 추가)
checkEmail: (email: string) =>
  authControllerCheckEmailV1({ email }),
```

`SignupForm.tsx` 의 `handleCheckEmail` 가 이 호출로 채워질 예정. 버튼은 BE 신설 후 활성.

### 정책 결정 사항

- email 도 unique 강제? (회원당 1개 이메일 정책)
- 아니면 unique 안 강제 + 안내만 (예: "이 이메일로 다른 계정 가입 이력 있음")

## 요청 2 — `POST /v1/auth/forgot-password` 가 `{ username, email }` 받기

현재:

```ts
interface ForgotPasswordDto {
  email: string;
}
```

변경 후:

```ts
interface ForgotPasswordDto {
  username: string; // 영문/숫자 4-20자
  email: string;
}
```

### BE 로직 변경

- `username + email` 조합으로 계정 조회 (둘 다 일치 시에만 reset 링크 발송)
- 보안: 둘 중 하나라도 안 맞으면 "메일 발송됨" 동일 안내 (열거 방지) — 현재와 동일
- reset 링크 token 발급 정책은 변동 없음

### FE 측 처리 (구현 완료)

- `password-reset.ts` schema 가 `{ username, email }` 둘 다 검증
- `ForgotPasswordForm` 이 둘 다 입력 받음
- **현재**: BE 가 username 미수용이라 mutation 호출 시 `{ email }` 만 전달 (BE 미변경 backward-compat)
- **BE 갱신 후**: `forgot({ username, email })` 둘 다 전송으로 한 줄 변경

## Acceptance

- [ ] `GET /v1/auth/check-email?email=` 신설 (200 `{ available }`)
- [ ] `ForgotPasswordDto` 에 `username` (영문/숫자 4-20자) 필수 추가
- [ ] BE 가 `username + email` 둘 다 일치 시에만 reset 링크 발송
- [ ] FE `npm run generate:api` 후 `authApi.checkEmail` 추가 + `SignupForm.handleCheckEmail` 활성 + `ForgotPasswordForm` 이 둘 다 전송
