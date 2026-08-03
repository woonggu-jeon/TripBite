# 여행 한입 Figma 디자인 → TripBite 적용 핸드오프

> 새 Claude Code 세션에서 이 작업을 이어받을 때 **가장 먼저 읽는 문서**입니다.
> 작성 시점: 2026-08-03. 별도 세션(`TripBite-design`)에서 Figma 작업을 마친 뒤 인계용으로 작성.

---

## 0. 30초 요약

- Figma 파일에 **원시 변수 88개 + 시맨틱 변수 20개(Light/Dark, 전부 alias) + Foundations 페이지 + Components 페이지**가 준비되어 있습니다.
- 이 레포에는 **이미 훌륭한 토큰 시스템**이 있습니다 (`docs/STYLES.md` 참조). 새로 만들 필요가 없습니다.
- **하지만 두 시스템의 브랜드가 다릅니다.** 이 레포는 `--color-primary: #0a0a0a`(검정), Figma 디자인은 `#00B334`(초록)입니다.
- 따라서 이 작업은 "디자인 적용"이 아니라 **브랜드 변경 + 토큰 네이밍 정합**입니다.
- **§3의 결정 4건은 확정되었습니다** (2026-08-03). 요약: 초록으로 전환하되 면은 시안 그대로 `#00B334`, 텍스트·테두리는 `#038027`, 흰 라벨 채움 버튼 면은 `#00821F`. 레포의 WCAG AA 기준 유지. 계절색은 두 계층 병존. 그림자·모션 토큰 유지.
- 바로 시작하려면 **§5의 1a**부터. 디자이너 승인이 남은 항목은 §3 결정 1의 "⚠ 디자이너 확인 필요" 한 줄뿐입니다.

---

## 0-1. ⚠ Figma 에서 가져오는 것 / 가져오지 않는 것

**가져오는 것** — 레이아웃, 간격, 색, 타이포, 라운드, 컴포넌트 구조와 변형, 상태(default/
active/error/disabled), 아이콘 세트.

**가져오지 않는 것 — 문구.** Figma 시안의 텍스트는 전부 **더미/샘플**입니다.

| Figma 시안의 문자열                     | 실제 정체               |
| --------------------------------------- | ----------------------- |
| `Text`                                  | Figma 플레이스홀더 토큰 |
| `travelbite` / `travelbite12!`          | 입력 예시값             |
| `여행한입러`                            | 닉네임 예시값           |
| `hi@tripbite.kr` / `hi****@tripbite.kr` | 이메일 예시값           |
| `영문or숫자/특문제외/4자 ~ 20자`        | 헬퍼 캡션 **형태** 예시 |
| `가입할 때 사용한 이메일을 입력하면 …`  | 2줄 끊기 **패턴** 예시  |

> **이 레포의 문구 SoT 는 `src/i18n/messages/{ko,en}.json` 입니다** (next-intl).
> 124개 파일이 `useTranslations` / `getTranslations` 로 읽고, `src/i18n/types.d.ts` 가
> `ko.json` 을 import 해 메시지 키를 타입으로 잠가둡니다.
>
> - 컴포넌트에 문구를 **하드코딩하지 마세요.** 반드시 메시지 키를 통해 씁니다.
> - `DESIGN.md` 와 `STITCH-BRIEF.md` 가 인용하는 한국어 문장은 **톤·구조 예시**이며
>   그대로 넣을 카피가 아닙니다. 실제 문구는 기획/카피 담당이 정합니다.
> - 새 문구가 필요하면 `ko.json` + `en.json` 양쪽에 키를 추가합니다.
>
> `DESIGN.md` §7(한국어 문안 톤)은 "어떤 톤으로 쓸지"의 기준일 뿐이고,
> "무엇을 쓸지"의 출처가 아닙니다.

---

## 1. 이 레포의 기존 자산 (건드리기 전에 반드시 읽기)

| 문서                                                   | 역할                                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------ |
| [`docs/STYLES.md`](../STYLES.md)                       | **토큰 사용 규칙의 최종 권위.** 용도별 토큰 표, 파일 구조, 우선순위      |
| [`docs/FIGMA_INTEGRATION.md`](../FIGMA_INTEGRATION.md) | Figma→코드 워크플로우. **SoT 정책: Tokens Studio 변수명 == 코드 토큰명** |
| [`docs/STORYBOOK.md`](../STORYBOOK.md)                 | 컴포넌트 문서 위치                                                       |

