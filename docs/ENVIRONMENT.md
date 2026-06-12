# 환경 변수 (Environment) 가이드

FE 가 사용하는 모든 env 변수의 단일 reference. 신규 개발자 셋업 / Vercel 운영 등록 / GitHub Actions 시 한 곳에서 확인.

> SoT: `.env.example` (repo 루트) + 본 문서. 변경 시 같이 갱신.

---

## 1. 분류 — Public vs Server-only

| 접두사          | 노출                                                                    | 사용처                                                              |
| --------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_*` | **클라이언트 번들에 inline** — 빌드 시점에 hardcode. 빌드 후 변경 불가. | Server Components / Client Components / 브라우저 코드 모두          |
| (접두사 없음)   | 서버 전용 (절대 클라 노출 X)                                            | Server Components / Route Handlers / Server Actions / Node 스크립트 |

⚠ `NEXT_PUBLIC_*` 는 사용자에게 노출되어도 안전한 값만 (API URL / public key / 토글 등). secret / API token / private key 는 절대 금지.

---

## 2. Client env (`NEXT_PUBLIC_*`) 일람

| 변수                           | 필수         | 기본                                | 용도                                           | 사용처                                        |
| ------------------------------ | ------------ | ----------------------------------- | ---------------------------------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_API_URL`          | ✅ 필수      | `http://localhost:3000/v1`          | rewrite target (말미 `/v1` 필수)               | `next.config.js` rewrites                     |
| `NEXT_PUBLIC_USE_MSW`          | (dev)        | `false`                             | MSW worker 활성. `true` 시 robots noindex 자동 | `mocks/browser.ts` / next.config / middleware |
| `NEXT_PUBLIC_SW_DEV`           | (dev)        | `false`                             | dev 모드에서 Service Worker 강제 활성          | `next.config.js`                              |
| `NEXT_PUBLIC_BLOCK_INDEXING`   | 선택         | `false`                             | staging/preview 에서 X-Robots-Tag 강제         | `next.config.js`                              |
| `NEXT_PUBLIC_CSP_ENFORCE`      | 선택         | `false`                             | CSP enforce (default Report-Only)              | middleware                                    |
| `NEXT_PUBLIC_SESSION_COOKIE`   | 선택         | `SID`                               | BE 발급 sessionID 쿠키 이름 override           | `middleware.ts`                               |
| `NEXT_PUBLIC_SITE_URL`         | 운영 필수    | `https://trip-bite-mxue.vercel.app` | sitemap / OG url / canonical                   | `app/sitemap.ts` / OG meta                    |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | push 사용 시 | (없음)                              | Web Push 구독 시 `applicationServerKey`        | `features/notification/utils/subscription.ts` |
| `NEXT_PUBLIC_APP_VERSION`      | 선택         | (없음)                              | 앱 버전 표시 (디버그)                          | footer / about                                |
| `NEXT_PUBLIC_PRETENDARD_SRI`   | 운영 권장    | `sha384-GIdEBaq...`                 | Pretendard CDN SRI integrity (jsdelivr v1.3.9) | font preload                                  |

### 환경별 필수 매트릭스

| 변수                           | Local Dev                  | Preview (Vercel)     | Production                                          |
| ------------------------------ | -------------------------- | -------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`          | `http://localhost:3000/v1` | `<preview BE>/v1`    | `https://tripbite.duckdns.org/v1` (말미 `/v1` 필수) |
| `NEXT_PUBLIC_USE_MSW`          | `true` (BE 없을 때)        | `false`              | `false`                                             |
| `NEXT_PUBLIC_BLOCK_INDEXING`   | 무관                       | `true`               | `false`                                             |
| `NEXT_PUBLIC_SITE_URL`         | 무관                       | `https://preview...` | 운영 도메인                                         |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | dev key                    | preview key          | 운영 key                                            |
| `NEXT_PUBLIC_SW_DEV`           | `true` (PWA 테스트 시)     | 무관                 | `false`                                             |

