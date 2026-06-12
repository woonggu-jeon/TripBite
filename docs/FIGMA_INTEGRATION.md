# Figma → 코드 워크플로우 가이드

Figma MCP 를 통해 디자인을 Claude Code 가 직접 코드로 반영하는 환경 셋업.

> SoT: 디자이너 측 Tokens Studio variable 명과 본 문서의 매핑 표.
> 마지막 갱신: 2026-06-12

---

## 1. 큰 그림

```
[Figma 디자이너]                    [Claude Code]
  │ Tokens Studio 로 variable        │ Figma MCP 로 URL/node fetch
  │ (코드 토큰과 동일 명)            │ ↓
  │ ↓                                │ 응답 안의 referencedVariable.name
  │ 컴포넌트 (Storybook 명과 동일)   │ → CSS 변수로 그대로 사용
  │ ↓                                │ → 기존 primitive 재사용
  │ Figma URL / node id 공유         │ → raw hex/px 0
```

핵심 원칙 — **양쪽 명을 같게 만들어 mapping cost 를 0 으로**.

---

## 2. 디자이너 측 셋업 (Tokens Studio for Figma)

### 2-1. 설치

Figma 플러그인 → "Tokens Studio for Figma" 설치.

### 2-2. variable 명 매핑

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

> ⚠ **사용하지 말 것**: raw hex / 임의 px / inline 색. 디자인 의도 변경 시 토큰만 변경하면 코드 자동 반영되도록 모든 색·간격은 variable 참조.

### 2-3. 컴포넌트 명 = Storybook story 명

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

### 2-4. export (선택 — 추가 자동화)

Tokens Studio → GitHub sync 설정 시:

- Figma 토큰 변경 → JSON export → repo PR
- FE 가 style-dictionary 로 `tokens/_*.scss` 갱신 (현재 미도입 — 필요 시 추가)

현재는 **수기 매핑** 으로도 충분. variable 명만 같으면 Claude 가 코드 변환.

---

## 3. Claude Code 측 셋업

### 3-1. Figma Personal Access Token 발급

1. Figma → Settings → Account → Personal access tokens → "Generate new token"
2. scope: `file_content:read` (또는 read-only)
3. token 복사 (한 번만 표시)

### 3-2. MCP server 등록

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

### 3-3. 등록 확인

Claude Code 재시작 → `/mcp` 명령으로 figma server 가 connected 상태인지 확인.

---

## 4. 사용 흐름

### 4-1. 디자이너에게 받은 Figma URL

```
https://www.figma.com/file/{fileKey}/...?node-id={nodeId}
```

### 4-2. Claude 에게 요청 예시

> "이 Figma 디자인 그대로 컴포넌트 만들어줘: <URL>"

### 4-3. Claude 의 자동 흐름

1. `mcp__figma__get_file_nodes` 로 node spec fetch
2. 응답 안의 `boundVariables` / `referencedVariable.name` 으로 토큰 이름 추출
3. 코드 토큰 (`var(--color-bg)` 등) 으로 매핑
4. 기존 primitive (Button/Card/...) 가 디자인과 같은 shape 인지 검사
5. 같으면 재사용 / 다르면 새 컴포넌트 (Storybook story 동반)
6. 다크 모드 / 360 모바일 분기 자동 검증

---

## 5. 운영 룰 (Claude 가 지킬 것)

### 5-1. 토큰 우선

- raw hex / px 직접 사용 금지 — 토큰 (`var(--color-*)`, `var(--space-*)`) 만 사용
- Figma 의 raw 값이 토큰에 없으면 **새 토큰 신설** (← 디자이너와 합의 후) — `tokens/_*.scss` 갱신

### 5-2. primitive 재사용 우선

- 새 컴포넌트 만들기 전에 18 primitive 검토. variant 추가로 cover 가능하면 새 컴포넌트 X.

### 5-3. dark / light 양쪽 검증

- `_color.scss` (light) + `_dark.scss` (dark) 모두 토큰 정의되어야. 한쪽만 있으면 dark mode 깨짐.

### 5-4. 360 모바일 안전

- 모든 신규 컴포넌트는 360 viewport (Galaxy S8) 에서 가로 overflow 0 확인.
- `≤380` media 분기 필요 시 `@media (max-width: 380px)` (clamp 기반 fluid 우선).

### 5-5. Storybook story 동반

- 새 primitive 추가 시 `*.stories.tsx` 같이 생성. 디자이너 검수 채널.

---

## 6. 첫 시도 권장 시나리오

작은 단일 컴포넌트로 검증:

1. 디자이너가 Figma 에 `Button.primary` variant 하나 만듦 (Tokens Studio variable 사용)
2. Claude 에게 Figma URL 전달
3. Claude 가 fetch → 기존 `components/ui/Button.tsx` 와 비교
4. 토큰 일치하면 변경 0 (validate only) / 새 variant 면 코드 추가
5. Storybook story 자동 갱신

이 흐름이 매끄럽게 돌면 더 복잡한 화면 (페이지 layout) 으로 확장.

---

## 7. 관련 문서

- [STYLES.md](./STYLES.md) — 디자인 토큰 정책 + clamp 기반 fluid 반응형
- [STORYBOOK.md](./STORYBOOK.md) — primitive 카탈로그 + Provider decorator
- [ARCHITECTURE.md](./ARCHITECTURE.md) — 전체 layer 구조