토큰 파일 구조 (`src/app/styles/`):

```
tokens/_color.scss       base + primary scale(color-mix 파생) + surface + glass + on-strong
tokens/_typography.scss  font-size + 시멘틱 + 도메인 + line + tracking + weight
tokens/_layout.scss      spacing + content + header-h + bottom-nav-h + z-index + icon
tokens/_shadow.scss      box + drop + text shadow
tokens/_motion.scss      duration + ease
tokens/_misc.scss        radius + opacity + border-width
_accents.scss            시즌 5종 + 카테고리 5종 accent
_dark.scss               dark override
_fonts.scss              Pretendard fallback @font-face   ← 이미 Pretendard 사용 중
```

**이미 구현된 컴포넌트** (Figma Components 페이지와 겹침 — 새로 만들지 말고 대조·수정):
`AppHeader` · `SubHeader` · `BottomNav` · `AuthLayout` · `Toggle` · `EmptyState` · `Icon` · `Skeleton` · `Toaster` · `SegmentError`

### 가장 중요한 구조적 사실

`_color.scss`의 primary scale은 **`--color-primary` 한 줄에서 `color-mix()`로 파생**됩니다:

```scss
--color-primary: #0a0a0a;
--color-primary-soft: color-mix(
  in srgb,
  var(--color-primary) 8%,
  var(--color-bg)
);
--color-primary-tint: color-mix(in srgb, var(--color-primary) 12%, transparent);
--color-primary-border: color-mix(
  in srgb,
  var(--color-primary) 30%,
  var(--color-border)
);
--color-primary-ring: color-mix(in srgb, var(--color-primary) 30%, transparent);
--color-primary-muted: color-mix(
  in srgb,
  var(--color-primary) 60%,
  var(--color-fg)
);
/* … 외 다수 */
```

→ **`--color-primary`를 `#00B334`로 바꾸면 파생 토큰 10여 개가 자동으로 초록 계열이 됩니다.** 가장 깔끔한 진입점이자, 가장 위험한 한 줄입니다. 반드시 Storybook + Playwright 스냅샷으로 회귀 확인하세요.

---

## 2. Figma 쪽에 준비된 것

파일 키: **`Kjxpfmi9KqYGJTJEbj7ue6`**
(URL: `https://www.figma.com/design/Kjxpfmi9KqYGJTJEbj7ue6/...`)

| 페이지        | 내용                                                                       |
| ------------- | -------------------------------------------------------------------------- |
| `컴포넌트`    | 컴포넌트 세트 34개 + 단독 1개 (총 188 베리언트)                            |
| `페이지`      | 실제 화면 시안                                                             |
| `Foundations` | 색/타이포/간격/라운드/치수/테두리/엘리베이션 문서. 전부 실제 변수에 바인딩 |
| `Components`  | 35개 컴포넌트 × 188 베리언트 전수. 전부 실제 인스턴스                      |

변수 컬렉션 2개:

- **`Primitives`** (단일 모드, 88개) — `Color/{Neutral,Green,Orange,Red,Lime,Blue}/{step}`, `Spacing/{n}`, `Radius/{n}`, `Size/{n}`, `BorderWidth/{n}`, `FontSize/{n}`, `LineHeight/{n}`, `LetterSpacing/{n}`, `FontFamily/*`, `FontStyle/*`
- **`변수 컬렉션`** (Light/Dark, 20개) — `Basic/*`, `Contents/*`. **20개 전부 Primitives를 alias로 참조** (raw 값 0건)

전 변수에 WEB code syntax가 들어 있습니다 (예: `Color/Green/500` → `var(--color-green-500)`).

동봉 파일:

