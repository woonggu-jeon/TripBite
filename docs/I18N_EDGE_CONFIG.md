# i18n 운영 — Vercel Edge Config 마이그레이션 가이드

> 작성: 2026-06-07
> 상태: **계획** (현재는 bundle 내 JSON 사용 중, 운영 안정화 후 도입 예정)
> 관련: [BACKLOG](./BACKLOG.md) · [DEPLOY](./DEPLOY.md) · `src/i18n/request.ts`

---

## 1. 왜 옮기는가

### 현재 상태 (bundle 내 JSON)

```
src/i18n/messages/ko.json   30.7 KB
src/i18n/messages/en.json   26.6 KB
                            ─────────
                            57.3 KB
```

- `next-intl` v4 의 `getRequestConfig` 가 `dynamic import` 로 현재 locale 파일만 번들 포함.
- 텍스트 변경 = 코드 push → Vercel 빌드 (~1분) → 배포 → 즉시 반영.

### 한계

| 한계                                        | 영향                                                |
| ------------------------------------------- | --------------------------------------------------- |
| 1. 텍스트 한 줄 수정에도 풀빌드             | 운영 안정화 후 텍스트 변경 빈도 ↑ 시 deploy 큐 점유 |
| 2. 비개발자 (기획/마케팅) 가 직접 수정 불가 | PR + review 필요 — 의사결정 + 머지 lag              |
| 3. A/B 테스트 / 상황별 분기 어려움          | CTA 문구 실험 시 코드 분기 필요                     |
| 4. 긴급 오타 수정도 빌드 1분 대기           | 사용자 노출 중 즉시 fix 불가                        |

### 도입 신호 (3 중 1 충족 시)

- 텍스트 수정 PR 주당 ≥ 3건
- 비개발자가 텍스트 수정 요청 반복
- 마케팅 카피 A/B 테스트 필요

위 조건 충족 전까지는 **현재 bundle 유지** ([[rendering-speed-first]] 부합).

---

## 2. Vercel Edge Config 핵심 특성

| 항목            | 값                                                                                  |
| --------------- | ----------------------------------------------------------------------------------- |
| **읽기 속도**   | edge runtime 에서 < 15ms (P99)                                                      |
| **데이터 형식** | JSON (key-value 또는 nested object)                                                 |
| **크기 한도**   | 1 Edge Config = **8KB ~ 8MB** (plan 별, Hobby = 8KB, Pro = 512KB, Enterprise = 8MB) |
| **개수 한도**   | Hobby 1개 / Pro 100개 / Enterprise 무제한                                           |
| **읽기 비용**   | Hobby 50k/월 무료 / Pro/Ent 사용량 청구                                             |
| **쓰기 방법**   | Dashboard UI / REST API / `vercel` CLI                                              |
| **무효화**      | 쓰기 즉시 edge 캐시 갱신 (10초 내 전세계 반영)                                      |

> ⚠ **크기 주의**: Hobby plan 은 **8KB** 만 — 우리 ko.json 30.7KB 한 개도 안 들어감.
> Pro plan ($20/월) 512KB 면 ko + en 합쳐 57KB → 여유 충분.
> **Pro 가입 시점 = 도입 시점**.

### 무료 plan 으로 시작하는 우회

- 자주 바뀌는 키만 (CTA / 배너 / 마케팅 카피 ~10개) Edge Config 에 보관
- 나머지 일반 텍스트는 bundle JSON 유지
- 점진 마이그 (cost 분리)

---

## 3. 목표 아키텍처

```
[ 텍스트 변경 ]
       │
       ▼
┌─────────────────────────────────┐
│ GitHub messages/ko.json edit    │  ← 개발자
│ 또는 Vercel Dashboard UI         │  ← 비개발자
│ 또는 Admin UI (자체)             │  ← 운영팀
└─────────────────────────────────┘
       │
       ▼ (1) GitHub Actions or manual
┌─────────────────────────────────┐
│ Vercel Edge Config PATCH        │
│ keys: messages-ko / messages-en │
└─────────────────────────────────┘
       │
       ▼ (2) <15ms global edge
┌─────────────────────────────────┐
│ next-intl getRequestConfig      │
│ → @vercel/edge-config.get()     │
│ → SSR 렌더 (깜빡임 0)            │
└─────────────────────────────────┘
       │
       ▼
[ 사용자 브라우저 ]
```

**핵심 보장**:

- SSR 시점에 fetch — 클라이언트 hydration 시 깜빡임 없음
- Edge Config 장애 / 미정의 키 → bundle JSON fallback (안전망)
- 변경 = 즉시 반영 (deploy 없음)

---

## 4. 셋업 절차

