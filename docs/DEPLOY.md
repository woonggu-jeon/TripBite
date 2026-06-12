# 배포 가이드 — main → production 승인 배포

`main` 브랜치 푸시 시 **GitHub Actions 의 Required Reviewer 승인**을 거쳐 Vercel production 으로 배포한다.

```
PR(→dev) → CI 통과 → dev 머지
           ↓
        dev → main PR → 머지(=main push)
           ↓
        deploy.yml 의 build job 실행 (lint/type/test/build/size)
           ↓
        deploy job 이 "production" environment 진입
           ↓
        ⏸  Required reviewer 의 Approve 대기 (수동)
           ↓
        Vercel Deploy Hook 호출 → 운영 반영
```

---

## 사전 준비 (1회만)

### 1. Vercel — 자동 배포 분기 제어

GitHub Actions 가 명시적으로 trigger 하므로 Vercel 의 git 자동 배포를 분기 제어해야 한다.
현재 정책: **dev push 는 빌드 skip, main 만 Deploy Hook 으로 운영 배포**.

**현행 (적용 완료) — `vercel.json` `git.deploymentEnabled`**

```json
// vercel.json (repo root)
{
  "git": {
    "deploymentEnabled": {
      "dev": false
    }
  }
}
```

- dev push → Vercel "Deployment skipped" (빌드 트리거 X, ~즉시 종료)
- main push → Vercel 자동 빌드 (또는 Deploy Hook 호출만 받도록 옵션 B 병행)

**대시보드 보완 (필수 — Production Branch)**

- Vercel Project → Settings → **Environments** → **Production** → **Branch Tracking**
- Branch 를 `main` 으로 입력 → Save
- ⚠ Vercel UI 변경됨 (2026-03~): 구버전의 "Settings → Git → Production Branch" 항목은 이제 Environments 메뉴 안에 있음.

**옵션 B — Ignored Build Step (Deploy Hook 만 받게 하려면 병행)**

- Vercel Project → Settings → Git → **Ignored Build Step** 에 다음 입력:
  ```bash
  echo "Skip auto build — deploy via GitHub Actions" && exit 0
  ```
- 모든 git push 에 대해 Vercel 자체 빌드 skip → Deploy Hook 호출만 받음

### 2. Vercel — Deploy Hook 생성

- Vercel Project → Settings → Git → **Deploy Hooks**
- Hook Name: `production`, Branch: `main` (또는 옵션 A 에서 정한 더미 브랜치)
- 생성된 URL 복사 (`https://api.vercel.com/v1/integrations/deploy/prj_xxx/yyy`)

### 3. GitHub Environment 생성 + Reviewer 지정

- Repo → Settings → **Environments** → **New environment** → 이름 `production`
- **Required reviewers** 체크 → 승인자(본인 또는 팀원) 1명 이상 추가
- (선택) **Deployment branches and tags** → `main` 만 허용

### 4. GitHub Secrets / Variables 등록

Repo → Settings → Secrets and variables → Actions

**Secrets (민감)**
| 이름 | 값 |
|---|---|
| `VERCEL_DEPLOY_HOOK_URL` | 2단계에서 복사한 Deploy Hook URL |
| `NEXT_PUBLIC_API_URL` | `https://tripbite.duckdns.org/v1` (운영 BE — DuckDNS + docker, **말미 `/v1` 필수** — next.config rewrites 가 path 만 부여) |

**Variables (비민감, 빌드 로그에 노출돼도 무방)**
| 이름 | 값 |
|---|---|
| `NEXT_PUBLIC_USE_MSW` | `false` (실 백엔드 시) / `true` (mock 운영) |
| `NEXT_PUBLIC_SITE_URL` | `https://trip-bite-mxue.vercel.app` |
| `PRODUCTION_URL` | `https://trip-bite-mxue.vercel.app` (GitHub UI 의 배포 링크 표시용) |

---

## 평상시 배포 흐름

1. dev 브랜치에서 작업/머지 → CI(`.github/workflows/ci.yml`) 통과 확인
2. `dev → main` PR 생성 (또는 fast-forward merge)
3. main 푸시 → **Deploy** workflow 자동 시작 (Actions 탭에서 확인)
4. `build` job 통과 → `deploy` job 이 **노란색 "Waiting"** 상태로 멈춤
5. Reviewer 가 Actions 페이지에서 **Review deployments → production → Approve and deploy**
6. Vercel Deploy Hook 호출 → 1~3분 후 운영 반영
7. Vercel 대시보드에서 production deployment 상태 확인

---

## 긴급 롤백

### 방법 1 — Vercel UI (가장 빠름)

- Vercel Project → Deployments → 이전 정상 배포의 `⋯` → **Promote to Production**

### 방법 2 — workflow_dispatch 로 이전 ref 재배포

- Actions → **Deploy** → **Run workflow**
- `ref` 입력: 이전 정상 commit sha 또는 태그 (예: `v1.2.0`)
- 동일 승인 절차 거쳐 배포

### 방법 3 — git revert

- `git revert <bad-sha>` → main 푸시 → 동일 승인 흐름

---

## 트러블슈팅

**Q. deploy job 이 자동으로 통과해버린다 (승인 단계 없음).**

- `production` environment 의 Required reviewers 설정이 비어있음 → 1단계 3번 다시 확인.

**Q. `VERCEL_DEPLOY_HOOK_URL secret 이 비어있음` 에러.**

- Repo Settings → Secrets 에 등록했는지, Environment scope 가 아니라 Repository scope 인지 확인.

**Q. Vercel 에 두 번 배포된다.**

- 사전 준비 1단계 (자동 배포 비활성) 미적용 → 옵션 A 또는 B 적용.

**Q. main 푸시했는데 workflow 가 안 돈다.**

- `.github/workflows/deploy.yml` 가 main 브랜치에 포함돼 있는지 확인. 새 workflow 는 해당 브랜치에 머지된 이후부터 동작.

**Q. PR 단계에서 production secrets 가 안 보인다.**

- 정상 동작 — environment secrets 는 해당 environment 에 진입한 job 에서만 노출. PR CI 는 environment 미사용.

---

## 관련 파일

- `.github/workflows/ci.yml` — PR + dev/main push 시 lint/type/test/build/size (배포 X)
- `.github/workflows/deploy.yml` — main push 시 승인 후 Vercel 배포
- `vercel.json` — `git.deploymentEnabled.dev=false` (dev push 빌드 skip)
- `.size-limit.json` — 번들 크기 회귀 가드 (2026-06-07 갱신):
  - Shared First Load (framework + main + polyfills, gzip) ≤ **150 KB** (현재 136.71 KB)
  - 전체 chunks 합계 (lazy 포함, 정보용) ≤ **2 MB** (현재 470.19 KB)
  - 이전 `main-app-*` 패턴은 Next 15 통합으로 `main-*` 로 정정.
