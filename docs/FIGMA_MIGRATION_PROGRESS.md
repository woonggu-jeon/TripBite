# Figma 마이그레이션 진행 상황 (2026-06-23)

각 화면/컴포넌트별 Figma spec 적용 상태. 정직 보고용.

## 범례

- ✅ 완료 (commit hash 명시)
- 🟡 부분 적용 (보류 사유 명시)
- ⏸ 보류 (사유 명시)
- ❌ 이상 발견 (Figma spec 모순 / 우리 코드 충돌)

---

## 설정 (Settings)

| 항목                                                | 상태                                      | 비고                                                                                |
| --------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------- |
| 헤더 (title 18 / settings rightSlot none)           | ⏸ title 16 → 18 보류                      | SubHeader 광범위 사용, 일괄 변경 시 다른 페이지 회귀 우려                           |
| 프로필 row (avatar 56 + badge)                      | ❌ Figma 외 (설정 spec에 프로필 row 없음) | settings 자체에는 프로필 row 없음 — mypage 패턴과 혼동 가능                         |
| 알림 3 row (push/inApp/letterReceived)              | ✅ `59adcd0`                              | letterLiked 제거 + push/inApp 노출                                                  |
| 계정 3 row (닉/비번/위치)                           | ✅ `59adcd0`                              | 차단 row 제거                                                                       |
| Toggle row (label SB_16 + caption R_12 muted)       | ✅ `8a1b068`                              | font-body + tracking-tight + line-snug-relaxed                                      |
| link row (flat horizontal, label + value + chevron) | ✅ `535f478`                              | boxed → flat 정합                                                                   |
| 로그아웃 button (outline)                           | ✅ `48c001d` + `92be751`                  | Button.v-outline border 1px stroke + color muted                                    |
| 회원탈퇴 button (border 없음 + danger color)        | ✅ `fa4a966`                              | Figma spec 의 두번째 button 은 border 명시 없음 — ghost variant + danger color 적용 |
| actionStack padding 20 all                          | ✅ `769c8b6`                              | bottom 0 회귀 정정                                                                  |

## 모달 (Dialog)

| 항목                                                              | 상태                     | 비고                                  |
| ----------------------------------------------------------------- | ------------------------ | ------------------------------------- |
| Dialog primitive (radius 12, border 0, padding 20, max-width 330) | ✅ `8e247de` + `979ad10` | Figma "card" 정합                     |
| Dialog title (Body B_16_140%)                                     | ✅ `8e247de`             | 이전 font-h3 ExtraBold 회귀 정정      |
| Dialog actions (gap 12, > button flex 1)                          | ✅ `8e247de`             | Frame 15 stretch 정합                 |
| NicknameEditDialog (cancel outline)                               | ✅ `48c001d`             | showCloseButton 제거 (Figma 외)       |
| ChangePasswordDialog (inline form + cancel outline)               | ✅ `23bafa1`             | ChangePasswordForm 제거, 2 button row |
| ConfirmDialog (cancel outline)                                    | ✅ `8e247de`             | 모든 dialog cancel 통일               |

## 알림 (Notifications)

| 항목                                                    | 상태                                                  | 비고                                      |
| ------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------- |
| Header (title B_18 + 전체읽음 right)                    | 🟡 title 16 (헤더 통일) / "모두 읽음" muted text 적용 | title font 보류 동일                      |
| 빈 상태 (84 circle + Bell 38 primary + Body B_16 title) | ✅ `1ea94f6`                                          | EmptyState variant=hero 추가              |
| 알림 목록 Item (notiCircle 44 + 3-line layout)          | ⏸ 보류                                                | SVG path 필요 + 3-line layout 명확화 필요 |

## 마이페이지 (MyPage)