### 4.1 Vercel Dashboard

1. `https://vercel.com/<team>/~/stores` → **Create Database** → **Edge Config** 선택
2. 이름 `tripbite-i18n` 입력 → Create
3. 생성된 Edge Config 클릭 → **Projects** 탭 → `tripbite` 프로젝트 연결
   - 연결 시 자동으로 `EDGE_CONFIG` env (Production/Preview/Development) 가 프로젝트에 주입됨
4. **Tokens** 탭 → **Create Token** → write 권한 → 토큰 복사 → 다음 단계에 사용

### 4.2 패키지 설치

```bash
npm install @vercel/edge-config
```

### 4.3 초기 데이터 등록 (1회)

#### 방법 A — Dashboard 수동

1. Edge Config → **Items** 탭 → **Edit Items** → JSON 모드
2. ko/en 각 키로 등록:
   ```json
   {
     "messages-ko": {
       /* ko.json 전체 */
     },
     "messages-en": {
       /* en.json 전체 */
     }
   }
   ```
3. Save

#### 방법 B — CLI 스크립트 (권장 — 재실행 가능)

`scripts/edge-config-sync.mjs` 신설:

```js
// scripts/edge-config-sync.mjs
import fs from 'node:fs/promises';

const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const TEAM_ID = process.env.VERCEL_TEAM_ID; // 팀 계정이면 필수

if (!EDGE_CONFIG_ID || !VERCEL_API_TOKEN) {
  console.error('EDGE_CONFIG_ID / VERCEL_API_TOKEN env 필수');
  process.exit(1);
}

const ko = JSON.parse(await fs.readFile('src/i18n/messages/ko.json', 'utf8'));
const en = JSON.parse(await fs.readFile('src/i18n/messages/en.json', 'utf8'));

const url =
  `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items` +
  (TEAM_ID ? `?teamId=${TEAM_ID}` : '');

const res = await fetch(url, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${VERCEL_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    items: [
      { operation: 'upsert', key: 'messages-ko', value: ko },
      { operation: 'upsert', key: 'messages-en', value: en },
    ],
  }),
});

if (!res.ok) {
  console.error('Edge Config sync 실패:', res.status, await res.text());
  process.exit(1);
}
console.log('Edge Config sync 성공');
```

실행:

```bash
EDGE_CONFIG_ID=ecfg_xxx \
VERCEL_API_TOKEN=xxx \
VERCEL_TEAM_ID=team_xxx \
node scripts/edge-config-sync.mjs
```

`package.json` 에 script 등록:

```json
{
  "scripts": {
    "i18n:sync": "node scripts/edge-config-sync.mjs"
  }
}
```

### 4.4 next-intl 통합

`src/i18n/request.ts` 변경:

```ts
import { getRequestConfig } from 'next-intl/server';
import { get } from '@vercel/edge-config';
import { readLocaleFromCookie } from './locale';

/**
 * next-intl 핵심 설정 — Edge Config 우선 + bundle fallback.
 *
 * 1순위: Vercel Edge Config (`messages-ko` / `messages-en`)
 *   - SSR 시점 edge runtime < 15ms read — 깜빡임 0
 *   - 텍스트 변경 즉시 반영 (deploy 불필요)
 * 2순위: bundle JSON (src/i18n/messages/{locale}.json)
 *   - Edge Config 장애 / 미정의 키 / 로컬 dev 안전망
 *   - SSG 빌드 시점에도 동작 보장
 */
export default getRequestConfig(async () => {
  const locale = await readLocaleFromCookie();

  // 1. Edge Config 시도 (production/preview 환경 + EDGE_CONFIG env 존재 시).
  let messages: Record<string, unknown> | undefined;
  if (process.env.EDGE_CONFIG) {
    try {
      messages = await get<Record<string, unknown>>(`messages-${locale}`);
    } catch (err) {
      // edge config down / network error — bundle 폴백.
      console.warn(`[i18n] Edge Config read failed (${locale}):`, err);
    }
  }

  // 2. Bundle 폴백 — Edge Config 미설정 / 실패 / null 응답.
  if (!messages) {
    messages = (await import(`./messages/${locale}.json`)).default;
  }

  return {
    locale,
    messages,
    formats: {
      dateTime: {
        short: { day: 'numeric', month: 'short', year: 'numeric' },
        time: { hour: '2-digit', minute: '2-digit' },
      },
      number: {
        percent: { style: 'percent', maximumFractionDigits: 0 },
      },
    },
    timeZone: 'Asia/Seoul',
  };
});
```

### 4.5 운영 검증 체크리스트

