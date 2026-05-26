/**
 * Haptic 피드백
 *
 * `navigator.vibrate` 추상화. 미지원 환경에선 silent no-op.
 *
 * 사용처:
 *   - tap(): 일반 버튼 / 카드 선택 (토너먼트 매치업 선택)
 *   - success(): 우승 확정 / 편지 전송 성공
 *   - warning(): 입력 오류 / 권한 거부
 *   - longPress(): (선택) 길게 눌렀을 때
 *
 * 비활성화 정책:
 *   - prefers-reduced-motion 사용자는 자동 off
 *   - 사용자 설정으로 끌 수 있게 추가 가능 (settings.account 에 토글)
 */

function isReduced(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  if (isReduced()) return;
  navigator.vibrate(pattern);
}

export const haptic = {
  tap: () => vibrate(10),
  success: () => vibrate([20, 50, 20]),
  warning: () => vibrate([50, 30, 50]),
  longPress: () => vibrate(30),
};