---

## 3. Server-only env 일람

| 변수          | 필수      | 기본                              | 용도                                                     | 사용처                                          |
| ------------- | --------- | --------------------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| `OPENAPI_URL` | 빌드 필수 | `http://localhost:3000/docs-json` | orval 의 BE Swagger fetch 대상                           | `orval.config.ts` (predev / prebuild 자동 호출) |
| `NODE_ENV`    | (자동)    | `development` / `production`      | Next.js / vitest 등 분기                                 | 모든 곳                                         |
| `ANALYZE`     | 선택      | (없음)                            | `ANALYZE=true npm run build` — bundle analyzer html 생성 | `next.config.js`                                |
| `CI`          | (자동)    | (없음)                            | GitHub Actions 에서 자동 `true`                          | playwright config / dead-css 스크립트           |

> ⚠ `VAPID_PRIVATE_KEY` 는 **BE 책임** (web-push 발송용) — FE 에는 절대 안 들어옴.

---

## 4. `.env.local` 템플릿 (로컬 dev)

```bash
# repo 루트에 .env.local 로 저장 (.gitignore 됨)
# .env.example 를 그대로 복사한 뒤 값만 채우면 됨

# ---- Client (NEXT_PUBLIC_*) ----
# 말미 `/v1` 필수 — next.config rewrites 가 path 만 부여
NEXT_PUBLIC_API_URL=http://localhost:3000/v1
NEXT_PUBLIC_USE_MSW=true              # BE 없으면 true, 실 BE 띄웠으면 false
NEXT_PUBLIC_SW_DEV=false              # PWA 테스트할 때만 true
NEXT_PUBLIC_BLOCK_INDEXING=false
NEXT_PUBLIC_CSP_ENFORCE=false
NEXT_PUBLIC_SESSION_COOKIE=SID
NEXT_PUBLIC_SITE_URL=http://localhost:3900
NEXT_PUBLIC_VAPID_PUBLIC_KEY=         # 푸시 테스트할 때만 채움

# ---- Server-only ----
OPENAPI_URL=http://localhost:3000/docs-json   # BE 안 띄웠으면 prebuild 가 fail — MSW 모드면 BE 없이도 dev 동작
```

> 첫 셋업 절차:
>
> 1. `cp .env.example .env.local`
> 2. 위 값으로 채움
> 3. BE 안 띄울 거면 `NEXT_PUBLIC_USE_MSW=true` + BE 켰으면 `false`
> 4. `npm install && npm run dev`

### MSW 모드 vs 실 BE 모드 차이

| 항목           | `USE_MSW=true`                                               | `USE_MSW=false`                         |
| -------------- | ------------------------------------------------------------ | --------------------------------------- |
| API 응답       | `src/mocks/handlers.ts`                                      | 실 BE (axios baseURL)                   |
| `predev` orval | OPENAPI_URL 닿으면 generate / 실패하면 cached generated 사용 | OPENAPI_URL 필수 (없으면 prebuild fail) |
| robots         | `noindex` 자동                                               | 정상 색인                               |
| sessionID      | mock 발급 (`mock-sid`)                                       | 실 BE SID 쿠키                          |
| 헤더 nonce     | 동일                                                         | 동일                                    |

---

## 5. Vercel env 등록 가이드

### 5.1 Dashboard 경로

1. Vercel Dashboard → 프로젝트 선택
2. Settings → Environment Variables
3. **Production / Preview / Development** 각각 별도 등록 가능

### 5.2 운영 (Production) 최소 등록 세트

```
OPENAPI_URL                     = https://tripbite.duckdns.org/docs-json
NEXT_PUBLIC_API_URL             = https://tripbite.duckdns.org/v1     # 말미 /v1 필수
NEXT_PUBLIC_USE_MSW             = false
NEXT_PUBLIC_BLOCK_INDEXING      = false
NEXT_PUBLIC_SITE_URL            = <FE 운영 도메인>
NEXT_PUBLIC_VAPID_PUBLIC_KEY    = <운영 VAPID public>
NEXT_PUBLIC_SESSION_COOKIE      = SID
```

