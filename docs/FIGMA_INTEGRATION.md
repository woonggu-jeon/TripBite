# Figma → 코드 워크플로우 가이드

Figma MCP 를 통해 디자인을 Claude Code 가 직접 코드로 반영하는 환경 셋업.

> SoT: 디자이너 측 Tokens Studio variable 명과 본 문서의 매핑 표.
> 마지막 갱신: 2026-06-14

---

## 0. 처음 시작하는 분을 위한 step-by-step (총 15분)

Figma 처음이면 이 섹션만 따라하면 됩니다. 아래 6 step 끝나면 Claude 에게 "Figma URL 줄게, 이대로 만들어줘" 가능.

### Step 0-1. Figma 계정 만들기 (3분)

1. https://figma.com → 우상단 **"Sign up"** 클릭
2. Email + 비밀번호 또는 Google 로그인
3. 가입 직후 "What's your role?" 같은 onboarding 질문 — 아무거나 선택 (skip 가능)
4. **Plan 선택**: **Starter (Free)** 선택. 신용카드 입력 X.
5. workspace 이름 — 본인 또는 회사명 (나중에 변경 가능)

**완료 신호**: figma.com 진입 시 빈 dashboard 가 보임.

---

### Step 0-2. 디자이너에게 받은 link 열어보기 (2분)

디자이너가 보낸 URL 형식 — 둘 중 하나:

```
https://www.figma.com/design/{fileKey}/{title}            ← 새 형식
https://www.figma.com/file/{fileKey}/{title}              ← 옛 형식
```

특정 frame/component 를 가리키면 끝에 `?node-id=...` 가 붙음:

```
https://www.figma.com/design/abc123/TripBite?node-id=1-234
```

URL 클릭 → 자동으로 Figma 웹에 열림. **로그인 상태에서 디자이너가 View-only 권한 주면 그대로 보임**. 권한 없으면 "Request access" 화면 — 디자이너에게 요청.

⚠ View-only 라 편집은 불가 (정상). 우리는 읽기만 필요.

---

### Step 0-3. Personal Access Token 발급 (3분)

Claude 가 Figma API 로 디자인 정보 fetch 하려면 token 이 필요.

1. Figma 우상단 본인 **프로필 아이콘** 클릭 → **Settings**
2. 좌측 **Account** 탭
3. 스크롤 내려 **"Personal access tokens"** 섹션
4. **"Generate new token"** 버튼 클릭
5. 입력 화면:
   - **Name**: `claude-code-mcp` (식별용, 자유)
   - **Expiration**: 90일 / no expiration 등 선택 (운영용이면 no expiration)
   - **Scopes** (권한): 다음만 체크
     - ✅ `File content` → **Read-only**
     - 나머지는 체크 X (보안)
6. **"Generate token"** 클릭
7. **`figd_xxxxxxx...` 형식의 token 이 한 번만 표시** — 즉시 복사해서 메모장 등에 임시 저장. 창 닫으면 다시 못 봄 (재발급은 가능).

⚠ Token 은 비밀번호 같은 것. GitHub / Slack / 공개 메모에 절대 X.

---

### Step 0-4. mcp.json 파일 만들기 (2분)

Claude Code 가 시작할 때 읽는 설정 파일에 figma server 등록.

**위치 두 가지 — 본인 상황에 맞춰 선택**:

| 위치                                                                         | 적용 범위          | 추천 케이스                           |
| ---------------------------------------------------------------------------- | ------------------ | ------------------------------------- |
| User-level — `~/.claude/mcp.json` (Windows `%USERPROFILE%\.claude\mcp.json`) | 모든 프로젝트 공통 | 다른 프로젝트에서도 figma 쓸 예정     |
| Project-level — `.claude/mcp.json` (repo 안)                                 | 본 프로젝트만      | 이 프로젝트만 figma 사용 — token 격리 |

Project-level 이 user-level 을 override. 본 프로젝트는 `.gitignore` 에 `.claude/` 등록되어 있어 project-level 도 token commit 위험 0.

**파일 위치 — User-level** (Windows):

```
C:\Users\{본인계정}\.claude\mcp.json
```

**파일 위치 — User-level** (Mac/Linux):

```
~/.claude/mcp.json
```

**파일 위치 — Project-level** (어느 OS 든):

```
<repo>/.claude/mcp.json
```

