# BE 요청 — 회원가입 동의 통합 + 정책 본문 / 책임자 정보 결정

> 작성일: 2026-06-18
> 영향: 운영 배포 차단 항목 (정보통신망법 / 개인정보보호법 동의 절차 + 정책 본문)
> 관련 FE 파일: `src/features/onboarding/components/ConsentBlock.tsx`, `src/features/auth/components/SignupForm.tsx`, `src/app/(main)/policy/{terms,privacy}/page.tsx`

---

## 배경

2026-06-18 FE 운영 readiness audit 결과 — 인프라 견고하나 **법적 동의 절차 + 정책 본문 + 책임자 정보** 가 운영 차단 요소로 식별됨. FE 코드는 `ConsentBlock` 컴포넌트가 이미 구현돼 있어 BE 의 SignupDto 확장 + 정책 본문 / 책임자 결정 후 즉시 연결 가능.

차단 항목 3건:

1. SignupDto 에 `consents` 필드 없음 → FE 가 동의 데이터 전송 불가
2. `/policy/terms` / `/policy/privacy` 본문이 자리잡이 ("제1조~제5조" 류) — 법무 검토 본문 필요
3. 개인정보처리방침의 `privacy@example.com` placeholder — 실 책임자 이메일 필요

---

## 1. SignupDto 에 `consents` 필드 추가 — BE 작업 필요

### 현재 SignupDto

```ts
// src/api/generated/schemas/signupDto.ts (orval generated)
{
  username: string;
  password: string;
  nickname: string;
  email: string;
}
```

### 요청 — SignupDto 확장

```ts
{
  username: string;
  password: string;
  nickname: string;
  email: string;
  consents: ConsentInputDto[];  // ← 신규 필드
}

interface ConsentInputDto {
  /** 동의 항목 식별자 — FE 의 ConsentBlock 키와 정합. */
  type: 'age14' | 'terms' | 'privacy' | 'location' | 'marketing';

  /** 사용자가 동의했는지 여부 (true=동의, false=거부). */
  agreed: boolean;

  /** 사용자가 본 정책 본문의 버전 — 본문 변경 시 재동의 강제 용. */
  version: string;  // ex. "1.0.0" (semver) 또는 "2026-06-18" (date)
}
```

### 동의 항목 정합 (FE `ConsentBlock` 와 동일)

| type        | 필수 | 의미                    | 거부 시 BE 동작                        |
| ----------- | ---- | ----------------------- | -------------------------------------- |
| `age14`     | 필수 | 만 14세 이상 확인       | 회원가입 거부 (`400 CONSENT_REQUIRED`) |
| `terms`     | 필수 | 이용약관 동의           | 거부                                   |
| `privacy`   | 필수 | 개인정보처리방침 동의   | 거부                                   |
| `location`  | 선택 | 위치정보 수집·이용 동의 | 가입 진행 (location 기능 제한)         |
| `marketing` | 선택 | 마케팅 정보 수신 동의   | 가입 진행 (마케팅 미발송)              |

### 저장 정책 (BE 결정 부탁)

- BE 가 `consents` 를 별도 테이블 (`user_consents`) 에 저장 — 사용자 ID + type + agreed + version + agreedAt timestamp
- 변경 이력 추적 — 사용자가 추후 동의 철회 / 재동의 시 새 row 추가 (update 안 함)
- `marketing` / `location` 은 `/me/consents` 같은 endpoint 로 추후 변경 가능 (FE 의 설정 페이지 활용)

### Error code

- 필수 동의 누락 / agreed=false: `400 CONSENT_REQUIRED` + `details: { missing: ['age14', 'terms', 'privacy'] }`
- version 이 BE 의 현재 정책 version 과 불일치: `400 CONSENT_VERSION_MISMATCH` (FE 가 재동의 화면 노출)

### FE 작업 (BE 회신 후 진행)

- `src/features/auth/components/SignupForm.tsx` 에 `ConsentBlock` 통합 — `allRequired === true` 일 때만 submit 활성
- `src/features/auth/schemas/signup.ts` 의 zod schema 에 `consents` 배열 추가
- mock handler (`src/mocks/handlers.ts`) 의 signup 처리에 consents 검증

---

## 2. 정책 본문 / 버전 관리 — 법무 + BE 결정

### 현재 FE 상태

`src/app/(main)/policy/terms/page.tsx` + `src/app/(main)/policy/privacy/page.tsx` 가 정적 React 컴포넌트로 자리잡이 본문 보유. 법무 검토 본문으로 교체 필요.

### 옵션 A — FE 정적 본문 (권장 — 빠른 출시)

- 법무 검토 결과를 FE 정적 컴포넌트에 직접 삽입
- 버전 관리: 컴포넌트 상단의 `const POLICY_VERSION = '1.0.0'` 같은 상수
- 변경 시: FE 배포 + BE 가 새 version 으로 가입자에게 재동의 요구
- 장점: BE 의존 0, 빠른 배포
- 단점: 본문 변경마다 FE 배포 필요

### 옵션 B — BE 가 정책 본문 endpoint 제공

```
GET /v1/policy/terms        → { version, content (markdown), effectiveDate }
GET /v1/policy/privacy      → { version, content, effectiveDate }
GET /v1/policy/all-current  → { terms: {...}, privacy: {...} }
```

- 장점: 법무 변경 시 BE 만 갱신, FE 자동 반영
- 단점: BE 작업 + 본문 CMS / DB 관리 필요

**FE 권장**: 옵션 A (빠른 출시). 옵션 B 는 향후 정책 갱신 빈도 높아지면 전환.

### 필수 결정 사항

