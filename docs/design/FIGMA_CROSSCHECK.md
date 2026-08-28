# Figma ↔ 소스 컴포넌트 크로스체크

**작성 2026-08-28** · Figma fileKey `Kjxpfmi9KqYGJTJEbj7ue6` (페이지 `컴포넌트` = `0:1`) · 브랜치 `dev` @ `a845748`

목적: Figma 컴포넌트 세트와 소스 컴포넌트를 **이름 단위로 대조**해 누락·중복·표류를 드러낸다.
이 문서는 **관측 결과만** 담는다. 수정은 별건으로 진행한다.

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

| Figma                                                 | 상태                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checkbox` (on/off, line, 20px)                       | **공통 컴포넌트 없음.** raw `<input type="checkbox">` 3곳 — [LetterComposeForm](src/features/letter/components/LetterComposeForm.tsx), [AgeConfirmStep](src/features/onboarding/components/AgeConfirmStep.tsx), [ConsentBlock](src/features/onboarding/components/ConsentBlock.tsx) |
| `tripTypeIcon` (36/52 × challenge/explore/rest/taste) | 소스 참조 0건. 여행유형 화면은 이모지(`emoji-c`)로 대체 중                                                                                                                                                                                                                          |
| `themeIcon` (36 × season/dice)                        | 소스 참조 0건. [ThemeKindSelector](src/features/tournament/components/ThemeKindSelector.tsx) 는 자체 `big-card` 만                                                                                                                                                                  |
| `bottomModalIcon` (camera/photo/profile)              | [ProfileCard](src/features/mypage/components/ProfileCard.tsx) 가 `cameraIcon`/`profileIcon` 을 별도 참조 — `photo` 미대응                                                                                                                                                           |

### 1-E. Figma 세트 2개 → 소스 1개

`input` (라벨 없는 필드 단독, 6변형) 과 `inputField` (라벨+헬퍼 래퍼, 15변형) 가 **별도 세트**인데 소스는 `TextField` 하나로 통합. 통합 자체는 타당하나, Figma 의 `state=done`(`auth_chk`) 처럼 `inputField` 에만 있는 상태가 소스에 매핑돼 있는지는 미검증.

### 1-F. 소스에만 있음 (디자인 대응 없음)

인프라성(Skeleton·Toaster·AsyncSection·SegmentError·ComingSoon·PageBackground·OptimizedImage 등)은 정상. 다만 **디자인 대응이 필요할 수 있는데 Figma 에 없는** 것:

`RadioGroup` · `IconButton` · `Card` · `WeekLabel` · `ButtonGrid` · `MediaThumb`

---

## 2. 디자인 실측 차이

### 2-A. `button` (3341:23) — 실측 완료 🔴

Figma 변형 축: `size` 52/36 · `state` default/disabled · `style` solid/line · `color` **Green/Accent/Gray** · `type` Default/icon (12변형).

| #   | 항목            | Figma                                             | 소스                                                                                                                                                                 | 판정                                              |
| --- | --------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | **Accent 버튼** | `color=Accent` solid, 52px·36px 2변형 (`#F79D26`) | `ButtonVariant` 에 accent 없음                                                                                                                                       | 🔴 **미구현**                                     |
| 2   | lg 폰트 굵기    | solid = `SB_16_140%` (SemiBold **600**)           | `.s-lg` 가 `font-weight: medium`(500) 강제 → `.v-primary` 는 weight 미지정이라 그대로 적용                                                                           | 🔴 `size="lg" variant="primary"` 가 시안보다 얇음 |
| 3   | disabled 표현   | 전용 색 — bg `#E0E0E0` + text `#B4B4B4`           | `opacity: 0.45` 를 variant 색에 곱함                                                                                                                                 | ⚠️ 메커니즘 상이 (결과색 불일치)                  |
| 4   | 사이즈 단계     | 52 / 36 두 단계                                   | `sm`=36, `md`=52, `lg`=52 (md·lg 동일)                                                                                                                               | ⚠️ lg 는 별칭. 의도된 매핑이나 API 혼동           |
| 5   | 주석 정확성     | —                                                 | [button.tsx:13](src/components/ui/button.tsx:13) 주석 "sm(32)/md(44)/lg(52)" — 실제 36/52                                                                            | 🔴 주석 오류                                      |
| 6   | 죽은 CSS        | —                                                 | `.v-outline`·`.v-outlinePrimary` 가 `ButtonVariant`(primary\|secondary\|ghost\|danger) 에 없어 **도달 불가**. `Button.module.scss` 를 import 하는 건 `button.tsx` 뿐 | 🔴 dead CSS 2블록 (2026-06-23/24 실측 잔재)       |

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

`header`(7 type) · `nav`(5탭) · `checkbox` · `wideTabMenu` · `notiCircle` · `circle` · `seasonIcon` · `tripTypeIcon` · `DestinationCard` · `trip-bite-logo` — **이름 매핑만 완료, 픽셀 실측 미완.**

---

## 3. 디자이너 요청 항목 (Figma 쪽 정리)

1. **토큰 카탈로그 라벨 stale** — spring/winter/border 스와치 텍스트가 variable 실값과 다름 (§0-2)
2. **오타** — `emptyItme`·`authItme` (→ `Item`), `letterBox` 의 prop `pagenation` (→ `pagination`), `themeIcon` 의 prop `neme` (→ `name`)
3. **세트명** — `chip-on` → `chip` (on/off 는 state 축이므로)
4. **빈 노드** — `3674:4157` 이름 `Frame` 16×16 빈 프레임이 캔버스에 남아 있음
5. **다크 모드 미정의** — 여전히 라이트만 정의. 코드는 `_dark.scss` 에서 파생 중

---

## 4. 우선순위 제안

| 순위 | 항목                       | 근거                                           |
| ---- | -------------------------- | ---------------------------------------------- |
| 1    | `button` 2-A #2, #5, #6    | 코드 내부 모순 — 시안 확인 없이 즉시 수정 가능 |
| 2    | `checkbox` 컴포넌트 신설   | raw input 3곳, 시안 컴포넌트 존재, a11y 이득   |
| 3    | `circle` 공통화            | 6곳 중복이 계속 벌어짐                         |
| 4    | `button` accent variant    | 시안에 있으나 미구현 — 사용처 기획 확인 후     |
| 5    | §2-D 픽셀 실측             | header/nav 부터 (전 화면 공통)                 |
| 6    | `tripTypeIcon`/`themeIcon` | 에셋 export 필요                               |

§2-A #3(disabled 메커니즘), #4(lg 별칭), §2-B(chip 매핑)는 **기획·디자이너 판단 필요** — 임의 변경하지 않는다.
