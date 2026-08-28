# Figma ↔ 소스 컴포넌트 크로스체크

**작성 2026-08-28** (조사 기준 `dev` @ `a845748`) · Figma fileKey `Kjxpfmi9KqYGJTJEbj7ue6` (페이지 `컴포넌트` = `0:1`)

**갱신 2026-08-28** — 조사 이후 착수분 반영. 해소된 항목은 표에 커밋 해시를 달았다.

목적: Figma 컴포넌트 세트와 소스 컴포넌트를 **이름 단위로 대조**해 누락·중복·표류를 드러낸다.

---

## 0. 먼저 정리된 사실

### 0-1. fileKey 는 `Kjxpfmi9KqYGJTJEbj7ue6` 가 현행

세 개가 돌아다니고 있었다:

| fileKey                  | 상태                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `Kjxpfmi9KqYGJTJEbj7ue6` | **현행.** CLAUDE.md 기재값. `맑은 잎새 토큰` 프레임 + primary `#00B334` 포함                                                         |
| `yFsjSKDp5vihlQKbRqCC6L` | 같은 노드 ID 체계를 가진 **구 사본.** 예: `toggle` 이 `Kjxp` 는 `y=3081`, `yFsj` 는 `y=2891` — 이후 캔버스 정리가 `Kjxp` 에만 반영됨 |
| `bsBXcYOCwY2oIGiwm8tZm2` | 접근 권한 없음 (구 파일)                                                                                                             |

→ 세션 메모리에 `yFsj…` 로 적혀 있던 것은 **오래된 값**. 앞으로 `Kjxp…` 를 쓴다.

### 0-2. 색 토큰 레이어는 이미 동기 완료 — 재작업 불필요

`get_variable_defs` 로 **variable 실값**을 뽑아 대조한 결과, 코드 토큰과 전부 일치한다.

| Figma variable                | 실값      | 소스 토큰                           | 판정                                                                           |
| ----------------------------- | --------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| `Basic/MainColor/primary`     | `#00B334` | `--color-primary` `#00b334`         | ✅                                                                             |
| `Basic/MainColor/accent`      | `#F79D26` | `--color-accent` `#f79d26`          | ✅                                                                             |
| `Basic/MainColor/secondary01` | `#EAF6EF` | `_reset.scss` desktop 여백 배경     | ✅                                                                             |
| `Basic/TextColor/fg`          | `#151515` | `--color-fg`                        | ✅                                                                             |
| `Basic/TextColor/muted`       | `#393939` | `--color-muted`                     | ✅                                                                             |
| `Basic/TextColor/sub`         | `#8a8a8a` | `--color-fg-weak`                   | ✅                                                                             |
| `Basic/TextColor/disabled`    | `#B4B4B4` | `--color-text-disabled`             | ✅                                                                             |
| `Basic/BorderColor/gray`      | `#E0E0E0` | `--color-border`                    | ✅                                                                             |
| `Basic/BgColor/disabled`      | `#F1F1F1` | `surface-elevated` (fg 6% mix)      | ✅                                                                             |
| `Contents/Button/disabled`    | `#E0E0E0` | `--color-disabled`                  | ✅                                                                             |
| `Contents/Season/spring`      | `#ffebeb` | `--accent-spring-surface` `#ffebeb` | ✅                                                                             |
| `Contents/Season/summer`      | `#E0FF89` | `--accent-summer-surface`           | ✅                                                                             |
| `Contents/Season/autumn`      | `#FFCD99` | `--accent-autumn-surface`           | ✅                                                                             |
| `Contents/Season/winter`      | `#E8F1FD` | `--accent-winter-surface` `#e8f1fd` | ✅                                                                             |
| `Basic/System/error`          | `#E1493C` | `--color-danger` `#dc2626`          | ⚠️ **의도적 이탈** — `#E1493C` 는 흰 배경 4.02:1 로 AA 미달. HANDOFF.md 결정 2 |

> ⚠️ **함정 주의.** 토큰 카탈로그의 **스와치 라벨 텍스트가 stale** 하다. 라벨만 보면 spring `#FBE4E4`, winter `#E9F0F9`, border `#C6C6C6` 로 적혀 있어 "코드가 틀렸다" 고 오판하게 된다. **variable 이 SoT** 이고, variable 기준으로는 코드가 맞다.
> → 디자이너 요청 항목: 카탈로그 라벨 텍스트를 variable 실값으로 갱신.