**방법 A — 파일 탐색기**:

1. 탐색기 주소창에 `%USERPROFILE%\.claude` 입력 → 폴더 열림 (없으면 새로 만들기)
2. 폴더 안에서 **새로 만들기 → 텍스트 문서** → 이름 `mcp.json` (확장자 `.txt` 아니라 `.json` 확실히)
3. 메모장으로 열기

**방법 B — PowerShell 한 줄로 메모장 열기**:

```powershell
notepad $env:USERPROFILE\.claude\mcp.json
```

파일 없다고 묻는 창 나오면 "예" 눌러 새로 생성.

**방법 C — PowerShell 자동 생성 (한 번에)**:

token 만 본인 값으로 바꿔서 그대로 실행. 폴더 없으면 자동 생성. 이미 있으면 덮어씌우니 다른 server 등록되어 있으면 사용 X.

**User-level (`%USERPROFILE%\.claude\mcp.json`) — 모든 프로젝트 공통**:

```powershell
$token = "figd_여기에본인token"
$dir = "$env:USERPROFILE\.claude"
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
@"
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--stdio"],
      "env": {
        "FIGMA_API_KEY": "$token"
      }
    }
  }
}
"@ | Out-File -Encoding utf8 "$dir\mcp.json"
```

**Project-level (`<repo>/.claude/mcp.json`) — 본 프로젝트 한정**:

```powershell
# 현재 프로젝트 root 에서 실행
$token = "figd_여기에본인token"
if (-not (Test-Path ".claude")) { New-Item -ItemType Directory ".claude" -Force | Out-Null }
@"
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--stdio"],
      "env": {
        "FIGMA_API_KEY": "$token"
      }
    }
  }
}
"@ | Out-File -Encoding utf8 ".claude\mcp.json"
```

실행 후 메모장으로 열어 token 정상 들어갔는지 확인 권장.

**파일 내용** (그대로 복사 + token 만 본인 값으로):

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--stdio"],
      "env": {
        "FIGMA_API_KEY": "figd_여기에복사한token붙여넣기"
      }
    }
  }
}
```

저장 (`Ctrl+S`) 후 메모장 닫기.

⚠ 이미 mcp.json 에 다른 server (예: notion, slack) 가 등록되어 있으면 — `mcpServers` 안에 `figma` 만 추가하면 됨. 통째로 덮어쓰지 말기.

---

### Step 0-5. Claude Code 재시작 + 등록 확인 (2분)

1. 현재 열려 있는 Claude Code **완전히 종료** (창 닫기)
2. 다시 Claude Code 실행
3. 채팅창에서 `/mcp` 입력 + Enter
4. **`figma` 가 list 에 보이고 상태가 `connected` 또는 `✓`** 이면 성공
5. 실패 (`failed` 또는 안 보임) 시 → 아래 § 0-7 troubleshooting

---

### Step 0-6. 첫 검증 — Claude 에게 Figma URL 던지기 (3분)

가장 간단한 test:

1. 디자이너에게 받은 Figma URL 준비
2. Claude 채팅창에 다음 입력:
   ```
   이 Figma 디자인 한 번 fetch 해서 어떤 컴포넌트인지 알려줘:
   https://www.figma.com/design/abc.../...?node-id=1-234
   ```
3. Claude 가 `mcp__figma__*` tool 호출 → 디자인 정보 분석 후 응답.

**성공 신호**: Claude 가 디자인 요소 (색/크기/텍스트) 를 정확히 묘사. tool 권한 prompt 가 처음 한 번 뜨면 **허용** 클릭.

이게 되면 그 다음부턴 "이대로 만들어줘" 같은 요청 가능.

---

### Step 0-7. Troubleshooting

| 증상                                            | 원인                              | 해결                                                                                                          |
| ----------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `/mcp` 에 figma 안 보임                         | mcp.json 경로 잘못                | 경로 `%USERPROFILE%\.claude\mcp.json` 정확한지 / 파일명 `mcp.json.txt` 아닌지 확인                            |
| `/mcp` 에 figma 가 `failed`                     | token 잘못 / npx 첫 download 실패 | token 끝에 공백 들어가지 않았는지 / 인터넷 연결 / `npx -y figma-developer-mcp --help` 직접 실행해서 에러 확인 |
| Claude 가 figma tool 못 찾음                    | Claude Code 재시작 안 됨          | 작업 표시줄에서 완전 종료 후 다시 실행                                                                        |
| Figma URL 으로 fetch 했는데 "permission denied" | View 권한 없음                    | 디자이너에게 link share 다시 요청 ("Anyone with the link can view")                                           |
| token 분실                                      | 보안 정책상 재발급만 가능         | Step 0-3 다시 + 옛 token 은 Settings 에서 **Revoke**                                                          |

---

### 다음 할 일

여기까지 됐으면 사용자 측 셋업 끝. 이제 **디자이너 측 셋업** 이 필요:

1. 디자이너에게 본 문서의 **§3 (디자이너 측 셋업)** + **§4 (디자이너 측 약속)** 공유
2. 디자이너가 Tokens Studio 설치 + variable 매니페스트 입력 + View-only link 공유
3. 그 link 를 Claude 에게 던지면 자동 매핑

디자이너 측 작업 끝나기 전엔 Claude 가 fetch 해도 raw hex 만 받음 — 작동은 하지만 ROI 낮음 (Claude 가 매번 hex → token 매핑). 디자이너 약속이 핵심.

---

## 1. 큰 그림

```
[디자이너 — Figma Free]              [사용자 — Claude Code]
  Tokens Studio 로 variable           Figma MCP 로 URL/node fetch
  (코드 토큰과 동일 명)               ↓
  ↓                                   응답의 referencedVariable.name
  컴포넌트 (Storybook 명과 동일)      → CSS 변수로 그대로 사용
  ↓                                   → 기존 primitive 재사용
  View-only link share                → raw hex/px 0
