'use client';

import { TravelTypeQuiz } from '@/features/ranking/components/TravelTypeQuiz';

/**
 * Quiz flow — 진행 단계는 TravelTypeQuiz 가 담당.
 *
 * 결과 화면은 별도 라우트 (/quiz/result). 공유는 result 화면의 share 버튼이
 * 직접 /api/og/quiz Satori PNG 호출 → OS share sheet.
 * 마지막 답변 시 submit → /quiz/result 로 자동 이동.
 */
export function QuizFlow() {
  return <TravelTypeQuiz />;
}