즉 남은 표류는 전부 **컴포넌트 레이어**에 있다.

---

## 1. 이름 매핑 — Figma 컴포넌트 세트 38개

Figma 이름 → 소스. 근거는 소스 주석에 이미 박혀 있는 `Figma \`<name>\`` 레퍼런스.

### 1-A. 1:1 대응 있음 (17)

| Figma                   | 소스                                                                                                                                                                    | 비고                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `button`                | [button.tsx](src/components/ui/button.tsx)                                                                                                                              | §2-A 참조                    |
| `DestinationCard`       | [DestinationCard.tsx](src/components/ui/DestinationCard.tsx)                                                                                                            | Figma `IsDesc` 3변형         |
| `heroCard`              | [HeroCard.tsx](src/components/ui/HeroCard.tsx)                                                                                                                          | `align="center"`             |
| `visualCard`            | HeroCard `align="bottom"` + [Top5Card](src/features/ranking/components/Top5Card.tsx) + [MatchupCard](src/features/tournament/components/MatchupCard.tsx)                | 1 Figma 세트 → 3 소스        |
| `inputField`            | [TextField.tsx](src/components/ui/TextField.tsx)                                                                                                                        | §2-C                         |
| `toggle`                | [Toggle.tsx](src/components/forms/Toggle.tsx)                                                                                                                           | on/off 일치                  |
| `chip-on`               | [Chip.tsx](src/components/ui/Chip.tsx)                                                                                                                                  | §2-B                         |
| `nav` + `navIcon`       | [BottomNav.tsx](src/components/layout/BottomNav.tsx)                                                                                                                    | 5탭                          |
| `header` + `headerIcon` | [AppHeader](src/components/layout/AppHeader.tsx) / [SubHeader](src/components/layout/SubHeader.tsx) / [AuthHeader](src/components/layout/AuthHeader.tsx) + HeaderSwitch | 1 세트(7 type) → 3 소스      |
| `modal`                 | [Dialog.tsx](src/components/ui/Dialog.tsx)                                                                                                                              | 기본/nickName/pw             |
| `emptyItme`             | [EmptyState.tsx](src/components/feedback/EmptyState.tsx)                                                                                                                | Figma 오타 (Itme)            |
| `authItme`              | [AuthHero.tsx](src/features/auth/components/AuthHero.tsx)                                                                                                               | Figma 오타                   |
| `letterItem`            | [LetterRowCard.tsx](src/features/letter/components/LetterRowCard.tsx)                                                                                                   |                              |
| `letterBox`             | [LetterPaper](src/features/letter/components/LetterPaper.tsx) + [PinLikeInput](src/features/letter/components/PinLikeInput.tsx)                                         | Figma prop 오타 `pagenation` |
| `seasonIcon`            | [SeasonIcon.tsx](src/components/ui/SeasonIcon.tsx)                                                                                                                      | 36/64                        |
| `cateIcon`              | [Illustration.tsx](src/components/brand/Illustration.tsx)                                                                                                               | festival/tour/experience     |
| `trip-bite-logo`        | [LogoMark.tsx](src/components/brand/LogoMark.tsx)                                                                                                                       | 4변형                        |

### 1-B. 아이콘 세트 → 스프라이트로 흡수 (6)

`public/icons.svg` + [Icon.tsx](src/components/icon/Icon.tsx) 가 커버. 컴포넌트화 대상 아님.

`circleIcon` · `headerIcon` · `detailIcon` · `bookmarkIcon` · `IC-right`(→ `right-20`/`chevron-right`) · `eyeIcon`(→ [EyeGlyph.tsx](src/components/icon/EyeGlyph.tsx))

### 1-C. Figma 에만 있음 — 소스는 화면별 인라인 (6) ⚠️

공통 컴포넌트 없이 각 화면 SCSS 에 개별 구현돼 있다. **재사용 불가 + 화면별 표류 위험**이 실재.

