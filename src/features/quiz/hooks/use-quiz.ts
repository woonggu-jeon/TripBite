'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '@/features/quiz/api/quiz';
import { CACHE } from '@/lib/cache';
import type { QuizAnswer } from '@/features/quiz/types';

export const quizKeys = {
  all: ['quiz'] as const,
  questions: () => [...quizKeys.all, 'questions'] as const,
  mine: () => [...quizKeys.all, 'mine'] as const,
};

export function useQuizQuestions() {
  return useQuery({
    queryKey: quizKeys.questions(),
    queryFn: quizApi.getQuestions,
    ...CACHE.static,
  });
}

export function useMyQuizResult() {
  return useQuery({
    queryKey: quizKeys.mine(),
    queryFn: quizApi.getMine,
    ...CACHE.user,
  });
}

export function useSubmitQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answers: QuizAnswer[]) => quizApi.submit(answers),
    onSuccess: (result) => qc.setQueryData(quizKeys.mine(), result),
  });
}
