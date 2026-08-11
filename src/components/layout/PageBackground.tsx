/**
 * 화면 배경 선택 마커.
 *
 * Figma 는 화면 배경을 두 계열로 쓴다 (2026-08-11 전수 확인):
 *   기본 #FFFFFF — 폼·플로우 화면
 *                  (로그인/회원가입/온보딩/홈/설정/알림/편지쓰기/편지상세/
 *                   발송완료/유형테스트 질문)
 *   soft #F6F6F6 — 카드 목록 화면
 *                  (랭킹/편지함/마이페이지/도장책/저장한 우승지/장소상세/
 *                   토너먼트 전 단계/유형테스트 결과)
 *
 * 배경을 칠하는 면은 (main) layout 의 `.contentInner` 인데, 페이지는 그
 * 조상이라 CSS 변수로 위로 값을 올릴 수 없다. 그래서 페이지가 마커만 심고
 * layout 이 `:has([data-page-bg='soft'])` 로 받아 칠한다.
 *
 * `hidden` 이라 박스를 만들지 않아 레이아웃·간격에 영향이 없다. 페이지의
 * 로딩/에러/빈 상태 분기마다 붙일 필요가 없도록 page.tsx(서버 컴포넌트)에
 * 한 번만 둔다 — 상태 전환 시 배경이 깜빡이지 않는다.
 */
export function PageBackground({ variant = 'soft' }: { variant?: 'soft' }) {
  return <span data-page-bg={variant} hidden />;
}
