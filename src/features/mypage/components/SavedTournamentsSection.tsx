'use client';

/**
 * <SavedTournamentsSection />
 *
 * 저장된 토너먼트 우승 여행지 카드 그리드 (최대 10개).
 *
 * 사양:
 *   - 각 카드: 여행지명, 카테고리, 우승 일시, 행운의 색 미니뱃지
 *   - 카드 클릭 시 결과 페이지 재진입
 *     (또는 모달로 정보+사다리타기 재현)
 *   - 카드 우상단 삭제 버튼 → useRemoveSavedTournament
 *   - 0개: empty state ("토너먼트로 첫 여행지를 골라보세요" + CTA)
 *
 * 5개 가득 찬 경우는 토너먼트 결과 페이지의 저장 액션에서 처리
 * (교체 대상 선택 UI 제공). 여기서는 표시만 담당.
 */
export function SavedTournamentsSection() {
  return null;
}