```

핵심 원칙 — **양쪽 명을 같게 만들어 mapping cost 를 0 으로**.

---

## 2. 비용 모델

### 영구 무료로 운영 가능한 조합

| layer                            | plan          | 비고                                                                |
| -------------------------------- | ------------- | ------------------------------------------------------------------- |
| Figma (디자이너)                 | **Free**      | 본인 Drafts 무제한. 다른 사람은 View-only link 공유. Editor 추가 X. |
| Figma (사용자)                   | **Free**      | Personal Access Token 발급 (Read scope). plan 무관 동작.            |
| Tokens Studio for Figma 플러그인 | **Free tier** | variable 정의 + Figma sync 가능. GitHub sync 만 Pro.                |
| `figma-developer-mcp`            | **무료**      | community 오픈소스 (npx 실행).                                      |
| Claude Code MCP 등록             | **무료**      | Claude Code 자체 기능.                                              |

→ **이 조합으로 본 프로젝트 운영 영구 무료**.

### 유료 고려 시점 (필요 없으면 도입 X)

| 시점                                                                  | 추가 비용                                                       |
| --------------------------------------------------------------------- | --------------------------------------------------------------- |
| 디자이너가 Editor 를 1명+ 초대 (team workspace 전환)                  | Figma Professional $15/editor/mo. team file 4개+ 일 때부터 필요 |
| 한 Figma 파일 안에 Page 4개+ 분리 필요 (mobile/desktop/wireframe/...) | Figma Professional (Free 는 file 당 3 page)                     |
| 디자이너가 주 1회+ 토큰 변경 → 자동 GitHub sync 필요                  | Tokens Studio Pro 약 $5/mo                                      |

본 프로젝트의 현재 빈도 (월 ~수 회) 라면 셋 다 불필요. **수동 export + 사용자가 Claude 에게 JSON 던지기** 로 충분.

### Claude Code 사용량은 별개

MCP 호출 자체는 일반 tool call — 사용자의 평소 Claude 사용량 안에서 처리. 별도 청구 없음. 단 컴포넌트/화면 많을수록 토큰 소비 ↑ — 그래서 **토큰 매칭 잘 돼 있는 게 비용 절감의 핵심**.

---

## 3. 디자이너 측 셋업 (Tokens Studio for Figma)

### 3-1. 설치

Figma 플러그인 → "Tokens Studio for Figma" 설치. Free tier 그대로 사용.

### 3-2. variable 명 매핑

본 프로젝트의 CSS 변수와 **정확히 동일 명** 으로 Figma variable 생성. 아래 매니페스트 그대로 입력.

#### Color (`tokens/_color.scss` + `_dark.scss` + `_accents.scss`)

| Figma variable                    | CSS 변수              | light 값  | dark 값   |
| --------------------------------- | --------------------- | --------- | --------- |
| `color/bg`                        | `--color-bg`          | `#ffffff` | `#0a0a0a` |
| `color/fg`                        | `--color-fg`          | `#0a0a0a` | `#fafafa` |
| `color/muted`                     | `--color-muted`       | `#5b6470` | `#9ca3af` |
| `color/border`                    | `--color-border`      | `#e5e7eb` | `#1f2937` |
| `color/primary`                   | `--color-primary`     | `#0a0a0a` | `#fafafa` |
| `color/primary-fg`                | `--color-primary-fg`  | `#ffffff` | `#0a0a0a` |
| `color/danger`                    | `--color-danger`      | `#dc2626` | `#f87171` |
| `color/success`                   | `--color-success`     | `#16a34a` | `#4ade80` |
| `color/warning`                   | `--color-warning`     | `#d97706` | `#fbbf24` |
| `color/sage-mist`                 | `--color-sage-mist`   | `#d4e2d4` | `#2f4a32` |
| `color/sage`                      | `--color-sage`        | `#6b8e6b` | `#8fb38f` |
| `color/sage-strong`               | `--color-sage-strong` | `#3d5d3d` | `#a8c8a8` |
| `accent/red`                      | `--accent-red`        | `#c1272d` | `#f87171` |
| `accent/amber`                    | `--accent-amber`      | `#b15402` | `#fbbf24` |
| `accent/green`                    | `--accent-green`      | `#15803d` | `#4ade80` |
| `accent/blue`                     | `--accent-blue`       | `#2563eb` | `#60a5fa` |
| `accent/violet`                   | `--accent-violet`     | `#6d28d9` | `#a78bfa` |
| `accent/spring` ~ `accent/winter` | `--accent-{season}`   | (시즌별)  | (시즌별)  |
| `accent/festival`                 | `--accent-festival`   | `#b45309` | `#f59e0b` |

