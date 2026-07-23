# BE 요청 — `POST /auth/signup` · `POST /letters` 500 (서버측 버그)

> 작성일: 2026-07-23
> 심각도: **High** — 회원가입 불가(신규 유저 생성 차단) + 편지 작성 불가(핵심 기능)
> 확인 환경: 운영 `https://trip-bite.o-r.kr` (springdoc `/v3/api-docs`), 테스트 계정 `test / 1234`
> 관련 FE: `src/features/auth/api/auth.ts`(signup), `src/features/letter/api/letter.ts`(compose)

---

## 요약

FE ↔ BE API 매핑 실측 검증 중, 아래 **두 POST 엔드포인트가 스펙에 맞는 요청에도 결정적으로 `500 INTERNAL_SERVER_ERROR`** 를 반환함을 확인했습니다.

| 엔드포인트 | 결과 | 비고 |
| --- | --- | --- |
| `POST /auth/signup` | **500 (모든 payload)** | 신규 유저 생성 불가 |
| `POST /letters` (편지 작성) | **500 (모든 payload)** | 편지 작성 불가 |

같은 세션에서 다른 write 는 정상 → **전역 장애가 아니라 위 두 엔드포인트 특정 버그**로 판단됩니다.

```
{"code":"INTERNAL_SERVER_ERROR","message":"서버 오류가 발생했습니다","details":[]}
```

---

## 정상 동작 대조군 (같은 세션, 동일 시각)

BE 전역 문제가 아님을 보이는 대조:

| 엔드포인트 | 결과 |
| --- | --- |
| `POST /auth/login` | ✅ 200 `{data:{userId}}` |
| `POST /travel-types/submit` | ✅ 200 |
| `POST /mypage/tournaments` (저장) | ✅ 201 |
| `POST /mypage/tournament-history` (기록) | ✅ 201 |
| `GET /me`, `/letters/received`, `/letters/sent` 등 | ✅ 200 |

즉 인증/세션/DB 연결은 정상. **signup 과 letters(compose) 핸들러 내부에서만** 예외가 발생.

---

## 1. `POST /auth/signup` — 모든 payload 500

### 재현

```bash
curl -X POST https://trip-bite.o-r.kr/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"username":"newuser01","password":"Abcd1234!@","name":"홍길동","birthDate":"1999-03-03","email":"n@bite.com","nickname":"길동"}'
# → 500

# 최소(스펙상 필수 name·birthDate 만) 도 500
curl -X POST https://trip-bite.o-r.kr/auth/signup \
  -H 'Content-Type: application/json' -d '{"name":"김테","birthDate":"1999-03-03"}'
# → 500

# username/password 만 도 500
curl -X POST https://trip-bite.o-r.kr/auth/signup \
  -H 'Content-Type: application/json' -d '{"username":"uAbc1","password":"Abcd1234!@"}'
# → 500
```

- 유니크한 username/email 로 시도 → `409`(중복) 이 아니라 `500`.
- 스펙(`SignupRequestDto`: name·birthDate 필수, 나머지 선택)에 맞는 payload 도 500.
- **영향: 신규 회원가입 자체가 불가.**

### BE 확인 요청

- signup 서비스 내부 스택트레이스 확인 (NPE / 제약조건 / 누락 의존성 등)
- `name`·`birthDate` 신규 필드 추가 이후 매핑/저장 로직 회귀 여부
- 혹시 `SignupRequestDto` 에 스펙 미노출 필수 필드(예: consents)가 코드상 필요해 NPE 나는지 — 그렇다면 **OpenAPI 스펙에 반영** 필요 (FE 가 스펙 기준으로 요청 구성)

---

## 2. `POST /letters` (편지 작성) — 모든 payload 500

### 재현

```bash
curl -c c.txt -X POST https://trip-bite.o-r.kr/auth/login \
  -H 'Content-Type: application/json' -d '{"username":"test","password":"1234"}'

curl -b c.txt -X POST https://trip-bite.o-r.kr/letters \
  -H 'Content-Type: application/json' \
  -d '{"body":"오늘도맑음","location":{"regionCode":"cheongju","label":"청주시"},"anonymous":false}'
# → 500
```

### 핵심 단서 — Bean Validation(400)조차 안 걸림

스펙상 `ComposeLetterRequestDto.body` 는 `minLength=maxLength=5`(정확히 5자) 인데:

| body | 기대 | 실제 |
| --- | --- | --- |
| `"넉자"`(2자) | 400 (길이 위반) | **500** |
| `"여섯글자임"`(6자) | 400 (길이 위반) | **500** |
| `"오늘도맑음"`(5자, 유효) | 201 | **500** |

→ **길이 검증(400)조차 발생하지 않고 500** = 컨트롤러/서비스 **진입 직후** 예외로 추정 (요청 바인딩 또는 서비스 첫 단계). `location` 유무·`anonymous` 값과도 무관.

### BE 확인 요청

- letters compose 핸들러 스택트레이스 확인
- `@Valid` 가 `ComposeLetterRequestDto` 에 적용되는지 (적용됐다면 2자/6자에서 400 나야 정상)
- "본인 제외 1명 매칭" 로직이 수신 후보 없을 때 NPE 나는지 — 단, 위처럼 검증 이전 단계에서 이미 500이라 매칭 이전 문제로 보임
- signup 이 막혀 **2번째 유저를 만들 수 없어** 매칭 시나리오(수신자 존재 시) 검증이 불가 → signup 수정이 letters 검증의 선행 조건

---

## FE 측 상태 (참고)

- FE 는 두 엔드포인트를 **스펙대로 정확히 매핑**해 두었고(요청 shape 일치, 유닛 테스트 통과), 다른 write 는 실 BE 200/201 로 정상 동작 확인 → **FE 수정 불필요**.
- signup: `authApi.signup` → `POST /auth/signup` (`SignupRequestDto`)
- compose: `letterApi.send` → `POST /letters` (`ComposeLetterRequestDto`, Idempotency-Key 헤더 포함)
- BE 수정 완료 시 FE 변경 없이 재검증 가능 (mock 모드에서는 두 흐름 모두 정상 동작).

---

## 회신 요청 체크리스트

- [ ] `POST /auth/signup` 500 원인 (스택트레이스) + 수정
- [ ] `POST /letters` 500 원인 (스택트레이스) + 수정
- [ ] compose `@Valid`(400 검증) 미동작 여부 확인
- [ ] signup 이 스펙 외 필수 필드를 요구하면 OpenAPI 스펙 갱신
- [ ] 수정 후 회신 → FE 재검증 (편지 작성 → detail/like/save/delete 실 BE 실측)