- [ ] `vercel env ls` 로 `EDGE_CONFIG` env 가 Production/Preview/Development 모두 존재
- [ ] 로컬 dev — `EDGE_CONFIG` 미설정 시 bundle 폴백 정상 (콘솔 warn 없음)
- [ ] Preview 배포 — Edge Config 읽음 (Vercel logs 확인)
- [ ] Edge Config 의 `messages-ko` 한 키 변경 → 10초 내 운영 사이트 반영
- [ ] `messages-ko` 키 삭제 → bundle fallback 으로 정상 노출

---

## 5. 업데이트 워크플로

### 5.1 개발자 (코드 push)

GitHub Actions 가 main 머지 시 자동 sync:

```yaml
# .github/workflows/i18n-sync.yml
name: i18n Edge Config sync
on:
  push:
    branches: [main]
    paths:
      - 'src/i18n/messages/**'
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: node scripts/edge-config-sync.mjs
        env:
          EDGE_CONFIG_ID: ${{ secrets.EDGE_CONFIG_ID }}
          VERCEL_API_TOKEN: ${{ secrets.VERCEL_API_TOKEN }}
          VERCEL_TEAM_ID: ${{ secrets.VERCEL_TEAM_ID }}
```

→ git 의 `src/i18n/messages/*.json` 이 **SoT (source of truth)** 유지.
→ Edge Config 는 캐시 / 운영 store. drift 0.

### 5.2 비개발자 (Dashboard 직접)

Vercel Dashboard → Edge Config → Items → JSON 편집.

⚠ **주의**: Dashboard 직접 편집은 git SoT 와 drift 발생.
권장: 변경 후 `npm run i18n:export` (역방향 — Edge Config → git) 스크립트로 동기화.

### 5.3 어드민 UI (선택 — 자체 구축 시)

- 사이드 프로젝트 admin route (`/admin/i18n`) — 인증 필요
- `@vercel/edge-config` PATCH API 직접 호출
- 변경 이력 / rollback 기능

→ 별도 phase. 처음엔 Dashboard 직접 편집으로 충분.

---

## 6. 캐싱 / 무효화

### 6.1 자동 무효화

- Edge Config 쓰기 → ~10초 내 전 세계 edge 반영
- Next.js fetch cache 무관 (next-intl 이 Edge Config SDK 직접 사용)

### 6.2 강제 새로고침 (드물게 필요)

- Vercel Dashboard → Deployments → **Redeploy** (Skip Build Cache) → SSR cache 무효
- 또는 `revalidatePath('/', 'layout')` 호출하는 admin endpoint

### 6.3 클라이언트 캐시

- next-intl 의 `NextIntlClientProvider` 가 SSR messages 를 hydration payload 로 전달
- 페이지 전환 시 새 fetch X — 클라이언트 캐시 자동
- locale 변경 (ko ↔ en) 시 cookie 갱신 + `router.refresh()` → SSR 새로 호출

---

## 7. 마이그레이션 단계

### Phase 0 — 현재 (skip 가능)

- bundle JSON 유지

### Phase 1 — 셋업 (1일)

- Vercel Pro 가입 (필수, 8KB → 512KB)
- Edge Config 생성 + 프로젝트 연결
- `@vercel/edge-config` 설치
- `scripts/edge-config-sync.mjs` 작성

### Phase 2 — 초기 데이터 (수동)

- `npm run i18n:sync` 1회 실행 → Edge Config 에 전체 JSON 등록
- Vercel Preview 배포 후 SSR 로그 확인 — Edge Config 읽음

### Phase 3 — request.ts 변경 + 배포

- `src/i18n/request.ts` 에 Edge Config 우선 로직 추가
- Preview 배포 → 정상 확인 → main 머지 → 운영 반영

### Phase 4 — 자동화

- GitHub Actions `.github/workflows/i18n-sync.yml` 추가
- 이후 `src/i18n/messages/*.json` 머지마다 자동 sync

### Phase 5 — 부분 마이그 (선택)

- 자주 변경되는 키 (`home.cta.*`, `banner.*`) 만 Edge Config 분리
- 그 외는 bundle 유지 — 비용 최적화

---

## 8. fallback 시나리오

| 상황                                                    | 동작                                                                                                |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Edge Config env 미설정 (로컬 dev)                       | bundle JSON 사용                                                                                    |
| Edge Config 응답 없음 (network down)                    | bundle JSON 사용 + `console.warn`                                                                   |
| Edge Config key 미정의 (`messages-fr` 같은 신규 locale) | bundle JSON 사용 (있으면)                                                                           |
| bundle JSON 도 없음                                     | next-intl 이 404 → ErrorBoundary 가 잡음                                                            |
| Edge Config 응답이 빈 객체 `{}`                         | next-intl 이 키 누락 시 raw key 노출 (e.g. `home.title`) — sync 스크립트가 빈 응답 보장 X 검증 필요 |