| Figma                                        | 현재 구현 위치                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 문제                                                            |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `circle` (96/84/72 × 7종)                    | [EmptyState.module.scss](src/components/feedback/EmptyState.module.scss), [AuthHero](src/features/auth/components/AuthHero.module.scss), [LocationStep](src/features/onboarding/components/LocationStep.module.scss), [Top5Card](src/features/ranking/components/Top5Card.module.scss), [SelectCard](src/features/tournament/components/SelectCard.module.scss), [TournamentHistorySection](src/features/mypage/components/TournamentHistorySection.module.scss) | **6곳 중복**                                                    |
| `notiCircle` (44px × letter/master × on/off) | [NotificationsClient](<src/app/(main)/notifications/_components/NotificationsClient.module.scss>) 인라인                                                                                                                                                                                                                                                                                                                                                         |                                                                 |
| `notiIcon` (360×76 행 × 4변형)               | 동일 파일 인라인                                                                                                                                                                                                                                                                                                                                                                                                                                                 |                                                                 |
| `wideTabMenu` (get/send/save)                | [LetterIndex.module.scss](<src/app/(main)/letter/_components/LetterIndex.module.scss>) 인라인                                                                                                                                                                                                                                                                                                                                                                    | [Tabs](src/components/ui/Tabs.tsx) 는 headless 라 스타일 미포함 |
| `progCard` (on/off)                          | [StampsClient.module.scss](<src/app/(main)/mypage/stamps/_components/StampsClient.module.scss>) 인라인                                                                                                                                                                                                                                                                                                                                                           |                                                                 |
| `typeTestItem` / `typeTextResultItem`        | [TravelTypeQuiz](src/features/ranking/components/TravelTypeQuiz.module.scss) / [TravelTypeResult](src/features/ranking/components/TravelTypeResult.module.scss) 인라인                                                                                                                                                                                                                                                                                           |                                                                 |

### 1-D. Figma 에만 있음 — 소스에 대응 전무 (4) 🔴

| Figma                                                 | 상태                                                                                                                                                                                                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checkbox` (on/off, line, 20px)                       | ✅ **해소** — [Checkbox.tsx](src/components/forms/Checkbox.tsx) 신설, raw input 3곳 전부 교체 (LetterComposeForm / AgeConfirmStep / ConsentBlock). 20×20 · radius 4 · off `#E0E0E0` 1px · on `#00B334` + 흰 체크(stroke 2.8) 실측 일치 |
| `tripTypeIcon` (36/52 × challenge/explore/rest/taste) | 소스 참조 0건. 여행유형 화면은 이모지(`emoji-c`)로 대체 중                                                                                                                                                                             |
| `themeIcon` (36 × season/dice)                        | 소스 참조 0건. [ThemeKindSelector](src/features/tournament/components/ThemeKindSelector.tsx) 는 자체 `big-card` 만                                                                                                                     |
| `bottomModalIcon` (camera/photo/profile)              | [ProfileCard](src/features/mypage/components/ProfileCard.tsx) 가 `cameraIcon`/`profileIcon` 을 별도 참조 — `photo` 미대응                                                                                                              |

### 1-E. Figma 세트 2개 → 소스 1개

`input` (라벨 없는 필드 단독, 6변형) 과 `inputField` (라벨+헬퍼 래퍼, 15변형) 가 **별도 세트**인데 소스는 `TextField` 하나로 통합. 통합 자체는 타당하나, Figma 의 `state=done`(`auth_chk`) 처럼 `inputField` 에만 있는 상태가 소스에 매핑돼 있는지는 미검증.

### 1-F. 소스에만 있음 (디자인 대응 없음)

인프라성(Skeleton·Toaster·AsyncSection·SegmentError·ComingSoon·PageBackground·OptimizedImage 등)은 정상. 다만 **디자인 대응이 필요할 수 있는데 Figma 에 없는** 것:

`RadioGroup` · `IconButton` · `Card` · `WeekLabel` · `ButtonGrid` · `MediaThumb`

---

## 2. 디자인 실측 차이

### 2-A. `button` (3341:23) — 실측 완료 🔴

Figma 변형 축: `size` 52/36 · `state` default/disabled · `style` solid/line · `color` **Green/Accent/Gray** · `type` Default/icon (12변형).