### 5.3 Preview 추가 권장

```
NEXT_PUBLIC_BLOCK_INDEXING      = true              # preview 색인 차단
NEXT_PUBLIC_API_URL             = https://preview-api.../v1
NEXT_PUBLIC_SITE_URL            = https://<preview>.vercel.app
OPENAPI_URL                     = https://preview-api.../docs-json
```

### 5.4 등록 후 검증

- `vercel env ls` (Vercel CLI) — 등록 목록 확인
- 새 배포 트리거 → Vercel Logs 에서 `process.env.X` 값 확인 (서버 콘솔 / Edge)
- 클라 env 는 빌드 시점 inline — 빌드 후에 추가/변경하면 재배포 필요

---

## 6. GitHub Actions Secrets / Variables

`.github/workflows/deploy.yml` 가 사용 — [DEPLOY.md](./DEPLOY.md) 참조.

### Secrets (Settings → Secrets and variables → Actions → Secrets)

| 이름                     | 값                                           |
| ------------------------ | -------------------------------------------- |
| `VERCEL_DEPLOY_HOOK_URL` | Vercel Deploy Hook URL                       |
| `NEXT_PUBLIC_API_URL`    | 운영 API URL (deploy.yml 이 build 시 inline) |
| `OPENAPI_URL`            | 운영 BE swagger URL (orval prebuild)         |

### Variables (비민감 — Settings → Secrets and variables → Actions → Variables)

| 이름                   | 값                                                                |
| ---------------------- | ----------------------------------------------------------------- |
| `NEXT_PUBLIC_USE_MSW`  | `false`                                                           |
| `NEXT_PUBLIC_SITE_URL` | `https://trip-bite-mxue.vercel.app`                               |
| `PRODUCTION_URL`       | `https://trip-bite-mxue.vercel.app` (GitHub UI 의 배포 링크 표시) |

---

## 7. env 누락 시 어떤 에러가 어디서 나는가

