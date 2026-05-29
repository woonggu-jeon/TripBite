'use client';

import { TravelTypeQuiz } from '@/features/ranking/components/TravelTypeQuiz';

/**
 * Quiz flow — 진행 단계는 TravelTypeQuiz 가 담당.
 *
 * 결과/공유 화면은 별도 라우트(/quiz/result, /quiz/share).
 * 마지막 답변 시 submit → /quiz/result 로 자동 이동.
 */
export function QuizFlow() {
  return <TravelTypeQuiz />;
}
