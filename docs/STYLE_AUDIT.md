# 디자인 적용 현황 (갱신: 2026-05-30)

토큰 / Primitive 시스템 광역 sweep 완료 — raw 잔존 0 또는 의미상 unique 도메인 토큰으로 분리.

> 디자인/퍼블리싱 가이드는 [`STYLES.md`](./STYLES.md) 참조.

---

## 🟡 남은 잔존 — 의도된 unique 만

### Drop-shadow (3건)

- **ComposeEntryCard `0 6px 12px rgba(0,0,0,0.15)`** — drop-shadow-md(0 4px 8px) 보다 크고 -lg(0 4px 6px) 와도 다른 unique size. 컴포넌트 한정 1곳.
- **LuckyLadder `0 0 4px` / `0 2px 6px` / `0 1px 4px var(--color-primary-ring)`** — primary-ring 글로우 효과. 이미 token 사용 + size 가 unique.

### `<button>` 직접 사용 (38곳, 의도)

primitive 신설 대신 자체 module 로 디자인 시스템화 — 시각 효과 동일.

- `LetterActions` (3) — `.action / .liked / .saved / .danger` 자체 SCSS, toggle aria-pressed.
- `Install/PwaUpdateBanner` (5) — `Banner.module.scss` 의 `.action / .close` 통합.
- `AccountSettings/Actions` (6) — `SettingsRows.module.scss` 의 `.button / .row / .danger` 토큰 기반.
- `Carousel` dot/arrow (5) — 내부 미니멀 UI, primitive 부적합.
- 그 외 — 자체 module 또는 `cardClasses` 합성.

새 화면에서 동일 패턴이 필요해지면 `_mixins.scss` 에 추출 권장 (현재는 단일 사용처라 보류).

### i18n 미적용 (운영 결정 대기, 4건)

- `dev/CatalogClient` — dev 도구 한정.
- `policy/privacy <li>` 자리잡이 — 법무 검토 후.
- `시행일자: 2024-01-01` — 한국 우선 운영.
- `TripBite · 여행 유형 테스트` — 브랜드명 + 한국 운영.

---

## 🔧 디자인 입히기 인프라 — 현재 상태

| 영역               | 가용 토큰 / Primitive                                                                                                                                                                                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color              | `--color-bg/-fg/-muted/-border/-primary*/-surface*/-divider/-hover*/-overlay/-glass`, `--color-letter-{accent/paper/cream}`, `--color-on-strong`, `--accent-{spring/summer/autumn/winter/festival}` (+ grad-start/end), `--accent-{red/amber/green/blue/violet}`, `--chart-1 ~ -8` |
| Shadow             | `--shadow-{sm/md/lg/card/card-strong/pop/emphasis}`, `--drop-shadow-{icon/icon-strong/xs/sm/md/lg/petal}`, `--text-shadow-soft`                                                                                                                                                    |
| Motion             | `--motion-{fast/base/slow/emphasis}`, `--ease-{out/spring}`                                                                                                                                                                                                                        |
| Spacing            | `--space-1 ~ -12` (4px grid)                                                                                                                                                                                                                                                       |
| Radius             | `--radius-{sm/md/lg/xl/full}`                                                                                                                                                                                                                                                      |
| z-index            | `--z-{base/elevated/header/bottom-nav/dropdown/banner/modal/toast}`                                                                                                                                                                                                                |
| Typography         | `--font-{display/h1/h2/h3/body/body-sm/label/caption/eyebrow}`, `--font-letter-{body/stamp-tag/envelope}`, `--font-tournament-{trophy/winner}`                                                                                                                                     |
| Emoji              | `--emoji-{sm/md/lg/xl/2xl/3xl/4xl}`                                                                                                                                                                                                                                                |
| Line / Tracking    | `--line-{display/tight/snug/normal/relaxed}`, `--tracking-{tight/snug/normal/wide/uppercase/emphasis/pin/pin-fill}`                                                                                                                                                                |
| Primitive 컴포넌트 | `Card`, `Chip`, `IconButton`, `PageSection`, `Button` (`@/components/ui`)                                                                                                                                                                                                          |
| Layout primitive   | `AuthLayout` (center/column), `PolicyArticle` + `PolicySection` + `PolicyFooter`                                                                                                                                                                                                   |
| 검출기             | `scripts/dead-css.mjs` (CI 통합 가능)                                                                                                                                                                                                                                              |

---

## 🟢 추후 작업 — brand-level 결정 후

토큰 / Primitive 인프라는 완비. 다음은 디자이너 결정 필요.

1. **dark mode 의 accent/letter-cream 색** — 현재 light 와 동일. 디자인 결정 후 별도 분기.
2. **차트 (recharts) 시리즈 색** — `--chart-2 ~ -8` 현재 default 톤. 브랜드 색 시리즈 결정 후 재배치.
3. ~~mobile-360 / 320 추가 토큰~~ — ✅ font-display / 도메인 font / emoji / space / header-h 모두 viewport 단계별 축소 토큰 추가. `_responsive.scss` 참조.
4. ~~`<button>` 38곳 primitive 화~~ — 자체 module 로 이미 토큰 기반 디자인 시스템화 완료. primitive 추가는 추상화만 늘고 시각 효과 X (결정 사유 위 카테고리에 명시).
