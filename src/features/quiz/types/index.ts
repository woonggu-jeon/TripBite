export type QuizQuestion = {
  id: string;
  text: string;
  options: Array<{ id: string; text: string }>;
};

export type QuizAnswer = { questionId: string; optionId: string };

export type TravelType = {
  code: string;
  title: string;
  description: string;
  keywords: string[];
};

export type QuizResult = {
  type: TravelType;
  /** 유형 기반 추천 여행지 (3곳) */
  recommendations: Array<{
    id: string;
    title: string;
    imageUrl?: string;
    summary?: string;
  }>;
};