| 누락 변수                                         | 어디서 fail                                     | 메시지 / 증상                                                                                                 |
| ------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `OPENAPI_URL` (orval target down)                 | `npm run dev` / `npm run build` 의 prebuild     | `Error: connect ECONNREFUSED` — BE 안 띄웠을 때. MSW 모드면 cached generated 가 있으면 진행, 첫 셋업이면 fail |
| `NEXT_PUBLIC_API_URL` 미설정                      | next.config rewrites                            | rewrite 비활성 → `/api/backend/*` 가 FE 자체 라우터로 가서 404                                                |
| `NEXT_PUBLIC_API_URL` 말미 `/v1` 누락             | 런타임 API 호출                                 | rewrite 결과가 `${target}/regions/...` 가 되어 BE `/v1/...` 와 어긋남 → 404 (`Cannot GET /regions/...`)       |
| `NEXT_PUBLIC_USE_MSW` 미설정                      | dev                                             | default `false` 처리 — MSW worker 안 띄움 → API 404                                                           |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` 미설정 + push 시도 | `Notification.requestPermission()` 후 subscribe | `applicationServerKey is invalid` (브라우저 측)                                                               |
| `NEXT_PUBLIC_SITE_URL` 미설정                     | sitemap.xml / OG meta                           | URL 이 hardcoded 기본값 (`localhost`) 으로 들어가 SEO 망가짐                                                  |
| `NEXT_PUBLIC_SESSION_COOKIE` 미설정               | middleware                                      | default `SID` 사용. BE 가 다른 이름이면 보호 경로 우회됨                                                      |
| `VAPID_PRIVATE_KEY` 미설정 (BE)                   | push 발송 시도                                  | `web-push: invalid VAPID keys` (BE 측)                                                                        |

---

## 8. 디버깅 — env 검증 / 출력

### dev 시점 확인

```ts
// 임시 디버그 — Server Component 안에서
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
```

> 서버 콘솔 (터미널) 에 출력됨. 클라이언트 console 에는 빌드 후 inline 된 string 만 보임.

### Vercel 빌드 로그에서

- Vercel Deployments → 해당 배포 → Functions / Build Logs
- `process.env.X` 가 빌드 시점에 inline 됐는지 확인 가능

### prebuild orval 실패 시

- `npm run generate:api` 단독 실행으로 분리 검증
- `curl $OPENAPI_URL` 로 BE Swagger 응답 확인 (200 / JSON)

---

## 9. 보안 원칙

1. **`NEXT_PUBLIC_*` 에 secret 절대 금지** — 클라이언트 번들에 inline 됨
2. **server-only env 는 Server Component / Route Handler 에서만 read**
3. **`.env.local` / `.env*.local` 은 절대 commit X** — `.gitignore` 가 차단 중
4. **Vercel secrets 는 Encrypted environment variables 사용** — UI 의 "Sensitive" 토글 ON
5. **VAPID private / DB password / OAuth secret 은 BE 책임** — FE 에서는 절대 다루지 않음
6. **dev 와 prod 의 secret 값 분리** — preview 가 운영 DB 에 접근 못 하도록
7. **rotate 정책** — 의심 시 즉시 키 재발급 + 기존 키 폐기

---

## 10. 자주 묻는 질문

**Q. `.env.local` 의 값을 변경했는데 반영 안 됨.**

- `npm run dev` 재시작 필요 (Next.js 가 env 를 부팅 시점에 한 번만 읽음).
- `NEXT_PUBLIC_*` 는 빌드 시점 inline 이라 `npm run build` 도 재실행 필요.

**Q. Vercel 환경변수 변경 후 즉시 반영되나?**

- 변경 자체는 즉시 저장. 실제 사이트 반영은 **재배포** (Redeploy) 필요.
- 우회: Deployments → 해당 배포 → ⋯ → Redeploy (Use existing build cache 끄기).

**Q. preview 마다 env 다르게 주고 싶음.**

- Vercel Settings → Environment Variables → 변수마다 **Preview** 환경 체크
- 또는 branch-specific env: Settings → Environment Variables → "Customize" → 특정 branch 매칭

**Q. orval 이 `OPENAPI_URL` 닿을 수 없을 때 빌드 fail 막고 싶음.**

- `scripts/generate-api-safe.mjs` 작성 → fetch 실패 시 cached generated 유지 + warn → `prebuild` 가 이걸 호출
- 또는 `vercel.json` 의 `installCommand` 에 `--legacy-peer-deps || true` 같은 fallback
- **운영 BE 가 항상 up** 인 게 정상 — fail 막는 게 능사 X

**Q. env 추가 시 어떤 파일 갱신해야 하나?**

1. `.env.example` (템플릿 + 주석)
2. `docs/ENVIRONMENT.md` (본 파일) — Section 2/3 표 + Section 5 운영 등록 + Section 7 누락 시
3. 사용 코드 (`process.env.NEW_VAR`)
4. 운영 등록: Vercel Dashboard + GitHub Secrets (필요 시)

---

## 11. 관련 문서

- `.env.example` — 첫 셋업 시 복사 원본 (위 템플릿의 원본)
- [DEPLOY.md](./DEPLOY.md) — GitHub Actions secrets / variables 등록
- [ARCHITECTURE.md](./ARCHITECTURE.md) — env 가 어디서 어떻게 쓰이는지 큰 그림
- [FEATURES.md §B-10](./FEATURES.md) — VAPID / push 환경변수
- [I18N_EDGE_CONFIG.md](./I18N_EDGE_CONFIG.md) — `EDGE_CONFIG` env (도입 후)