> 시즌/festival 의 gradient (`-grad-start` / `-grad-end`) 도 동일 명 패턴으로 추가.

#### Spacing (`tokens/_layout.scss`)

4px grid. Figma variable 명 `space/N` (숫자) — `--space-N` 와 1:1.

| Figma      | CSS          | 값   |
| ---------- | ------------ | ---- |
| `space/1`  | `--space-1`  | 4px  |
| `space/2`  | `--space-2`  | 8px  |
| `space/3`  | `--space-3`  | 12px |
| `space/4`  | `--space-4`  | 16px |
| `space/5`  | `--space-5`  | 20px |
| `space/6`  | `--space-6`  | 24px |
| `space/8`  | `--space-8`  | 32px |
| `space/10` | `--space-10` | 40px |
| `space/12` | `--space-12` | 48px |

#### Radius (`tokens/_misc.scss`)

| Figma         | CSS             | 값     |
| ------------- | --------------- | ------ |
| `radius/sm`   | `--radius-sm`   | 4px    |
| `radius/md`   | `--radius-md`   | 8px    |
| `radius/lg`   | `--radius-lg`   | 12px   |
| `radius/xl`   | `--radius-xl`   | 16px   |
| `radius/full` | `--radius-full` | 9999px |

#### Shadow (`tokens/_shadow.scss`) / Motion (`tokens/_motion.scss`) / Typography (`tokens/_typography.scss`)

같은 패턴 — Figma variable 명 = CSS 변수명 (prefix `--` 제거).

### 3-3. 컴포넌트 명 = Storybook story 명

본 프로젝트의 primitive 18 종 (Storybook 카탈로그):

```
UI:        Button / Card / Chip / DestinationCard / Dialog / IconButton
           MediaThumb / PageSection / RadioGroup / Tabs / TextField / ButtonGrid
Feedback:  EmptyState / Skeleton / Toaster / ConfirmDialog / AsyncSection / SegmentError
Forms:     Toggle
Icon:      Icon
```

Figma 측 component 명을 **이 list 와 동일** 하게 두면 매핑 자동.

각 컴포넌트의 variant prop 도 일치:

- `Button.variant`: `primary` | `secondary` | `ghost` | `danger`
- `Card.variant`: `surface` | `soft` | `elevated` | `highlighted`
- `Card.padding`: `none` | `sm` | `md` | `lg`
- `Chip.variant`: ... (Storybook story args 참조)

