import { shuffle } from '@/lib/shuffle';
import type { QuizOptionDto, QuizQuestionDto } from '@/types/api-domain';

/**
 * 여행 유형 퀴즈의 **각 문항 옵션 순서** 만 셔플 (문항 순서는 유지).
 *
 * 위치 편향 (예: "항상 첫번째 옵션을 고르는 사용자") 제거 목적.
 * 채점은 BE 가 `optionId` 로 하므로 셔플해도 안전.
 *
 * 반환값은 `question.id → 셔플된 options[]` 매핑. 컴포넌트에서 한 번
 * 셔플하고 state 에 캐싱해 quiz 세션 동안 안정적으로 사용.
 */
export function shuffleQuizOptions(
  questions: readonly QuizQuestionDto[],
): Record<string, QuizOptionDto[]> {
  const map: Record<string, QuizOptionDto[]> = {};
  for (const q of questions) {
    map[q.id] = shuffle(q.options);
  }
  return map;
}
