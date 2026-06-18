# BE 요청서 — 회원가입 폼 단순화 (nickname signup 입력 추가)

**상태**: 신설 / 전달 대기
**작성일**: 2026-06-18
**관련**: `POST /auth/signup`, `SignupDto`

## 배경

기획 측 회원가입 4 필드 정책 — 사용자가 처음 가입 시 입력하는 항목을 다음으로 단순화:

1. **아이디** (영문/숫자 4-20자)
2. **비밀번호** (10자 이상) + **비밀번호 확인** (FE 단독 검증)
3. **닉네임** (2-10자) — UserDto.nickname 그대로
4. **이메일** (비번찾기 용)

현재 BE 가 받는 추가 필드 (`name`, `birthDate`, `phone`) 는 기획 의도에 없음.

## 요청 사항

### 1. `SignupDto` 에 `nickname` 필드 추가 (필수)

```ts
// 현재
interface SignupDto {
  name: string;
  username: string;
  password: string;
  birthDate: string;
  email: string;
  phone: string;
}

// 변경 후
interface SignupDto {
  username: string; // 영문/숫자 4-20자 (또는 4-20자 + underscore — 정책 확인)
  password: string; // 10-72자
  nickname: string; // 2-10자 (NEW)
  email: string;

  // 옵셔널 또는 제거 (택1) — 기획 의도와 무관한 필드
  name?: string;
  birthDate?: string;
  phone?: string;
}
```

**중복 검증 코드**:

- `AUTH_USERNAME_TAKEN` (이미 있음) — 409
- `AUTH_EMAIL_TAKEN` (이미 있음) — 409
- **NEW: `AUTH_NICKNAME_TAKEN`** — 409, 닉네임 unique 정책 시. 또는 닉네임은 unique 안 함 (자유 입력 허용) 정책 결정 필요.

### 2. `name` / `birthDate` / `phone` 처리 (택1)

| 옵션       | 변경                                                 | 영향                                                                                 |
| ---------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **A 권장** | 3 필드 모두 옵셔널 (`?`) 로 변경 — 점진 마이그레이션 | FE 도 옵셔널로 폼에서 제외 가능. 기존 사용자 데이터 보존.                            |
| B          | 3 필드 완전 제거                                     | mypage 등에서 추후 별도 입력 흐름 필요. 기존 컬럼은 nullable 로 schema 마이그레이션. |

### 3. 닉네임 pattern (정책 결정)

- 한글 / 영문 / 숫자 모두 허용?
- 특수문자 차단?
- 비속어 필터?

→ 현재 FE 는 `2-10 grapheme 자` + control/HTML 차단 만. BE 측 정책 합의 후 동기.

## FE 측 처리 (완료, BE 변경 대기 우회)

BE 가 SignupDto 에 `nickname` 추가 전엔 다음 2-step 으로 즉시 동작:

```ts
// useSignup hook (use-auth.ts)
mutationFn: async (data: SignupDto & { nickname?: string }) => {
  const { nickname, ...signupData } = data;
  const response = await authApi.signup(signupData);
  if (nickname) {
    await onboardingApi.complete({ nickname }); // POST /me/complete-onboarding
  }
  return response;
};
```

**FE 폼 단순화 (BE 변경 후)**:

- BE 가 `SignupDto.nickname` 추가 → `npm run generate:api`
- FE 의 2-step chain 한 줄 합치고 `onboardingApi.complete` 호출 제거
- BE 가 `name/birthDate/phone` 옵셔널/제거 → FE 폼에서도 제거 (현재 polished UI 도 4 필드 + 비번확인 만 노출하도록)

## Acceptance

- [ ] OpenAPI spec 의 `SignupDto.nickname` (2-10자) 추가
- [ ] 닉네임 unique 검증 정책 결정 (unique 일 시 `AUTH_NICKNAME_TAKEN` 추가)
- [ ] `name/birthDate/phone` 처리 방향 결정 (옵션 A 권장)
- [ ] FE 의 `npm run generate:api` 시 `SignupDto.nickname` 자동 포함 확인
- [ ] FE 가 2-step chain 단순화
