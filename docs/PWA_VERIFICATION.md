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
- [ ] 홈 아이콘 → 앱 진입 → splash screen 표시 (manifest background_color)
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

- **운영 진입 직전**: A~F 전체 1회 (필수)
- **주요 SW 변경 시**: E (SW / 오프라인) 재검증
- **새 push type 추가 시**: D (push 발송) 재검증
- **iOS 메이저 업그레이드 (예: iOS 17 → 18)**: A + D 재검증
- **새 디자인 시안 적용 시**: A-3 (16px font) + F-2 (status bar) 재검증
