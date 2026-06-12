# Figma → 코드 워크플로우 가이드

Figma MCP 를 통해 디자인을 Claude Code 가 직접 코드로 반영하는 환경 셋업.

> SoT: 디자이너 측 Tokens Studio variable 명과 본 문서의 매핑 표.
> 마지막 갱신: 2026-06-12

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
