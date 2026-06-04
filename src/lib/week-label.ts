/**
 * 현재 시점의 "M월 N주차" 라벨용 데이터.
 *
 * 주차 계산 방식:
 *   - 해당 월 1일을 포함하는 주를 1주차로 간주
 *   - 단순 ceil(day / 7) — 월요일 시작 등 정밀 ISO 주차는 BE 가 제공할 때 교체
 *
 * 사용처:
 *   - /ranking 페이지 상단 "M월 N주차 · 매주 월요일 업데이트"
 *
 * BE 가 명시 주차 정보를 내려주면 그 값을 우선 사용 (props 로 전달).
 */
export function currentWeekLabel(now: Date = new Date()): {
  month: number;
  week: number;
} {
  return {
    month: now.getMonth() + 1,
    week: Math.ceil(now.getDate() / 7),
  };
}
