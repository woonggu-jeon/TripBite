import type { QuizOptionDto, QuizQuestionDto } from '@/types/api-domain';

/**
 * Fisher-Yates 셔플 (in-place 가 아닌 새 배열 반환).
 *
 * ⚠️ Math.random 사용 — 서버/클라 결과가 달라 hydration mismatch 발생.
 * 반드시 client side (useEffect 안 등) 에서 호출 후 state 에 캐싱할 것.
 */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}

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
