# BE Spring 마이그레이션 — 현황 문서

> BE가 **NestJS → Spring Boot(springdoc)** 로 교체됨에 따른 FE API 재연동. **완료 상태**.
> (2026-08 기준. 세부 진행 이력은 git log 참조 — 본 문서는 최종 아키텍처를 서술한다.)

## 배경

| 항목 | 구 (NestJS) | 신 (Spring Boot) |
| --- | --- | --- |
| OpenAPI JSON | `…/docs-json` | `https://trip-bite.o-r.kr/v3/api-docs` |
| Base URL | `…/v1` (prefix 有) | `https://trip-bite.o-r.kr` (**prefix 無**) |
| 응답 형태 | data 직접 | `ApiResponse<T> = { success, message, data }` 엔벨로프 |
| id 타입 | 일부 string | `number` |
| 인증 | 세션쿠키 | **JSESSIONID**(익명 요청에도 항상 발급) |
| 미인증 응답 | 401 `AUTH_REQUIRED` | **403** (빈 body) |
| 엔드포인트 | 다수 | 39 ops / 10 tags (letter·notification·settings 포함) |

## 최종 아키텍처

```
src/api/be/          orval 이 Spring swagger 로 자동 생성 (client + react-query + zod + msw).
                     Spring 이 지원하는 엔드포인트의 단일 소스. `npm run generate:api`.
src/types/api-domain.ts  FE 도메인 타입 단일 소스. Spring swagger 에 없는 도메인 타입
                     (UserDto·DestinationCategory·TravelTypeDto·ComposeLetterDto 등)을
                     required shape 로 정의. 컴포넌트/어댑터는 이 모듈만 import.
                     (구 @/api/generated 는 2026-08 완전 삭제.)
```

- **어댑터 규칙**: Spring 有 엔드포인트 → `be/` 호출 후 `.data` 언랩 → `api-domain` 도메인 shape 로 coerce(`?? 기본값`). Spring 無 엔드포인트 → `api.*`(axios) 직접 호출(경로 유지) → **MSW mock 이 처리**(dev/mock), 실 BE 는 404 → BE 추가 필요.
- **wire vs domain**: `be/` 타입은 optional/nullable(Spring 스타일), `api-domain` 타입은 required. 어댑터가 그 갭을 흡수(컴포넌트는 항상 안정적 shape).

## 인증 / 미들웨어

- 세션은 **JSESSIONID**(HttpOnly). Spring 이 익명 요청에도 항상 발급 → "쿠키 존재 = 로그인"이 성립 안 함.
- → **FE 마커 쿠키 `tripbite.authed`** (non-HttpOnly). `auth-store` 의 `setAuth`/`clearAuth` 가 set/clear. `middleware` 는 보호경로 게이팅에 **이 마커**를 본다(`NEXT_PUBLIC_AUTH_COOKIE`, 기본 tripbite.authed). 실제 게이트는 API 403.
- interceptor(`services/interceptors/auth.ts`): **403(빈 body) = 미인증**으로 처리(구 401 `AUTH_REQUIRED` 와 함께). clearAuth + 보호경로 /login redirect(마커 제거로 루프 없음).

## 로컬 개발 / 포트

- **dev·start·e2e 전부 포트 3000** (Spring CORS 가 `localhost:3000` 만 허용).
- `.env.local`: `NEXT_PUBLIC_API_URL=https://trip-bite.o-r.kr`, `NEXT_PUBLIC_USE_MSW=false`, `NEXT_PUBLIC_AUTH_COOKIE=tripbite.authed`.
- 편지 compose 계약(2026-08 BE 수정): `body`(정확히 5자) + `location.regionCode`(충북 시군, 필수) + `isAnonymous`(필수). (구 `anonymous` → `isAnonymous` 로 rename됨.)

## 테스트 / 검증

| 레이어 | 명령 | 모드 |
| --- | --- | --- |
| 유닛 (어댑터 매핑 등) | `npm run test:run` (vitest) | MSW mock |
| 순수 로직 | `npm run test:jest` | node |
| **실 BE contract** | `npm run be:contract` (`BE_CONTRACT=1`) | **실 Spring** (세션 주입, node 환경) |
| e2e | `npm run test:e2e` (playwright, 포트 3000) | **MSW mock** (결정적, dev 종료 후) |

- e2e 는 MSW 로 유지(결정적·백엔드 무관). 실 BE 검증은 `be:contract` 담당.

## Spring 미지원 엔드포인트 (MSW mock 으로만 동작)

FE 는 아래를 `api.*` 직접 호출로 유지 → MSW 가 처리. 실 BE 연동하려면 BE 가 추가해야 함.
상세 요청/응답 shape: **[`BE_REQUEST_spring_missing_endpoints.md`](../BE_REQUEST_spring_missing_endpoints.md)** (repo 루트, git 제외).

- auth: check-username/email, find-id, forgot/reset-password
- me: change-password, withdraw(DELETE /me), avatar upload/remove, complete-onboarding
- destinations: recommendations, {id}/related
- rankings: generic `/rankings?type=` (recommended/by-category/seasonal/by-travel-type)
- regions: {code}/summary, {code}/contents
- travel-types: me(GET), me(PATCH)
- location: reverse (**편지 작성 필수 — 우선순위 높음**)
- tournaments: {id} (결과 딥링크)

## 운영(Vercel) 배포 체크리스트

- env: `NEXT_PUBLIC_API_URL=https://trip-bite.o-r.kr`, `NEXT_PUBLIC_AUTH_COOKIE=tripbite.authed`, `NEXT_PUBLIC_USE_MSW`(운영 정책에 따라).
- **BE CORS 에 Vercel 도메인 추가** (현재 localhost:3000 만 허용).
- 운영 쿠키: cross-site 면 `Secure; SameSite=None` 필요 — BE 확인.
