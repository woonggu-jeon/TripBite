import type { DestinationDto } from '@/types/api-domain';

export type RankedDestination = {
  rank: number;
  destination: DestinationDto;
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

/**
 * 여행 유형 테스트
 *
 * 점수 매핑 / 유형 결정 로직은 서버 책임 — 클라이언트는 단순히 questions/options 를
 * 렌더링하고 사용자가 선택한 (questionId, optionId) 만 submit 으로 전송.
 *
 * Quiz 응답에 옵션별 가중치 같은 정보는 노출하지 않음 (스포일러 + 추후 정책 변경 자유).
 * 결과 화면에 필요한 모든 정보(유형 메타, 키워드, 추천 여행지)는 submit 응답에 포함.
 */
export type TravelTypeAnswer = {
  questionId: string;
  optionId: string;
};

/**
 * 유형 코드는 서버 contract 이지만, UI 가 알 필요는 없음(string 으로 받음).
 * 별도 enum 유지 시 새 유형 추가 때 양쪽 동기화 필요 — 일단 자유 문자열로 두고
 * 결과 객체의 title/description/emoji 로 UI 렌더.
 */
export type TravelTypeQuizQuestion = {
  id: string;
  text: string;
  options: Array<{
    id: string;
    text: string;
  }>;
};

export type TravelTypeQuiz = {
  questions: TravelTypeQuizQuestion[];
};
