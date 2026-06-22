# iOS PWA 실기기 매뉴얼 검증 체크리스트

운영 진입 전 iPhone / iPad 실기기로 직접 흐름 확인 — 자동화 (vitest / Playwright / axe) 가 cover 못하는 영역.

> 사전: Vercel preview 또는 운영 도메인 배포 + iPhone 12 / 14 / 15 / iPad 중 1개 (iOS 16.4+)

---

## 0. 셋업 (1회)

- [ ] 검증 URL: `https://<preview>.vercel.app` 또는 운영 도메인
- [ ] iPhone Settings → Safari → "JavaScript" ON, "Block All Cookies" OFF
- [ ] Safari 캐시 비우기 (이전 셋업 잔재 제거)
- [ ] Notification 권한 한 번 OS 단에서 reset (Settings → Notifications → Safari → Allow Notifications OFF)

---

## A. 가상 키보드 (Virtual Keyboard)

### A-1. 일반 입력 (모든 input 페이지)

- [ ] `/letter/compose` — input focus 시 카메라/하단 영역 가림 X
- [ ] `/login` — username + password input focus 시 submit button 보임 유지
- [ ] `/signup` — 6 필드 순차 focus 시 viewport 정상 스크롤
- [ ] `/settings` 의 nickname dialog 안 input — dialog 안에서 키보드 위에 input 위치
- [ ] `/quiz/result` 의 share dialog — keyboard 없음 (기대 동작)

### A-2. dvh / svh 동작

- [ ] 키보드 등장 시 `100dvh` 가 키보드 위까지 줄어 sticky bottom CTA 가림 X
- [ ] 키보드 닫힘 시 viewport 원상 복원
- [ ] 가로 모드 (landscape) 에서도 동일 동작

### A-3. iOS Safari 자동 확대 차단 (font-size ≥ 16px)

- [ ] input focus 시 화면 확대 X (모든 폼)
- [ ] 확대됐다면 → text-base 토큰 (1rem = 16px) 미적용 input 식별

---

## B. Pull-to-Refresh (스와이프 새로고침)

### B-1. PWA standalone 모드 (홈 화면 추가 후 실행)

- [ ] 홈 (`/`) 최상단 스와이프 다운 → **refresh 안 됨** (의도된 차단)
- [ ] `/letter` 최상단 스와이프 다운 → refresh 안 됨
- [ ] `/region` 최상단 스와이프 다운 → refresh 안 됨
- [ ] `/mypage` 최상단 스와이프 다운 → refresh 안 됨
- [ ] 내부 스크롤 (Dialog / carousel / InfiniteList) — 자체 스크롤 정상

### B-2. 일반 Safari 탭 (홈 추가 안 한 상태)

- [ ] 일반 탭에서 최상단 스와이프 다운 → **refresh 정상 동작** (Safari 기본)
  - 차단 정책이 standalone-only 라 일반 탭은 영향 X

### B-3. Edge case

- [ ] iOS 가로 모드 standalone — 동일 차단
- [ ] iPad standalone — 동일 차단
- [ ] Dialog 열려 있는 상태에서 swipe — backdrop 으로 chain 안 됨

---

## C. PWA 설치 (Install)

### C-1. iOS Safari (홈 화면 추가)