- [`DESIGN.md`](./DESIGN.md) — 스타일 명세 (분위기/색/타이포/컴포넌트/Do·Don't/접근성). **이 폴더 안에서는 이 문서가 디자인 의도의 기준**
- [`primitives.json`](./primitives.json) — 원시 토큰 88개 + 각 값의 출처·용처

---

## 3. 결정 4건 — 확정됨 (2026-08-03)

> 이 결정은 Claude가 실측 데이터를 근거로 내렸고, 사용자가 위임했습니다.
> **디자이너 최종 승인은 아직 받지 않았습니다.** 아래 "디자이너 확인 필요" 항목만 별도로 확인받으세요.

### 결정 1 — 초록으로 전환. 면은 시안 그대로, 텍스트만 어둡게 ✅

`--color-primary`를 `#0a0a0a`(검정) → `#00B334`(초록)로 전환합니다.

**근거 1 — 파생 구조가 이 디자인에 이미 맞습니다.** `color-mix()` 파생값 실측:

| 파생 토큰                   | 초록 기준 결과 | 판정                                            |
| --------------------------- | -------------- | ----------------------------------------------- |
| `--color-primary-soft`      | `#EBF9EF`      | **Figma `secondary01` `#EAF6EF`와 사실상 동일** |
| `--color-primary-muted`     | `#046F23`      | 흰 배경 6.32:1 PASS                             |
| `--color-primary-text-bold` | `#038027`      | 5.08:1 PASS                                     |
| `--color-primary-border`    | `#A0D7B4`      | 연초록 테두리, 적절                             |

레포의 파생 규칙이 Figma의 연초록 토큰을 우연히 재현합니다.

**근거 2 — 교체 비용이 낮습니다.** `--color-primary` 133 uses / 63 files, 파생 포함 약 238 uses / 70 files이지만 전부 한 변수를 경유합니다. Tailwind 클래스(`bg-primary` 등)는 **사용처 0건**이라 className 수정이 없습니다.

**단, 초록은 대비가 양방향으로 실패합니다** (검정일 때는 양방향 19.80:1로 안전했음):

|                             | 검정    | 초록            |
| --------------------------- | ------- | --------------- |
| `primary` 텍스트 on 흰 배경 | 19.80:1 | **2.80:1 FAIL** |
| 흰 텍스트 on `primary`      | 19.80:1 | **2.80:1 FAIL** |

`var(--color-primary)`의 CSS 속성별 사용 분포 (실측):

```
color:         32   ← 텍스트. 2.80:1 로 실패 → 교체 대상
border-color:  27   ← 상태 표시 테두리. 비텍스트 3:1 기준에 근소 미달
background:    27   ← 면. 시안의 선명한 초록 유지
accent-color:   2
--focus-outline 1
```

**적용 규칙:**

| 용도                     | 토큰                                | 값        | 대비        |
| ------------------------ | ----------------------------------- | --------- | ----------- |
| 배경 · 배지 · focus ring | `--color-primary`                   | `#00B334` | 시안 그대로 |
| 텍스트 · 링크 (32곳)     | `--color-primary-text-bold`         | `#038027` | 5.08:1 PASS |
| 상태 표시 테두리 (27곳)  | `--color-primary-text-bold`         | `#038027` | 5.08:1 PASS |
| 흰 라벨 채움 버튼 면     | `--color-primary-strong` **(신규)** | `#00821F` | 4.98:1 PASS |

`--color-primary-text-bold`는 **이미 존재하는 토큰**입니다 (`mix(primary 70%, fg)`). primary를 초록으로 바꾸면 자동으로 `#038027`이 됩니다. 신규 추가는 `--color-primary-strong` 하나뿐입니다.

참고로 `#00A02F`(3.46:1)·`#009029`(4.18:1)로는 부족하고 **`#00821F`부터 통과**합니다.

**⚠ 디자이너 확인 필요** — 채움 버튼과 초록 텍스트가 시안보다 약간 어둡게 나옵니다. 나란히 두면 거의 구분되지 않지만, 시안과의 차이를 승인받으세요.

### 결정 2 — 레포의 WCAG AA 기준을 유지 ✅

이 레포는 대비율을 주석에 기록하며 관리합니다 (`_color.scss`에서 `#6b7280`을 4.43:1이라 **탈락**시키고 `#5b6470` 6.0:1을 채택한 흔적). **이 기준을 낮추지 않습니다.**

시안과 어긋나는 부분은 결정 1의 적용 규칙으로 흡수하고, 남는 예외는 문서화합니다.

**남는 예외 (허용):** 원형 배지 아이콘 `#00B334` on `#EAF6EF` = **2.53:1** (비텍스트 3:1 미달, 다크는 5.09:1 통과).
→ 배지 글리프는 바로 아래 제목·설명이 같은 의미를 전달하는 **장식 요소**라 허용합니다. 단 **배지 아이콘만으로 정보를 전달하는 화면은 만들지 않습니다.**

### 결정 3 — 계절 accent는 두 계층으로 분리 ✅

|        | 현재 레포                          | Figma                             |
| ------ | ---------------------------------- | --------------------------------- |
| spring | `#c2185b` (6.5:1, **텍스트 가능**) | `#FFEBEB` (파스텔, **면색 전용**) |
| autumn | `#b15402` (5.0:1, 텍스트 가능)     | `#FFCD99` (파스텔)                |

역할이 다르므로 치환하지 않고 **병존**시킵니다.

```
--accent-{spring,summer,autumn,winter}          현행 유지 (텍스트용 진한 톤)
--accent-{spring,summer,autumn,winter}-surface  신규 — Figma 파스텔 (면색 전용)
```

Figma 값: spring `#FFEBEB` · summer `#E0FF89` · autumn `#FFCD99` · winter `#E8F1FD`
(다크: `#3A1E1B` · `#2E3A14` · `#3A2A18` · `#17243A`)

파스텔 면 위 텍스트는 `#151515`를 씁니다. **파스텔을 텍스트 색으로 쓰지 않습니다.**

### 결정 4 — 그림자·모션 토큰 유지 ✅

`DESIGN.md`는 "그림자 없음"을 명시하지만(Figma 이펙트 스타일 0개), 이는 **auth 8화면과 컴포넌트 라이브러리 범위의 관찰**이며 앱 전역 금지로 확대할 근거가 아닙니다.

`_shadow.scss`·`_motion.scss`는 이미 앱 전반에서 사용 중이고, 걷어내면 되돌리기 어렵습니다. 위험 대비 이득이 없습니다.

**규칙:** 기존 사용처는 유지. **Figma 시안을 기반으로 새로 만드는 컴포넌트는 그림자 없이** 헤어라인·면색·여백으로 깊이를 만듭니다. 모션은 이번 범위에서 정의하지 않으므로 새로 만들지 않습니다.

---

## 4. 토큰 매핑 표 (초안 — 검증 필요)

`⚠` = 값 또는 의미가 충돌. `NEW` = 레포에 대응 토큰 없음.

| Figma 시맨틱                  | Figma Light | 레포 토큰                                  | 레포 현재값     | 비고                              |
| ----------------------------- | ----------- | ------------------------------------------ | --------------- | --------------------------------- |
| `Basic/BgColor/white`         | `#FFFFFF`   | `--color-bg`                               | `#ffffff`       | 일치                              |
| `Basic/TextColor/fg`          | `#151515`   | `--color-fg`                               | `#0a0a0a`       | 근사                              |
| `Basic/TextColor/muted`       | `#393939`   | `--color-muted`                            | `#5b6470`       | ⚠ 레포는 대비 맞춘 값             |
| `Basic/TextColor/sub`         | `#8A8A8A`   | —                                          | —               | NEW (3.45:1 — 메타 전용)          |
| `Basic/TextColor/disabled`    | `#B4B4B4`   | —                                          | —               | NEW                               |
| `Basic/TextColor/white`       | `#FFFFFF`   | `--color-primary-fg` / `--color-on-strong` | `#ffffff`       | 일치                              |
| `Basic/BorderColor/gray`      | `#E0E0E0`   | `--color-border`                           | `#e5e7eb`       | 근사                              |
| `Basic/MainColor/primary`     | `#00B334`   | `--color-primary`                          | `#0a0a0a`       | ⚠ **결정 1**                      |
| `Basic/MainColor/accent`      | `#F79D26`   | —                                          | —               | NEW (로고·포인트 전용)            |
| `Basic/MainColor/secondary01` | `#EAF6EF`   | `--color-primary-soft`                     | `color-mix(8%)` | ⚠ 레포는 파생, Figma는 고정값     |
| `Basic/MainColor/accent-soft` | `#FCEFD9`   | —                                          | —               | NEW                               |
| `Basic/BgColor/disabled`      | `#F1F1F1`   | —                                          | —               | NEW (`--color-surface-soft` 확인) |
| `Basic/System/error`          | `#E1493C`   | `--color-danger`                           | `#dc2626`       | 근사                              |
| `Contents/Button/primary`     | `#00B334`   | (primary와 동일)                           | —               | 결정 1에 종속                     |
| `Contents/Button/disabled`    | `#E0E0E0`   | —                                          | —               | NEW                               |
| `Contents/section`            | `#F6F6F6`   | `--color-surface-soft`?                    | 확인 필요       | 확인 필요                         |
| `Contents/Season/*`           | 파스텔 4종  | `--accent-*`                               | 어두운 톤       | ⚠ **결정 3**                      |
| —                             | —           | `--color-success` `--color-warning`        | 존재            | Figma에 대응 없음 (유지)          |
| —                             | —           | sage / letter / chart / glass              | 존재            | Figma에 대응 없음 (유지)          |

---

## 4-1. 2단계 대조 결과 — 타이포 · 라운드 · 스페이싱 (2026-08-03)

사용 빈도는 `grep -ro "var(--token)" src | wc -l` 실측값입니다.

### 자간 (letter-spacing) — 토큰은 있는데 **주로 쓰는 값이 반대**

| Figma | 레포 토큰          | 값        | 레포 사용   |
| ----- | ------------------ | --------- | ----------- |
| -2%   | `--tracking-tight` | `-0.02em` | 29 uses     |
| -1%   | `--tracking-snug`  | `-0.01em` | **47 uses** |

두 값 모두 존재하므로 **새 토큰은 필요 없습니다.** 다만 Figma는 12px 캡션(`Caption/R_12`)만 -1%이고
**나머지 13개 스타일이 전부 -2%** 입니다. 레포는 그 반대로 `-0.01em`을 더 많이 씁니다.
→ 시안대로 맞추려면 47곳 중 캡션이 아닌 것을 `tight`로 옮겨야 합니다.

### 행간 (line-height) — Figma의 주력 값이 레포에 **없습니다**

| Figma | 쓰이는 곳              | 레포 토큰                         | 레포 사용 |
| ----- | ---------------------- | --------------------------------- | --------- |
| 120%  | 10px 캡션 2종          | `--line-tight` (1.2)              | 10 uses   |
| 130%  | Title 20 / 24          | **없음** (snug = 1.35)            | —         |
| 140%  | **나머지 11개 스타일** | **없음** (snug 1.35 / normal 1.5) | —         |

`--line-snug: 1.35`, `--line-normal: 1.5` 사이에 1.4가 없습니다. Figma 텍스트 스타일 14개 중
**11개가 140%** 이므로 가장 자주 쓰이는 값이 비어 있는 상태입니다.

### 폰트 크기 — 레포에 Figma에 없는 크기가 **많이 쓰이고** 있습니다

| Figma | 레포 시맨틱      | 값  | 레포 사용   | 판정                    |
| ----- | ---------------- | --- | ----------- | ----------------------- |
| 24    | `--font-h1`      | 24  | 14 uses     | 일치                    |
| 20    | `--font-h2`      | 20  | 7 uses      | 일치                    |
| 18    | `--font-h3`      | 17  | 7 uses      | ⚠ 1px 차이              |
| 16    | `--font-body`    | 16  | 30 uses     | 일치                    |
| 14    | `--font-body-sm` | 15  | **45 uses** | ⚠ Figma에 15 없음       |
| —     | `--font-label`   | 13  | **34 uses** | ⚠ Figma에 13 없음       |
| 12    | `--font-caption` | 12  | 44 uses     | 일치                    |
| —     | `--font-eyebrow` | 11  | 18 uses     | ⚠ Figma에 11 없음       |
| 10    | **없음**         | —   | —           | ⚠ Figma 캡션 2종이 10px |

가장 많이 쓰이는 `--font-body-sm`(15px)·`--font-label`(13px)이 Figma에 없는 크기입니다.
반대로 Figma의 10px은 레포에 없습니다.

### 라운드 (radius) — Figma는 전부 12px, 레포 주력은 8px

| Figma          | 레포 토큰       | 값   | 레포 사용   |
| -------------- | --------------- | ---- | ----------- |
| —              | `--radius-sm`   | 4    | 17 uses     |
| 10 (구 입력값) | `--radius-md`   | 8    | **70 uses** |
| **12 (주력)**  | `--radius-lg`   | 12   | 29 uses     |
| —              | `--radius-xl`   | 16   | 3 uses      |
| full           | `--radius-full` | 9999 | 43 uses     |

Figma 시안은 **버튼·입력·카드가 전부 12px**입니다. 레포의 주력은 `--radius-md`(8px) 70곳입니다.
→ 시안대로 가려면 (a) `--radius-md` 값을 8→12로 바꾸거나 (b) 70곳을 `--radius-lg`로 옮겨야 합니다.
(a)는 한 줄이지만 4·8·12·16 스케일이 4·12·12·16으로 무너집니다.

`Radius/24`는 Figma 변수에 있으나 **시안에서 쓰이는 것을 확인하지 못했습니다**
(프로토타입의 프리뷰 셸에서 온 값일 가능성). 레포에 추가하지 않았습니다.

### 스페이싱 — Figma는 4px 그리드가 아닙니다

```
레포 (4px 그리드): 4 8 12 16 20 24 32 40 48
Figma:             2 4 8 10 12 16 20 22 24 26 28 30 36 40 60 140
일치:              4 8 12 16 20 24 40
Figma 전용:        2 10 22 26 28 30 36 60 140   ← 그리드 밖
레포 전용:         32 48
```

`_layout.scss`는 주석에 "4px grid"를 명시합니다. Figma의 `10 22 26 30` 등을 그대로 넣으면
그 규칙이 깨집니다. Figma 쪽 값들은 카드 패딩(26/22)·안내 화면 여백(30/36/60) 같은
개별 수치라 토큰화 가치가 낮습니다.

### 일치하는 항목

| 항목                | 레포                  | Figma      |
| ------------------- | --------------------- | ---------- |
| 헤더 높이           | `--header-h: 56px`    | 56px       |
| 아이콘 16 / 20 / 24 | `--icon-sm/md/lg`     | 동일       |
| 자간 -0.02 / -0.01  | `tracking-tight/snug` | -2% / -1%  |
| radius full         | `9999px`              | `9999`     |
| 폰트 패밀리         | Pretendard            | Pretendard |

### 2단계 결론 — 결정 5~8 확정 및 적용 완료 (2026-08-03)

**사용자 지시: "Figma 가 제일 우선. 단 스페이싱만 4px 그리드 유지."**

토큰 **값만** 재정렬했고 컴포넌트 코드는 한 줄도 바꾸지 않았습니다. 토큰 이름을 그대로
두었기 때문에 기존 호출부가 자동으로 새 값을 따릅니다.

| #   | 결정                                  | 적용                                                                                                   | 영향     |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------- |
| 5   | 행간을 Figma 3단(120/130/140%)에 정렬 | `line-snug` 1.35→**1.3**, `line-normal` 1.5→**1.4**                                                    | 23곳     |
| 6   | 라운드를 Figma 12px 통일에 맞춤       | `radius-md` 8→**12px** (md·lg 가 같은 값이 됨, 두 이름 유지)                                           | 99곳     |
| 7   | 폰트 크기를 Figma 7단에 정렬          | `h3` 17→**18**, `body-sm` 15→**14**, `label` 13→**12**, `eyebrow` 11→**10**, `--text-2xs`(10px) 신규   | 104곳    |
| 8   | 스페이싱은 4px 그리드 유지            | Figma 값 중 4의 배수인 **28 / 36 / 60 만 추가**(`space-7/9/15`). 그리드 밖(2·10·22·26·30)은 도입 안 함 | 신규 3개 |

적용 시 판단한 것:

- **`radius-md` 와 `radius-lg` 가 둘 다 12px 이 됩니다.** 시안이 버튼·입력·카드를 12px 로
  통일하므로 두 토큰의 값이 같아지는 게 정상입니다. 70곳(md) + 29곳(lg) = **99곳이 한 번에
  시안과 일치**하고, 컴포넌트 수정은 0입니다. 중복 이름을 없애려면 별도 정리 커밋이 필요합니다.
- **`font-label` 과 `font-caption` 이 둘 다 12px 이 됩니다.** Figma 가 입력 라벨과 캡션에
  같은 `Caption/R_12` 를 쓰기 때문입니다.
- **Figma 에 대응이 없는 토큰은 유지**했습니다 — `font-display`(40), `text-3xl`(30),
  `line-display`(1.1), `line-relaxed`(1.65), `radius-sm`(4), `radius-xl`(16), `space-8/12`(32/48).
- 시안의 **26px·22px 카드 패딩은 그리드 값(24·20)으로 맞춥니다** (사용자 지시에 따름).

검증: SCSS 컴파일 / prettier / login·onboarding 라이트·다크 렌더 확인. 레이아웃 깨짐·텍스트
잘림 없음.

**아직 안 한 것** — 자간 주력 전환. Figma 는 14개 스타일 중 13개가 -2% 인데 레포는
`--tracking-snug`(-0.01em) 이 47곳으로 더 많습니다. 토큰 값이 아니라 **호출부를 바꿔야 하는
문제**라 컴포넌트 수정이 필요하고, 2단계(토큰 값 정렬) 범위를 넘습니다 → 3단계에서 처리.

---

## 5. 권장 단계

| 단계 | 내용                                                                                                                                                  | 수정 범위      | 검증                                    |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------- |
| 0    | ~~결정 4건~~ **완료** (§3)                                                                                                                            | —              | —                                       |
| 1a   | 토큰 값 교체 — `_color.scss`의 `--color-primary` → `#00B334`, `--color-primary-strong` 신규, `_accents.scss`에 `-surface` 4종 추가, `_dark.scss` 대응 | 토큰 파일 3개  | Playwright 스냅샷 **before/after 확보** |
| 1b   | `var(--color-primary)`를 쓰는 `color:` 32곳 · `border-color:` 27곳을 `--color-primary-text-bold`로 교체                                               | SCSS 모듈 다수 | Storybook 전수 + a11y addon             |
| 1c   | 흰 라벨 채움 버튼 면을 `--color-primary-strong`으로 교체 (`--color-primary-fg`/`--color-on-strong` 사용처 33곳에서 식별)                              | 버튼·배지 계열 | 대비 재측정                             |
| 2    | 타이포/라운드/스페이싱 토큰 대조 (§4 미검증 영역)                                                                                                     | 토큰 파일      | 스냅샷 diff                             |
| 3    | 기존 컴포넌트를 Figma `Components` 페이지와 대조해 드리프트 수정                                                                                      | 컴포넌트       | Storybook + a11y                        |
| 4    | 없는 컴포넌트 추가 (`inputField`, `button` 11변형, 카드류, `chip`)                                                                                    | 신규           | Storybook 스토리 동반                   |
| 5    | 화면 적용                                                                                                                                             | 신규           | e2e                                     |

> **정정** — 이 문서 초판에서 1단계를 "값 교체뿐, 컴포넌트 수정 없음"이라고 썼는데 틀렸습니다.
> `--color-primary`가 텍스트(32곳)와 테두리(27곳)로도 쓰이기 때문에, 접근성을 지키려면 그 사용처를 토큰별로 분류해 교체해야 합니다. 그래서 1단계를 1a/1b/1c로 쪼갰습니다.

**1a를 먼저 커밋하고 스냅샷을 확보하세요.** 1a만 적용한 상태는 "초록으로 바뀌었지만 일부 텍스트 대비가 낮은" 중간 상태입니다 — 1b·1c까지 끝내야 기준을 만족합니다. 1a~1c를 한 PR로 묶는 것을 권합니다.

브랜치는 따로 파는 것을 권합니다 (현재 `feature/main-preview`에서 작업 중):

```bash
git switch -c feature/design-system-figma
```

---

## 6. 알려진 이슈 (Figma 쪽)

| 이슈                                                                | 영향                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pretendard가 Figma 팀/조직 폰트에 없습니다** (디자이너 로컬 폰트) | 플러그인 API로 폰트를 로드할 수 없어 `Foundations` 타이포 섹션의 행 높이가 균일하고, `Title/B_24_130%` 샘플 하나는 미리보기 렌더가 안 됩니다. 노드 데이터는 정상. **Figma에 Pretendard를 업로드하면 해결됩니다.** 레포는 `_fonts.scss`로 이미 Pretendard를 씁니다 |
| `detailIcon` 컴포넌트 세트가 오류 상태                              | 속성 정의를 읽을 수 없음. 18개 베리언트는 정상. 파일 점검 필요                                                                                                                                                                                                    |
| 컴포넌트 세트 이름이 `Frame`                                        | 실제로는 북마크 토글. `bookmark`로 개명 권장                                                                                                                                                                                                                      |
| `letterBox`의 속성명이 `pagenation`                                 | `pagination` 오타                                                                                                                                                                                                                                                 |
| Figma 변수명이 코드 토큰명과 다름                                   | `FIGMA_INTEGRATION.md`의 SoT 정책은 "Tokens Studio 변수명 == 코드 토큰명"입니다. 현재 Figma는 `Basic/TextColor/fg` 같은 자체 체계 → 정책대로 갈지, 매핑 표(§4)로 갈지 결정 필요                                                                                   |
| 다크 모드 시안이 없음                                               | 변수에는 Light/Dark 두 모드가 다 있지만 **화면 시안은 Light만** 존재. 다크에서의 레이아웃·강조 판단 근거 없음                                                                                                                                                     |
| 모션 정의 없음                                                      | 의도적으로 범위 제외. 임의로 만들지 말 것                                                                                                                                                                                                                         |

---

## 7. 참고: 별도 세션의 프로토타입

`C:\Users\aa\WebstormProjects\TripBite-design` 에 auth 8화면을 Vite + React + **CSS Modules**로 구현한 프로토타입이 있습니다.

> **이 코드를 이 레포로 옮기지 마세요.** 스타일 시스템이 다르고(CSS Modules vs Tailwind + SCSS Modules), 이 레포에 이미 있는 컴포넌트와 중복됩니다.

참고 가치가 있는 부분만:

- **아이콘 다크 대응 기법** — 내보낸 SVG는 색이 고정(`#151515`, `#393939`)되어 `<img>`로는 테마를 못 따라갑니다. `mask-image` + `background-color: currentColor`로 해결했습니다. 이 레포는 `scripts/build-icons.mjs` 파이프라인이 있으니 그쪽에 맞춰 적용하세요.
  - 함정: `mask-image`의 URL은 **반드시 따옴표**로 감싸야 합니다(`url("...")`). 번들러가 SVG를 data URI로 인라인할 때 속성 구분자로 `'`를 쓰는데, 따옴표 없는 CSS `url()` 토큰에는 인용부호가 들어갈 수 없어 마스크가 무효화되고 `currentColor` 사각형만 남습니다.
- **입력 검증 규칙** — Figma 헬퍼 캡션을 그대로 옮긴 규칙 (아이디 영문/숫자 4~20자, 비밀번호 영문+숫자+특문 10자 이상, 닉네임 특문제외 2~10자)
- `STITCH-BRIEF.md` — Google Stitch에 넘기는 작업 브리프. 이 레포와는 무관

---

## 8. 새 세션 시작 문구 예시

```
docs/design/HANDOFF.md 와 docs/STYLES.md 를 읽어줘.
§3 결정 4건은 이미 확정됐으니 그대로 따르고,
§5 의 1a(토큰 값 교체) → 1b(텍스트·테두리 토큰 교체) → 1c(채움 버튼 면) 순서로 진행해줘.

먼저 브랜치를 새로 파고, 1a 적용 전 Playwright 스냅샷을 확보한 다음 시작해.
1a~1c 는 한 PR 로 묶어줘 — 1a 만 적용된 상태는 대비 기준을 만족하지 않아.
```

작업 시작 전 상태 확인용:

```bash
git switch -c feature/design-system-figma
grep -rn "var(--color-primary)" src --include=*.scss | wc -l   # 교체 대상 파악
npm run storybook                                              # 육안 회귀 기준
npx playwright test                                            # before 스냅샷
```