---

## 4. 디자이너 측 약속 (가장 중요)

이 약속이 워크플로우 ROI 의 90% 를 결정합니다. 안 지켜져도 작동은 하지만 매 화면마다 변환 비용 발생.

### ✅ 지킬 것

1. **모든 색은 Tokens Studio variable 참조** — `color/bg`, `accent/festival` 등. raw hex (`#ffffff`) 직접 입력 X.
2. **모든 간격/사이즈는 space/radius variable 참조** — `space/4`, `radius/lg`. raw px (`16px`) 직접 입력 X.
3. **컴포넌트는 Storybook 18 종 중 매핑되는 것 우선 사용** — 새로 그리기 전에 본 카탈로그 검토.
4. **새 토큰 필요 시 사용자에게 먼저 요청** — Figma 에 임의 hex 추가하지 말고, 어떤 의미의 토큰이 필요한지 합의 후 `tokens/_*.scss` 와 Tokens Studio 양쪽 신설.
5. **dark mode 도 토큰 정의** — 한쪽만 있으면 dark mode 깨짐.

### ❌ 피할 것

1. raw hex/px 직접 입력 — 변경 시 자동 반영 안 됨, Claude 가 매번 매핑해야 함.
2. 같은 의미인데 다른 명 사용 — `bg-main` vs `color/bg` 처럼 명 차이로 mapping 깨짐.
3. inline shadow / radius / 모서리 직접 그리기 — variable 우선.

---

## 5. Claude Code 측 셋업

### 5-1. Figma Personal Access Token 발급

1. Figma → Settings → Account → Personal access tokens → "Generate new token"
2. scope: `file_content:read` (또는 read-only)
3. token 복사 (한 번만 표시)

### 5-2. MCP server 등록

`~/.claude/mcp.json` (user-level) 또는 `.claude/mcp.json` (프로젝트):

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--stdio"],
      "env": {
        "FIGMA_API_KEY": "figd_xxxxxxxxxxxx"
      }
    }
  }
}
```

`figma-developer-mcp` 가 community MCP server — Figma REST API 를 MCP 로 wrap. Anthropic official 출시 시 그쪽으로 마이그.

### 5-3. 등록 확인

Claude Code 재시작 → `/mcp` 명령으로 figma server 가 connected 상태인지 확인.

---

## 6. 사용 흐름

### 6-1. 디자이너 → Claude

```
디자이너:    Figma URL 또는 node link 공유
            https://www.figma.com/file/{fileKey}/...?node-id={nodeId}
사용자:     Claude 에게 "이 디자인 그대로 만들어줘: <URL>"
```

### 6-2. Claude 의 자동 흐름

1. `mcp__figma__get_file_nodes` 로 node spec fetch
2. 응답의 `boundVariables` / `referencedVariable.name` 으로 토큰 이름 추출
3. 코드 토큰 (`var(--color-bg)` 등) 으로 그대로 매핑
4. 기존 primitive (Button/Card/...) 가 디자인과 같은 shape 인지 검사
5. 같으면 재사용 / 다르면 새 컴포넌트 (`*.stories.tsx` 동반)
6. dark mode / 360 모바일 분기 자동 검증

### 6-3. 토큰 변경 시 (Tokens Studio Free)

GitHub sync 가 Pro 라 수동:

```
디자이너:    Tokens Studio → Export → tokens.json 다운로드
            ↓ Slack/메일로 전달