- [ ] 옵션 A vs B 결정
- [ ] 약관 / 개인정보처리방침 **법무 검토 본문** (한국어, ko / en 둘 다 필요시 i18n 확장)
- [ ] 정책 버전 (semver 또는 date 형식)
- [ ] 정책 변경 시 재동의 trigger (BE 가 me 응답에 `consentStatus: 'outdated'` 같은 필드 포함 — FE 가 modal/배너로 안내)

---

## 3. 개인정보처리방침 — 실 책임자 정보

현재 `/policy/privacy/page.tsx` 의 책임자 이메일 = `privacy@example.com` (placeholder). 운영 배포 시 다음 정보 필수:

### 필수 결정 사항

- [ ] **개인정보보호책임자**: 이름 / 직책 / 연락처 (이메일 + 전화 번호 권장)
- [ ] **개인정보보호 담당부서**: 부서명 / 연락처
- [ ] **사업자 정보**: 상호 / 사업자등록번호 / 대표자 / 주소 (개인정보처리방침 의무)
- [ ] **개인정보 수집 항목 확정**: 회원가입 시 (필수/선택), 서비스 이용 시
- [ ] **개인정보 보유 기간**: 회원 탈퇴 시 즉시 파기 (현재 자리잡이 본문) + 법령상 보유 의무 (전자상거래법 등 — 해당 시)
- [ ] **제3자 제공**: 현재 TourAPI / Vercel 명시 — 추가 (예: 카카오 OAuth, GA 등) 있으면 명시
- [ ] **개인정보 처리 위탁**: Vercel (인프라), AWS / Cloudflare 등 사용 시 명시

### 약관 추가 결정

- [ ] **유료 / 무료 정책**: 현재 무료 — 향후 유료 전환 시 약관 갱신
- [ ] **서비스 책임 한계**: TourAPI 데이터 정확성 / 추천 정합성 면책
- [ ] **분쟁 해결**: 관할 법원 (서울중앙지법 등 일반적 명시)
- [ ] **이용 제한**: 부정 사용 / 봇 / 다중 계정 시 BE 의 정책 (계정 정지 기간 등)

---

## 4. 만 14세 미만 정책 (관련 — 부수)

현재 `AgeConfirmStep` 컴포넌트 보존되나 OnboardingFlow 에서 미노출 (2026-06-18 사용자 요청). `ConsentBlock` 에 `age14` 가 있어 signup 시점에 확인 가능.

### 필수 결정 사항

- [ ] **만 14세 미만 처리**: 회원가입 차단 (현재 ConsentBlock 의 `age14` 필수 동의) vs 보호자 동의 메커니즘 신설
- [ ] 보호자 동의 도입 시: 보호자 이메일 / 휴대폰 인증 흐름 + BE endpoint

FE 권장: 만 14세 미만 = signup 차단 (현재 `age14` 필수 동의로 처리). 보호자 동의는 cost 대비 사용자 비율 낮으면 미도입.

---

## 회신 요청 — 체크리스트

BE / 법무 측이 다음 항목 회신 부탁:

### SignupDto 확장

- [ ] `consents: ConsentInputDto[]` 필드 추가 동의 + 위 표의 5 type 정합 확인
- [ ] 저장 정책 (별도 테이블 / 변경 이력 추적) 확인
- [ ] error code (`CONSENT_REQUIRED`, `CONSENT_VERSION_MISMATCH`) 도입 확인
- [ ] `/me/consents` PATCH endpoint 도입 여부 (선택 동의의 추후 변경)

### 정책 본문

- [ ] 옵션 A (FE 정적) vs B (BE endpoint) 결정
- [ ] 법무 검토 본문 (terms / privacy ko 또는 ko+en) 제공
- [ ] 정책 version 형식 결정 (semver / date)
- [ ] 정책 변경 시 재동의 trigger 정책

### 책임자 / 사업자 정보

- [ ] 개인정보보호책임자 이름 / 이메일 / 전화
- [ ] 사업자 정보 (상호 / 사업자번호 / 대표자 / 주소)
- [ ] 개인정보 보유 기간 (법령상 의무 항목 명시)
- [ ] 제3자 제공 / 처리 위탁 list (현재 + 추가)

### 만 14세

- [ ] 만 14세 미만 정책 (차단 유지 vs 보호자 동의 도입)

---

## 회신 후 FE 작업 흐름

1. SignupDto 갱신 → `npm run generate:api` 로 orval 재생성
2. `src/features/auth/schemas/signup.ts` 의 zod schema 에 `consents` 배열 + 정합 validation
3. `src/features/auth/components/SignupForm.tsx` 에 `ConsentBlock` 통합 (allRequired 가드)
4. `src/app/(main)/policy/{terms,privacy}/page.tsx` 본문 교체
5. mock handler 갱신
6. e2e 회원가입 시나리오 갱신 (동의 체크 단계 포함)
7. `docs/FEATURES.md` 의 가입 흐름 명세 갱신
8. 운영 배포 차단 해제 → tb deploy

---

## 참고 — FE 측 관련 코드

- ConsentBlock 컴포넌트: `src/features/onboarding/components/ConsentBlock.tsx` (구현 완료, 175 line)
- SignupForm: `src/features/auth/components/SignupForm.tsx` (ConsentBlock 미통합)
- signup zod: `src/features/auth/schemas/signup.ts`
- 약관 페이지: `src/app/(main)/policy/terms/page.tsx`
- 개인정보 페이지: `src/app/(main)/policy/privacy/page.tsx`
- AgeConfirmStep (보류 컴포넌트): `src/features/onboarding/components/AgeConfirmStep.tsx`
- i18n consent 키: `src/i18n/messages/ko.json` 의 `consent.*` 네임스페이스