| 항목                                                                              | 상태                           | 비고                                                                                             |
| --------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| Header (title B_18 + settings rightSlot 24)                                       | ✅ `8af1538` + `5080bb8`       | SubHeader 정합                                                                                   |
| pf (profile row) — avatar 56 + cam-badge + 닉 + badge "새내기 여행자"             | ✅ `93fa442`                   | ProfileCard 재설계 — 100→56, Card→row, TravelTypeField→badge                                     |
| sec-title (SB_16 + right Caption R_12 muted "X/Y")                                | ⏸ PageSection 광범위 영향 보류 | mypage 만 변경하려면 별도 컴포넌트 필요                                                          |
| stamp-banner (도장책 진입 — 99h white card border radius 12)                      | ✅ `0bc9651`                   | sage → flat white card + progress track 정합                                                     |
| saved-grid (DestinationCard 152×168 + heart-btn 28×28 right top)                  | ✅ `74cd549`                   | SavedTournamentCard 자체 markup (DestinationCard primitive 미사용) — image-first + heart overlay |
| empty-saved (320×148 white card + Title B_14 + Caption + primary button 280×52)   | ✅ `e10cc85`                   | 직접 분기 + 자체 markup                                                                          |
| empty-recent (320×60 white card + Title B_14 center only)                         | ✅ `e10cc85`                   |                                                                                                  |
| 최근 토너먼트 row (320×68 + circle 40 trophy 20 + title B_14 + meta Caption M_10) | ✅ `e10cc85`                   | seasonEmoji → Trophy primary-soft circle. meta Caption M_10.                                     |
| BottomNav (62/64h, 5 tab, MY active primary)                                      | ✅ `2fa24f3`                   | icon 24, label 10, active primary + bold                                                         |

## 마이페이지 — 프로필 사진 변경 (bottom sheet)

