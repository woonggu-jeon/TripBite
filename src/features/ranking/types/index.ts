import type { Destination } from '@/features/tournament/types';

export type RankedDestination = {
  rank: number;
  destination: Destination;
  /** 우승 횟수 (weekly-winners) 또는 점수 (recommended) */
  score: number;
};

export type RankingType =
  | 'weekly-winners'
  | 'recommended'
  | 'by-category'
  | 'seasonal'
  | 'by-travel-type'
  | 'by-region';

/** 여행 유형 테스트 */
export type TravelTypeAnswer = {
  questionId: string;
  optionId: string;
};

export type TravelType = {
  /** 예: "ENFP-T (계획없는 모험가)" 같은 짧은 코드/라벨 */
  code: string;
  title: string;
  description: string;
  /** 공유 카드 생성용 핵심 키워드 */
  keywords: string[];
};