| #   | 항목            | Figma                                             | 소스                                                                                                                                                                 | 판정                                                          |
| --- | --------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | **Accent 버튼** | `color=Accent` solid, 52px·36px 2변형 (`#F79D26`) | `ButtonVariant` 에 accent 없음                                                                                                                                       | 🔴 **미구현**                                                 |
| 2   | lg 폰트 굵기    | solid = `SB_16_140%` (SemiBold **600**)           | `.s-lg` 가 `font-weight: medium`(500) 강제 → `.v-primary` 는 weight 미지정이라 그대로 적용                                                                           | 🔴 미해소 — 브라우저 실측 확인(온보딩 "다음" 버튼 계산값 500) |
| 3   | disabled 표현   | 전용 색 — bg `#E0E0E0` + text `#B4B4B4`           | `opacity: 0.45` 를 variant 색에 곱함                                                                                                                                 | ⚠️ 메커니즘 상이 (결과색 불일치)                              |
| 4   | 사이즈 단계     | 52 / 36 두 단계                                   | `sm`=36, `md`=52, `lg`=52 (md·lg 동일)                                                                                                                               | ⚠️ lg 는 별칭. 의도된 매핑이나 API 혼동                       |
| 5   | 주석 정확성     | —                                                 | [button.tsx:13](src/components/ui/button.tsx:13) 주석 "sm(32)/md(44)/lg(52)" — 실제 36/52                                                                            | ✅ 해소 (`7073efc`)                                           |
| 6   | 죽은 CSS        | —                                                 | `.v-outline`·`.v-outlinePrimary` 가 `ButtonVariant`(primary\|secondary\|ghost\|danger) 에 없어 **도달 불가**. `Button.module.scss` 를 import 하는 건 `button.tsx` 뿐 | ✅ 해소 (`7073efc`) — 2블록 삭제                              |

6번 부연: 해당 블록의 주석은 Figma "설정 cancel/logout"(outline)과 "결과 → 마이페이지에 저장"(outlinePrimary) 패턴을 구현했다고 적혀 있으나, 결과 화면은 현재 `variant="secondary"`+`variant="ghost"` 로 렌더된다([TournamentResultClient.tsx:141](<src/app/(main)/tournament/result/_components/TournamentResultClient.tsx:141>)). 즉 **시안 패턴이 화면에서 사라졌거나, 다른 variant 로 대체됨** — 어느 쪽인지 기획 확인 필요.

### 2-B. `chip-on` (3401:1095) — 이름/축 불일치 ⚠️

|        | Figma                                            | 소스                                                                     |
| ------ | ------------------------------------------------ | ------------------------------------------------------------------------ |
| 세트명 | `chip-on` (on/off 를 담은 세트인데 이름에 `-on`) | `Chip`                                                                   |
| 변형축 | `state` on/off (2)                               | `variant` default/primary/outline/subtle/solid (5) × `size` xs/sm/md (3) |

소스가 시안보다 넓은 건 정당할 수 있으나, **Figma on/off 가 소스 어느 variant 인지 매핑이 문서화돼 있지 않다**. `chip-on` 세트명은 디자이너 정리 대상.

### 2-C. `input` / `inputField` — 미실측

변형 21개(6+15). `state=done`, `name=auth_chk`/`auth_pw` 계열의 소스 매핑 확인 필요. 이번 라운드 범위 밖.

### 2-D. 미실측 항목

`header`(7 type) · `nav`(5탭) · `wideTabMenu` · `notiCircle` · `circle` · `seasonIcon` · `tripTypeIcon` · `DestinationCard` · `trip-bite-logo` — **이름 매핑만 완료, 픽셀 실측 미완.**

---

## 3. 아이콘 스프라이트 — 별건 발견 (checkbox 작업 중)

`checkbox` 구현을 위해 `npm run build:icons` 를 돌리자 **커밋된 `public/icons.svg` 가 스크립트보다 26심볼 뒤처져 있었다** (커밋 39 / 스크립트 생성 65).

### 3-1. 빈 아이콘으로 렌더되던 6종 🔴

`build-icons.mjs` 레지스트리에는 있는데 커밋된 스프라이트에는 심볼이 없어 `<use href="/icons.svg#...">` 가 아무것도 못 찾던 이름들:

| 이름           | 참조 | 대표 위치                |
| -------------- | ---- | ------------------------ |
| `noti`         | 2곳  | NotificationsClient      |
| `heart-fill`   | 2곳  | Button.stories 외        |
| `location`     | 2곳  | Dialog.stories 외        |
| `trophy-large` | 2곳  | TournamentHistorySection |
| `award`        | 1곳  | EmptyState.stories       |
| `ticket`       | 1곳  | WinnerDetailPanel        |

재생성으로 해소. 안전성 확인:

