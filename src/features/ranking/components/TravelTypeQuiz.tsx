'use client';

/**
 * <TravelTypeQuiz />
 *
 * 여행 유형 테스트 진행 화면
 *
 * 사양:
 *   - 4~5개 질문, 한 번에 한 질문씩 노출 (스텝퍼)
 *   - 각 질문당 2~4개 선택지
 *   - 마지막 답변 시 useSubmitTravelType 호출 → 결과 화면 전환
 *   - 진행률 표시 (예: "3/5")
 *   - 뒤로가기로 이전 질문 수정 가능
 *
 * 데이터:
 *   const { data: quiz } = useTravelTypeQuiz();
 *   const { mutateAsync: submit } = useSubmitTravelType();
 *
 * 완료 후:
 *   - <TravelTypeResult result={travelType} />
 *   - "공유 카드 만들기" 버튼 → <TravelTypeShareCard />
 *   - 결과는 서버 저장 → 마이페이지/홈에서 재사용
 */
export function TravelTypeQuiz() {
  return null;
}
