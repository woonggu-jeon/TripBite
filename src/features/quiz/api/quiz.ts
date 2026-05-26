import { api } from '@/services/api/client';
import type { QuizQuestion, QuizAnswer, QuizResult } from '@/features/quiz/types';

export const quizApi = {
  getQuestions: async (): Promise<QuizQuestion[]> => {
    const res = await api.get<QuizQuestion[]>('/quiz/questions');
    return res.data;
  },
  submit: async (answers: QuizAnswer[]): Promise<QuizResult> => {
    const res = await api.post<QuizResult>('/quiz/submit', { answers });
    return res.data;
  },
  getMine: async (): Promise<QuizResult | null> => {
    const res = await api.get<QuizResult | null>('/quiz/me');
    return res.data;
  },
};