| 항목                                                              | 상태         | 비고                                                                       |
| ----------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------- |
| dim overlay (rgba(0,0,0,0.42))                                    | ✅ `2c1f831` | BottomSheet primitive 신규                                                 |
| profile-photo-sheet (360×375, radius 22 top, handle 80×4 #E0E0E0) | ✅ `2c1f831` | BottomSheet.tsx + .module.scss                                             |
| 카메라 / 갤러리 / 제거 옵션 row (40 circle + label)               | ✅ `2c1f831` | opt-person = 제거 매핑 (Figma 의도 추정 — 정직 보고: opt-person 의미 불명) |
| cancel button (outline)                                           | ✅ `2c1f831` | BottomSheet primitive 내장                                                 |
| ProfileCard onPick 동작 변경 — file picker → bottom sheet         | ✅ `2c1f831` | 카메라 capture / 갤러리 default / 제거 분기                                |
| cam-badge X → Camera icon                                         | ✅ `2c1f831` | 항상 노출 (이전 hasAvatar 시 만)                                           |

## 마이페이지 — 저장한 우승지 (상세)

| 항목                                                                     | 상태                               | 비고                                  |
| ------------------------------------------------------------------------ | ---------------------------------- | ------------------------------------- |
| Header (title 96w "저장한 우승지")                                       | ⏸                                  |                                       |
| 정렬 안내 (right "최근 저장 순")                                         | ⏸                                  |                                       |
| grid 2-col × N rows (DestinationCard 152×168 + heart-btn)                | ❌ Figma DestinationCard 패턴 다름 | image + name + region + heart overlay |
| 삭제 confirm modal (320×155 — Frame 18 title + caption + cancel/confirm) | ⏸                                  |                                       |

## 마이페이지 — 저장한 우승지 (빈 상태)

| 항목                                                                                                                                            | 상태   | 비고                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| ec frame (84 circle + heart 38 primary + Title B_24_130% "저장한 우승지가 없어요" + R_14 muted caption + primary button "토너먼트 시작" 320×52) | ⏸ 보류 | 큰 빈 상태 패턴 — EmptyState variant=hero 와 다름 (title B_24 vs B_16) |

## 마이페이지 — 충북 도장책

| 항목                                                                                                                  | 상태        | 비고                                    |
| --------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------- |
| Header (back + title 17 ExtraBold "충북 도장책")                                                                      | ⏸           | back chevron 시각 다름 (현재 SubHeader) |
| prog-card (white card border radius 12 padding 20 + B_24 primary count + B_18 fg total + B_14 progress + track 288×8) | ⏸ 신규      |                                         |
| prog-card 마스터 (border primary + caption primary "충북 마스터 달성!")                                               | ⏸           |                                         |
| map-card (cbmap SVG 288×380 + legend "방문/미방문")                                                                   | ❌ SVG 필요 | rate limit 풀리면                       |
| 진행/완료 시군 visual (primary-soft bg + primary border / white + disabled border)                                    | ⏸           | RegionStampMap 정합 필요                |

## 마이페이지 — 마스터 카드

| 항목                                                                               | 상태   | 비고 |
| ---------------------------------------------------------------------------------- | ------ | ---- |
| 360×447.9 linear-gradient(#1CE055 → #EDFEF4) + radius 20                           | ⏸ 신규 |      |
| circle 88 white + trophy 44 primary                                                | ⏸      |      |
| "CHUNGBUK MASTER" Inter Bold 13 letter-spacing 0.16em + "충북 마스터" ExtraBold 30 | ⏸      |      |
| msg-box (white card radius 14 padding 20/18 + medium 14 line-height 170% + center) | ⏸      |      |
| trip-bite-logo (28×25.9 logo + Title B_18)                                         | ⏸      |      |

---

## 진행 plan (이번 세션)

1. ✅ 회원탈퇴 border 제거 (긴급 회귀)
2. ✅ 문서 생성 (본 파일)
3. 🟡 ProfileCard 재설계 (avatar 56 + row + badge "새내기 여행자")
4. 🟡 마이페이지 빈 상태 카드 시각 정합 (saved/recent)

별도 turn (큰 작업):

- 도장책 페이지 정합
- 마스터 카드 신규
- 프로필 사진 변경 bottom sheet
- DestinationCard 패턴 정합 (image-first vs region-tone)
- 저장한 우승지 / 삭제 modal

## 이상 / 모순 발견

### ❌ stamp-banner Figma spec 모순

Figma "MY_01 마이페이지 빈 상태" 의 stamp-banner 에 `progress fill 240px` (= 240/280 ≈ 85%) 가 있는데 "빈 상태" spec 에서 progress 가 fill 되어 있는 게 부자연스러움. Figma 의 빈 상태 = 0/11 도장 진행 가정 시 fill 0 또는 작은 값이 정합. 사용자 확인 필요.

### ❌ Figma DestinationCard 패턴

Figma 의 DestinationCard (152×168) 는 image-first + name B_14 + region Caption M_10 + heart overlay (28×28 right:10 top:10). 우리 코드의 DestinationCard (region-tone + emoji + summary) 와 시각 패턴 다름.

- 옵션 A: Figma 패턴으로 DestinationCard 전면 교체 (광범위 영향)
- 옵션 B: 별도 SavedTournamentCard 패턴 (mypage 전용)

### ❌ 도장책 cbmap SVG 좌표 의존

Figma 의 충북 11개 시군 path 좌표가 % 단위로 명시. 우리 RegionStampMap 의 SVG path 와 좌표 일치 여부 확인 필요. 보통 다름 — 별도 SVG export 또는 Figma vector 받기.

### ⚠ BottomNav tab font 회귀

Figma BottomNav: tab font Caption/M_10 (10px Medium 500) active = B_10 (Bold 700) primary color. 우리 BottomNav font 확인 필요.

### ⚠ Header title 18 통일 미확정

Figma 의 모든 화면 header title B_18_140%. 우리 SubHeader 의 title 은 var(--font-body) = 16. 일괄 변경 시 시각 회귀 영향 광범. settings 외 다른 화면 spec 모두 확인 필요.