- `IconName` union(60종) ⊆ 새 스프라이트(65종) → **깨지는 참조 0**
- 제거된 `map-pin`·`heart` 는 union·코드 참조 모두 0건
- 실제로 렌더가 바뀌는 아이콘은 **`trending-up` 하나뿐**이고, 이 이름은 `Icon.stories` 에서만 쓴다(BottomNav 랭킹 탭은 `flame` — `constants/routes.ts:44`). → **사용자에게 보이는 아이콘 회귀 없음**

> ⚠️ 이 문서 최초 작성 시 "심볼 5개 body 가 바뀐다(육안 확인 필요)" 고 적었으나 **오류**였다. 스프라이트에 `back`·`bookmark-on`·`camera`·`compass` 4종의 **symbol id 가 중복** 생성돼 있었고(FIGMA_ICONS + ICONS 양쪽 등록), 비교 스크립트가 **마지막** occurrence 를 봤다. 브라우저는 **첫** occurrence 를 쓰므로 그 4종은 바뀌지 않는다. 중복 자체는 `cb70763` 에서 제거(FIGMA_ICONS 우선, 61종·중복 0·시각적 변화 0).

### 3-2. `COLOR_PATTERN` 이 2색 아이콘을 망친다 ⚠️

`build-icons.mjs` 의 `COLOR_PATTERN` 은 흰색·primary 를 일괄 `currentColor` 로 치환한다. 단색 글리프에는 맞지만 **2색 아이콘에는 파괴적**이다:

```
checkbox-on  → <rect fill="currentColor"/> + <path stroke="currentColor"/>   // 박스·체크 같은 색 = 체크 안 보임
checkbox-off → <rect fill="currentColor" stroke="#E0E0E0"/>                  // 박스가 텍스트색으로 칠해짐 + border 다크 미대응
```

`#E0E0E0` 는 `COLOR_PATTERN` 에 아예 없어 하드코딩으로 남는다.

→ 그래서 `Checkbox` 는 이 두 심볼을 쓰지 않는다. **박스는 CSS 토큰, 체크만 단색 글리프(`check-20`, Figma export 패스 그대로)** 로 그렸다. `checkbox-on`/`checkbox-off` 는 레지스트리에 남아 있으나 사용 금지 — 쓰려면 COLOR_PATTERN 을 아이콘별 opt-out 으로 바꿔야 한다.

---

## 4. 디자이너 요청 항목 (Figma 쪽 정리)

1. **토큰 카탈로그 라벨 stale** — spring/winter/border 스와치 텍스트가 variable 실값과 다름 (§0-2)
2. **오타** — `emptyItme`·`authItme` (→ `Item`), `letterBox` 의 prop `pagenation` (→ `pagination`), `themeIcon` 의 prop `neme` (→ `name`)
3. **세트명** — `chip-on` → `chip` (on/off 는 state 축이므로)
4. **빈 노드** — `3674:4157` 이름 `Frame` 16×16 빈 프레임이 캔버스에 남아 있음
5. **다크 모드 미정의** — 여전히 라이트만 정의. 코드는 `_dark.scss` 에서 파생 중

---

## 5. 우선순위 제안

| 순위 | 항목                       | 근거                                                 |
| ---- | -------------------------- | ---------------------------------------------------- |
| ✅   | `button` #5·#6, `checkbox` | 완료 (`7073efc`, Checkbox 신설)                      |
| 1    | 스프라이트 5심볼 육안 확인 | §3-1 — 재생성으로 body 가 바뀐 아이콘                |
| 2    | `circle` 공통화            | 6곳 중복이 계속 벌어짐                               |
| 3    | `button` #2 lg 굵기        | 1줄이나 `size="lg"` 호출부 25곳+ → 화면 실측 필요    |
| 4    | `button` accent variant    | 시안에 있으나 미구현 — 사용처 기획 확인 후           |
| 5    | §2-D 픽셀 실측             | header/nav 부터 (전 화면 공통)                       |
| 6    | `tripTypeIcon`/`themeIcon` | 에셋 export 필요                                     |
| 7    | `COLOR_PATTERN` opt-out    | §3-2 — 2색 아이콘을 스프라이트로 못 넣는 구조적 제약 |

§2-A #3(disabled 메커니즘), #4(lg 별칭), §2-B(chip 매핑)는 **기획·디자이너 판단 필요** — 임의 변경하지 않는다.