사용자:     Claude 에게 "이 JSON 으로 tokens/ 갱신해줘" + JSON 첨부
Claude:     변경된 토큰만 diff 후 tokens/_*.scss 갱신 + commit
```

월 1-2 회 정도면 충분히 운영 가능. 빈도 ↑ 시 Tokens Studio Pro + GitHub sync 도입 검토.

---

## 7. 변경 비용이 작은 이유 (시스템 효과)

본 프로젝트는 이미 다음이 갖춰져 있어서, 디자이너가 §4 약속만 지키면 매 화면 받을 때마다 처리 시간 적음:

| 갖춰진 인프라                         | 효과                                       |
| ------------------------------------- | ------------------------------------------ |
| primitive 18 종 + Storybook           | 새 화면의 80%+ 가 기존 컴포넌트 조합       |
| 토큰 single source (`tokens/_*.scss`) | 색/간격 변경은 토큰만 — 컴포넌트 코드 무관 |
| variant prop 패턴                     | 디자인 variant 추가는 prop 한 줄           |
| raw hex/px 0 정책                     | 디자인 의도 변경 시 코드 자동 추종         |
| dark/light 토큰 분기                  | 한쪽 그려도 자동 양쪽 반영                 |
| 360 fluid 반응형                      | Galaxy S8 까지 별도 작업 X                 |

즉 **"디자인 받을 때마다 큰 작업"** 이 아니라 **"한 번 시스템 잡으면 매번 빠름"** 구조.

---

## 8. 운영 룰 (Claude 가 지킬 것)

### 8-1. 토큰 우선

- raw hex / px 직접 사용 금지 — 토큰 (`var(--color-*)`, `var(--space-*)`) 만 사용
- Figma 의 raw 값이 토큰에 없으면 **새 토큰 신설** (← 디자이너와 합의 후) — `tokens/_*.scss` 갱신

### 8-2. primitive 재사용 우선

- 새 컴포넌트 만들기 전에 18 primitive 검토. variant 추가로 cover 가능하면 새 컴포넌트 X.

### 8-3. dark / light 양쪽 검증

- `_color.scss` (light) + `_dark.scss` (dark) 모두 토큰 정의되어야. 한쪽만 있으면 dark mode 깨짐.

### 8-4. 360 모바일 안전

- 모든 신규 컴포넌트는 360 viewport (Galaxy S8) 에서 가로 overflow 0 확인.
- `≤380` media 분기 필요 시 `@media (max-width: 380px)` (clamp 기반 fluid 우선).

### 8-5. Storybook story 동반

- 새 primitive 추가 시 `*.stories.tsx` 같이 생성. 디자이너 검수 채널.

---

## 9. 첫 시도 권장 시나리오

작은 단일 컴포넌트로 검증:

1. 디자이너가 Figma 본인 Drafts 에 `Button.primary` variant 하나 만듦 (Tokens Studio variable 사용)
2. View-only link 공유
3. Claude 에게 Figma URL 전달
4. Claude 가 fetch → 기존 `components/ui/Button.tsx` 와 비교
5. 토큰 일치하면 변경 0 (validate only) / 새 variant 면 코드 추가
6. Storybook story 자동 갱신

이 흐름이 매끄럽게 돌면 더 복잡한 화면 (페이지 layout) 으로 확장.

---

## 10. FAQ

**Q. 토큰 안 쓰고 raw hex 로 그려도 작동하나요?**
A. 작동은 합니다. 다만 Claude 가 매 화면마다 hex → token 매핑하느라 시간·토큰 ↑. 디자인 변경 시 자동 추종 안 됨 — ROI 잃음.

**Q. 디자이너가 새 색을 추가하고 싶을 땐?**
A. Figma 에 임의 hex 입력하지 말고, 사용자에게 "이런 의미의 색이 필요" 요청. 둘이 합의 후 `tokens/_color.scss` + `_dark.scss` + Tokens Studio variable 동시 신설.

**Q. 디자이너가 다른 사람 (PM/개발자) 을 Editor 로 초대하면?**
A. Figma 가 team workspace 로 자동 전환되면서 무료 한도 (file 3개) 적용. 4번째 file 부터 Pro 필요. 협업 안 하고 View-only link 만 공유하면 영구 무료.

**Q. Tokens Studio 의 GitHub sync 꼭 필요한가요?**
A. 본 프로젝트 빈도 (월 ~수 회 변경) 라면 불필요. 수동 export + Claude 에게 JSON 던지기로 충분. 주 1회+ 변경이면 Pro 고려.

**Q. Anthropic official Figma MCP 나오면 어떻게?**
A. `.claude/mcp.json` 에서 `figma-developer-mcp` → 새 server 명만 변경. 사용 흐름 동일.

---

## 11. 관련 문서

- [STYLES.md](./STYLES.md) — 디자인 토큰 정책 + clamp 기반 fluid 반응형
- [STORYBOOK.md](./STORYBOOK.md) — primitive 카탈로그 + Provider decorator
- [ARCHITECTURE.md](./ARCHITECTURE.md) — 전체 layer 구조