**검증 코드 보강 권장** (스크립트):

```js
const ko = JSON.parse(...);
if (Object.keys(ko).length === 0) throw new Error('ko.json 비어있음');
```

---

## 9. 비용 추정

| 항목                  | Hobby    | Pro ($20/월) | Enterprise  |
| --------------------- | -------- | ------------ | ----------- |
| Edge Config 크기 한도 | 8 KB     | 512 KB       | 8 MB        |
| Edge Config 개수      | 1        | 100          | 무제한      |
| 읽기 (월)             | 50k 무료 | 무료 (포함)  | 무료 (포함) |
| 쓰기 비용             | $0       | $0           | $0          |

**TripBite 추정** (월 1만 사용자 가정):

- 페이지뷰 ~ 20만 → SSR read ~ 20만/월 → Pro plan 무료 한도 내
- 쓰기 ~ 5건/주 → 비용 0
- → **Pro plan $20/월 만 추가**

비교 — bundle 유지 시:

- 비용 $0 / Vercel build minute 만 사용 (월 50건 변경 × 1분 ≈ 무시 가능)

→ **Edge Config 도입 = $20/월 의 운영 유연성 구매**.

---

## 10. 트러블슈팅

### `EDGE_CONFIG is not defined` (로컬 dev)

- 정상. `request.ts` 의 `if (process.env.EDGE_CONFIG)` 가드가 bundle 폴백으로 우회.
- 로컬에서 Edge Config 테스트 원하면 `.env.local` 에 `EDGE_CONFIG=https://edge-config.vercel.com/ecfg_xxx?token=yyy` 추가.

### Pro plan 인데 512KB 초과

- ko + en + 추가 locale 누적이면 한도 초과 가능.
- 해결: locale 별 Edge Config 분리 (`tripbite-i18n-ko`, `tripbite-i18n-en`) — Pro 는 100개까지.

### Dashboard 편집 후 SSR 반영 안 됨

- Vercel Edge Cache TTL 10초 — 새로고침 2~3회 시도.
- 그래도 반영 안 되면: Deployments → Redeploy (Skip Build Cache).
- Vercel logs (`https://vercel.com/<team>/<project>/_logs`) 에서 `[i18n] Edge Config read failed` 메시지 확인.

### locale 별 키 누락 (예: ko 에 있는데 en 에 없음)

- next-intl 이 missing key 시 raw key 노출 (`home.title` 등) + dev 모드에서 throw.
- sync 스크립트에서 ko/en 키 동일성 검증 추가 권장:
  ```js
  function flatKeys(obj, prefix = '') { /* ... */ }
  const koKeys = flatKeys(ko).sort();
  const enKeys = flatKeys(en).sort();
  if (JSON.stringify(koKeys) !== JSON.stringify(enKeys)) {
    console.error('ko/en 키 불일치:', { koOnly: ..., enOnly: ... });
    process.exit(1);
  }
  ```

### Edge Config token 유출

- write token 은 Vercel API 전권. GitHub secrets 만 사용. 절대 코드 commit X.
- 노출 의심 시 즉시 Vercel Dashboard → Edge Config → Tokens → Revoke.

---

## 11. 운영 체크리스트 (도입 후)

매 분기 1회 점검:

- [ ] Edge Config 크기 (`https://api.vercel.com/v1/edge-config/<id>` 응답) ≤ plan 한도 80%
- [ ] 월 read 건수 ≤ 무료/포함 한도
- [ ] `src/i18n/messages/*.json` 과 Edge Config 의 drift 0 (export 스크립트 + git diff)
- [ ] missing key 모니터링 — Sentry / Vercel logs 에서 `MISSING_MESSAGE` warning
- [ ] write token 만료 / rotate 정책 (90일)

---

## 12. 참고

- 공식: <https://vercel.com/docs/edge-config>
- @vercel/edge-config: <https://www.npmjs.com/package/@vercel/edge-config>
- next-intl: <https://next-intl-docs.vercel.app/docs/getting-started/app-router>
- 가격: <https://vercel.com/pricing>
- 관련 메모리: [[rendering-speed-first]] (깜빡임 회피 — SSR fetch 필수)

---

## 13. 결정 기록

| 날짜       | 결정                                         | 비고                              |
| ---------- | -------------------------------------------- | --------------------------------- |
| 2026-06-07 | Edge Config 채택, 도입 시점은 운영 안정화 후 | bundle 유지 단계의 비용/이득 분석 |
| (TBD)      | Pro 가입 + Phase 1~3 진행                    | 도입 신호 3 중 1 충족 시          |
