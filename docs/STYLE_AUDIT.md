# 디자인 적용 현황 (갱신: 2026-05-30)

토큰 / Primitive 시스템 광역 sweep 완료. 잔존은 **의도된 unique 의도값**만 남음.

> 디자인/퍼블리싱 가이드는 [`STYLES.md`](./STYLES.md) 참조.

---

## 🟡 남은 unique 의도값 (보존)

토큰화 시 시각 변경 위험이 있거나 컴포넌트 한정 의도값이라 보존.

### Typography

- **`line-height: 1.1`** (`CountSelector`) — `--line-tight (1.2)` 와 0.1 차이로 큰 글씨에서 줄간격 시각 변경.
- **`letter-spacing: 0.25em`** (`LetterDetailClient .body`) — PIN 5칸 letter style 강제 spacing.
- **`letter-spacing: 1em`** (`PinLikeInput`) — PIN 5칸 강제 spacing.

### Drop-shadow

- **`ChungbukMap` `0 2px 3px rgba(0,0,0,0.18)`** — 지도 시군 path 작은 elevation.
- **`FallingPetals` `0 1px 2px rgba(60,110,180,0.25)`** — 꽃잎의 푸른 그림자 (rgba 색이 다른 unique 효과).
- **`LuckyLadder` drop-shadow** — `--color-primary-ring` 사용 (이미 토큰).

### `<button>` 직접 사용 (38곳, 모두 의도)

- `LetterActions` — `aria-pressed` toggle 액션 (Button variant 부적합).
- `Install/PwaUpdateBanner` — banner action+close (자체 module 잘 구조화).
- `AccountSettings/Actions` — settings row 패턴.
- `Carousel` dot / arrow, dropdown trigger, card 형태 selector — primitive 부적합 컨텍스트.

### i18n 미적용 (운영 결정 대기)

- `dev/CatalogClient` — dev 도구 한정.
- `policy/privacy <li>` 자리잡이 — 법무 검토 후.
- `시행일자: 2024-01-01` — 한국 우선 운영, 영문 운영 결정 후.
- `TripBite · 여행 유형 테스트` — 브랜드명 + 한국 운영 한정.

---

## 🔧 디자인 입히기 인프라 — 현재 상태

| 영역               | 가용 토큰 / Primitive                                                                                                                                                                                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color              | `--color-bg/-fg/-muted/-border/-primary*/-surface*/-divider/-hover*/-overlay/-glass`, `--color-letter-{accent/paper/cream}`, `--color-on-strong`, `--accent-{spring/summer/autumn/winter/festival}` (+ grad-start/end), `--accent-{red/amber/green/blue/violet}`, `--chart-1 ~ -8` |
| Shadow             | `--shadow-{sm/md/lg/card/card-strong/pop/emphasis}`, `--drop-shadow-{icon/icon-strong/xs/sm/md/lg}`, `--text-shadow-soft`                                                                                                                                                          |
| Motion             | `--motion-{fast/base/slow/emphasis}`, `--ease-{out/spring}`                                                                                                                                                                                                                        |
| Spacing            | `--space-1 ~ -12` (4px grid)                                                                                                                                                                                                                                                       |
| Radius             | `--radius-{sm/md/lg/xl/full}`                                                                                                                                                                                                                                                      |
| Typography         | `--font-{display/h1/h2/h3/body/body-sm/label/caption/eyebrow}`, `--font-letter-{body/stamp-tag/envelope}`, `--font-tournament-{trophy/winner}`                                                                                                                                     |
| Emoji              | `--emoji-{sm/md/lg/xl/2xl/3xl/4xl}`                                                                                                                                                                                                                                                |
| Line / Tracking    | `--line-{tight/snug/normal/relaxed}`, `--tracking-{tight/snug/normal/wide/uppercase/emphasis}`                                                                                                                                                                                     |
| Primitive 컴포넌트 | `Card`, `Chip`, `IconButton`, `PageSection`, `Button` (`@/components/ui`)                                                                                                                                                                                                          |
| Layout primitive   | `AuthLayout` (center/column), `PolicyArticle` + `PolicySection` + `PolicyFooter`                                                                                                                                                                                                   |
| 검출기             | `scripts/dead-css.mjs` (CI 통합 가능)                                                                                                                                                                                                                                              |

---

## 🟢 추후 작업 — brand-level 결정 후

토큰 / Primitive 인프라는 완비. 다음은 디자이너 결정 필요.

1. **dark mode 의 accent/letter-cream 색** — 현재 light 와 동일. 디자인 결정 후 별도 분기.
2. **차트 (recharts) 시리즈 색** — `--chart-2 ~ -8` 현재 default 톤. 브랜드 색 시리즈 결정 후 재배치.
3. **mobile-360 / 320 추가 토큰** — 매우 작은 viewport 의 별도 토큰 조정.

새 sweep 필요 시 `scripts/dead-css.mjs` 패턴으로 자동화 가능.