- [ ] 일반 Safari 탭에서 사이트 진입 → 헤더에 install banner 자동 노출
- [ ] InstallPromptBanner 의 iOS 가이드 텍스트 노출: "공유 → 홈 화면에 추가"
- [ ] Share 버튼 → 홈 화면에 추가 → 홈 아이콘 정상 생성 (manifest 의 icon-192/512)
- [ ] 홈 아이콘 → 앱 진입 → splash screen 표시 (`apple-touch-startup-image` + 디바이스별 PNG `/public/splash/*.png`, 디자인 로고 center + #ffffff 배경). 디바이스 매트릭스 추가 시 `scripts/generate-ios-splash.mjs` 의 DEVICES + `layout.tsx` 의 `startupImage` 동시 갱신.
- [ ] standalone 모드 표시 (URL bar 없음, 전체 화면)

### C-2. iOS PWA 진입 후

- [ ] `display-mode: standalone` 정상 인식 (push 권한 요청 가능 상태)
- [ ] 헤더 의 install banner 미노출 (이미 설치됨)
- [ ] 모든 페이지 정상 로드
- [ ] 안전 영역 (notch / home indicator) 정상 padding

### C-3. Android Chrome (참고)

- [ ] BeforeInstallPromptEvent → 자동 native prompt
- [ ] 홈 화면 추가 → standalone 진입 동일

---

## D. Web Push 알림

### D-1. iOS Safari standalone (필수 조건)

- [ ] 일반 Safari 탭에서 헤더 종 클릭 → /notifications 페이지 진입
- [ ] /notifications 에서 "푸시 알림 켜기" prompt — iOS standalone 미진입 시 **"홈 화면에 추가" 안내** 자동 분기
- [ ] 홈 화면 추가 → standalone 진입 → "푸시 알림 켜기" 클릭 → 브라우저 권한 dialog → 허용
- [ ] OS Settings → Notifications → 앱 이름 등록 확인

### D-2. 발송 검증 (mock 모드)

- [ ] PWA standalone 진입 → 우상단 📬 (MockPushTrigger, dev/mock 전용) 클릭
- [ ] OS 알림 토스트 표시 (Lock screen / Notification center)
- [ ] 알림 클릭 → 앱 진입 → `/letter/{id}` deep-link 정상
- [ ] 같은 tag 의 알림 연속 발송 → 마지막 1개만 표시 (OS 중복 합침)

### D-3. 발송 검증 (실 BE 모드, BE 운영 후)

- [ ] BE 가 `web-push.sendNotification` 호출 → iOS standalone 에 알림 수신
- [ ] 앱 닫힘 상태에서도 알림 수신
- [ ] 알림 클릭 → 앱 자동 진입 + 라우팅
- [ ] 권한 거부 후 OS 설정 재허용 → 다시 정상 수신

### D-4. Edge case

- [ ] 권한 거부 후 prompt 재노출 안 됨 (localStorage `tripbite.push-prompt.dismissed`)
- [ ] 일반 Safari 탭에서 권한 요청 silent fail → "홈 추가" 안내 자동 분기
- [ ] iOS 15 이하 → push 자체 미지원 안내
- [ ] Apple push service endpoint (`web.push.apple.com`) — BE TTL 짧게 (Apple 만료 빠름)

---

## E. SW (Service Worker) / 오프라인

### E-1. SW 업데이트 (PwaUpdateBanner)

- [ ] PWA 진입 → 새 빌드 push → 다음 진입 시 "새 버전이 있어요" banner 노출
- [ ] "새로고침" 클릭 → SKIP_WAITING → reload → 새 SW 활성
- [ ] cache 비워짐 확인 (이전 사용자 데이터 격리)

### E-2. 오프라인 동작

- [ ] WiFi 끄기 → 이전 방문 페이지 정상 표시 (SW cache)
- [ ] 새 API 호출 → 오프라인 banner 노출
- [ ] WiFi 다시 켜기 → 자동 복원

### E-3. 캐시 정책

- [ ] Pretendard 폰트 — 두번째 방문 시 즉시 표시 (1년 CacheFirst)
- [ ] TourAPI 이미지 — 30일 cache (재방문 즉시 표시)
- [ ] API 응답은 cache X (사용자별 데이터 격리)

---

## F. iOS PWA UX 잔여 점검

### F-1. Long-press / context menu

- [ ] 이미지 long-press → 다운로드 menu 노출 (의도된 동작)
- [ ] 텍스트 long-press → 복사 menu 노출
- [ ] 링크 long-press → 새 탭/공유 menu 노출

### F-2. Status bar

- [ ] PWA standalone — status bar 배경 색 일치 (manifest.json theme_color = `#0a0a0a`)
- [ ] dark / light 모드 전환 시 status bar 색 따라옴 (apple-mobile-web-app-status-bar-style)

### F-3. 사이트 진입 흐름

- [ ] 최초 진입 → /login → 로그인 후 / 진입
- [ ] 미인증 진입 → /login redirect (middleware)
- [ ] 온보딩 미완료 → /onboarding redirect
- [ ] 정상 사용자 → 홈 + dashboard 정상

### F-4. iOS Safari 알려진 버그

- [ ] sticky header — 스크롤 시 떨림 없음
- [ ] viewport 100dvh — 카카오/Naver 인앱 브라우저 toolbar 토글 시 떨림 없음 (svh fallback)
- [ ] sub-pixel rounding — Carousel 슬라이드 마지막 잘림 없음

---

## G. 결과 기록 템플릿

각 영역 검증 후 아래 형식으로 한 줄 기록 (이슈 발견 시 별도 GitHub Issue):

```
영역 | 결과 | 비고
--- | --- | ---
A-1. 가상 키보드 일반 입력 | ✅ | iPhone 14 iOS 17.4
A-2. dvh/svh | ✅ | 가로/세로 정상
A-3. 자동 확대 차단 | ✅ | 모든 폼 확대 X
B-1. PWA pull-to-refresh | ✅ | 차단 정상
B-2. 일반 탭 pull-to-refresh | ✅ | refresh 정상 (기대)
B-3. Edge | ✅ | landscape / iPad 정상
C-1. iOS 설치 | ✅ | 가이드 + 아이콘 + splash
C-2. PWA 진입 | ✅ | safe-area 정상
D-1. Push 권한 | ✅ | standalone 분기 정상
D-2. Push 발송 mock | ✅ | OS 알림 + deep-link
D-3. Push 발송 실 BE | 🟡 | BE 운영 후 검증
D-4. Push edge | ✅ | dismissed flag / 일반 탭 silent
E-1. SW 업데이트 | 🟡 | 운영 첫 push 후 검증
E-2. 오프라인 | ✅ | cache 정상
E-3. 캐시 정책 | ✅ | 폰트 / TourAPI 정상
F-1. Long-press | ✅ | 정상
F-2. Status bar | ✅ | 테마 따라옴
F-3. 진입 흐름 | ✅ | redirect 정책 OK
F-4. iOS 버그 | ✅ | sticky / dvh / sub-pixel
```

상태 범례: ✅ 통과 / ❌ 실패 (GitHub Issue 생성) / 🟡 BE 운영 후 / ⚪ N/A

---

## H. 검증 빈도

- **운영 진입 직전**: A~F 전체 1회 (필수) + I (Android) 1회
- **주요 SW 변경 시**: E (SW / 오프라인) 재검증
- **새 push type 추가 시**: D (push 발송) 재검증
- **iOS 메이저 업그레이드 (예: iOS 17 → 18)**: A + D 재검증
- **새 디자인 시안 적용 시**: A-3 (16px font) + F-2 (status bar) 재검증

---

## I. Android 추가 검증

사전: Pixel / 갤럭시 S / 폴드 중 1개. Chrome / **Samsung Internet** / **카카오 인앱 / Naver 인앱**.

### I-1. Android Chrome PWA

- [ ] 일반 Chrome 탭 진입 → 주소창에 install 아이콘 자동 노출 (`BeforeInstallPromptEvent`)
- [ ] InstallPromptBanner 의 "추가하기" → native install dialog → 추가
- [ ] 홈 아이콘 → 앱 진입 → `display-mode: standalone`
- [ ] 알림 권한 요청 → 허용 → mock push (📬) → OS 알림 + deep-link
- [ ] BackHandler — 시스템 뒤로가기 = router.back()
- [ ] pull-to-refresh — PWA standalone 차단 정상, 일반 탭은 refresh 정상

### I-2. Samsung Internet (한국 점유율 ↑)

- [ ] PWA install 동일 동작 (Chromium 기반)
- [ ] dark / light 자동 — Samsung 의 "야간 모드" 우선
- [ ] Samsung 알림 채널 (별도 권한 설정) 정상 등록
- [ ] 가로 모드 화면 회전 시 layout 정상
- [ ] 광고 차단 (Samsung 기본 옵션) ON 상태에서 정상 동작

### I-3. 카카오 / Naver 인앱 브라우저 (가장 흔한 진입 경로)

- [ ] 카카오톡 링크 → 인앱 브라우저 진입 → 페이지 정상 로드
- [ ] 인앱 브라우저는 PWA install 불가 — 사용자에게 **"Chrome 으로 열기"** 안내 (`MockModeBanner` 또는 별도 안내)
- [ ] SW 등록 제한 — `serviceWorker` API 일부 차단, 그래도 일반 fetch / 페이지 동작 OK
- [ ] 100dvh — toolbar 토글 시 떨림 없음 (svh fallback 작동 검증)
- [ ] 위치 권한 요청 — 인앱 정책상 OS 권한과 별개, Skip 흐름 정상
- [ ] 공유 — 카카오 자체 공유 ↔ 우리 share API 충돌 X

### I-4. Android 가상 키보드

- [ ] Chrome / Samsung — `interactiveWidget=resizes-content` 자동 동작, 100dvh 키보드 위까지 줄어듦
- [ ] iOS 와 달리 키보드 위 input fixed 동작 매끄러움 (`bottom: env(keyboard-inset-height)` 미적용이지만 dvh 로 충분)
- [ ] 한글 IME — 조합 중 input value 조작 X (PinLikeInput 의 grapheme clamp 검증)

### I-5. Android 알려진 issue

- [ ] Chrome 의 일부 버전 (114+) — `:focus-visible` outline 이 touch 후에도 보임 — 우리는 `touch-action: manipulation` + tap-highlight-color transparent 로 우회
- [ ] Samsung Internet 의 자동 폼 자동완성 — value 직접 변경 시 React state 와 sync 됨 검증
- [ ] Android 9 이하 (점유율 작지만 존재) — `100dvh` 미지원 → svh fallback 정상

### I-6. 결과 기록 (G 형식 동일)

```
영역 | 결과 | 비고
--- | --- | ---
I-1. Android Chrome PWA  | ✅ | Pixel 7 Android 14
I-2. Samsung Internet    | ✅ | S24 OneUI 6.1
I-3. 카카오/Naver 인앱   | ✅ | 인앱 제한 안내 노출
I-4. Android 가상키보드  | ✅ | dvh 자동
I-5. Android issue       | ✅ | 알려진 회피 패턴 적용
```
