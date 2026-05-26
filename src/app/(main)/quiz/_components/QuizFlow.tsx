'use client';

/**
 * QuizFlow
 *
 * 질문 → 답변 → 결과 흐름을 한 페이지에서 처리.
 *
 * 컴포넌트 분할 (features/quiz/components):
 *   - <QuizIntro onStart={...} />              시작 안내
 *   - <QuizQuestionStep question={...} ... />  단일 질문 카드
 *   - <QuizResult result={...} />              유형 + 추천 3곳 + 공유 버튼
 *   - <TravelTypeShareCard />                  공유용 이미지 카드
 *
 * 옵션 UX: 질문 진행은 Carousel(dragFree=false, loop=false) 활용 가능.
 */
export function QuizFlow() {
  return (
    <div
      style={{
        minHeight: 400,
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--color-muted)',
      }}
    >
      Quiz flow (intro → questions → result)
    </div>
  );
}
