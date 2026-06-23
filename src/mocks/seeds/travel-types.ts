import type {
  TravelTypeCompatibility,
  TravelTypeDto,
} from '@/api/generated/schemas';
import type { TravelTypeQuiz } from '@/features/ranking/types';

/**
 * 여행 유형 테스트 mock seed.
 *
 * ⚠️ 실제 backend 는:
 *   - GET  /travel-types/quiz    → questions + options (점수 매핑은 서버 비공개)
 *   - POST /travel-types/submit  → answers 수신 후 결과(유형 + 메타 + 추천 3곳) 반환
 *   - GET  /travel-types/me      → 저장된 결과
 *
 * 즉, 클라이언트는 점수 계산 / 유형 결정 / 추천 선정 로직을 가지지 않음.
 * 본 seed 는 mock handler 가 위 동작을 흉내 내기 위한 데이터로만 사용 — 컴포넌트가
 * 직접 import 하지 말 것 (handler/test 한정).
 */

/** quiz API 응답 shape — 옵션에 점수 정보 X. */
export const travelTypeQuizSeed: TravelTypeQuiz = {
  questions: [
    {
      id: 'q1',
      text: '여행 첫날 아침, 가장 먼저 하고 싶은 일은?',
      options: [
        { id: 'q1-a', text: '일찍 일어나 새로운 곳으로 출발' },
        { id: 'q1-b', text: '박물관·유적지부터 들른다' },
        { id: 'q1-c', text: '호텔 침대에서 느긋하게 일정 정리' },
        { id: 'q1-d', text: '근처 맛집부터 검색' },
      ],
    },
    {
      id: 'q2',
      text: '갑자기 일주일 휴가가 생겼다면?',
      options: [
        { id: 'q2-a', text: '처음 가보는 도시 비행기표를 끊는다' },
        { id: 'q2-b', text: '한 도시를 깊게 둘러본다' },
        { id: 'q2-c', text: '바닷가 풀빌라에서 푹 쉰다' },
        { id: 'q2-d', text: '현지 시장 투어를 짠다' },
      ],
    },
    {
      id: 'q3',
      text: '여행지에서 사진을 가장 많이 찍는 대상은?',
      options: [
        { id: 'q3-a', text: '절벽·산 꼭대기의 풍경' },
        { id: 'q3-b', text: '건축물·예술품' },
        { id: 'q3-c', text: '노을·하늘·바다' },
        { id: 'q3-d', text: '음식 플레이팅' },
      ],
    },
    {
      id: 'q4',
      text: '동행자가 "어디 갈래?" 라고 물으면?',
      options: [
        { id: 'q4-a', text: '"일단 차 몰고 가보자"' },
        { id: 'q4-b', text: '"코스 미리 짜놨어, 이쪽으로"' },
        { id: 'q4-c', text: '"근처 조용한 카페 어때?"' },
        { id: 'q4-d', text: '"맛집 줄서야 해 일찍 가자"' },
      ],
    },
    {
      // Q5 — Q3(사진) 와 중복되던 옛 "사진첩" 축 폐기, "소비" 축으로 교체.
      // BE 가 시드 갱신 시 GET /quiz 응답 자동 동기. mock 도 일관성 위해 미리 반영.
      id: 'q5',
      text: '여행지에서 지갑이 가장 잘 열리는 순간은?',
      options: [
        { id: 'q5-a', text: '액티비티·체험을 예약할 때' },
        { id: 'q5-b', text: '입장권·가이드 투어 비용' },
        { id: 'q5-c', text: '분위기 좋은 숙소나 카페' },
        { id: 'q5-d', text: '현지 맛집·먹거리' },
      ],
    },
  ],
};

/**
 * mock 전용: optionId → 가중치 유형 코드.
 * 실제 backend 는 동일한 매핑을 서버 측에서 보유 (DB 또는 정책 코드). 클라이언트에는
 * 노출하지 않음.
 */
export type TravelTypeMockCode =
  | 'adventurer'
  | 'explorer'
  | 'relaxer'
  | 'foodie';

export const travelTypeMockScoreMap: Record<string, TravelTypeMockCode> = {
  'q1-a': 'adventurer',
  'q1-b': 'explorer',
  'q1-c': 'relaxer',
  'q1-d': 'foodie',
  'q2-a': 'adventurer',
  'q2-b': 'explorer',
  'q2-c': 'relaxer',
  'q2-d': 'foodie',
  'q3-a': 'adventurer',
  'q3-b': 'explorer',
  'q3-c': 'relaxer',
  'q3-d': 'foodie',
  'q4-a': 'adventurer',
  'q4-b': 'explorer',
  'q4-c': 'relaxer',
  'q4-d': 'foodie',
  'q5-a': 'adventurer',
  'q5-b': 'explorer',
  'q5-c': 'relaxer',
  'q5-d': 'foodie',
};

/** 유형별 메타 (서버가 결과 응답에 포함시켜 던지는 내용). */
export const travelTypeMetaSeed: Record<
  TravelTypeMockCode,
  Omit<TravelTypeDto, 'recommended'>
> = {
  adventurer: {
    code: 'adventurer',
    title: '도전형 여행자',
    description:
      '낯선 길과 처음 가보는 곳에 끌리는 사람이에요. 정해진 계획보다 즉흥과 모험에서 에너지를 얻어요.',
    keywords: ['#즉흥', '#모험', '#액티비티'],
    emoji: '🧗',
  },
  explorer: {
    code: 'explorer',
    title: '탐험형 여행자',
    description:
      '한 도시를 깊게 파고드는 걸 좋아해요. 역사·문화·건축물에 시간을 쓰는 사람.',
    keywords: ['#역사', '#문화', '#큐레이션'],
    emoji: '🏛️',
  },
  relaxer: {
    code: 'relaxer',
    title: '휴식형 여행자',
    description:
      '여행은 곧 충전 시간. 조용한 카페·노을·풍경 속에서 잠시 멈춰가는 걸 좋아해요.',
    keywords: ['#힐링', '#풍경', '#카페'],
    emoji: '🌿',
  },
  foodie: {
    code: 'foodie',
    title: '맛집형 여행자',
    description:
      '먹는 것에서 여행이 시작돼요. 시장·축제·현지 음식이 일정의 중심이에요.',
    keywords: ['#로컬푸드', '#시장', '#축제'],
    emoji: '🍜',
  },
};

/**
 * mock 전용: 유형별 추천 destination 카테고리 매핑.
 * handler 가 destinationSeeds 를 이 카테고리로 필터 + 셔플 → top 3 반환.
 */
export const travelTypeRecommendCategoriesSeed: Record<
  TravelTypeMockCode,
  Array<'festival' | 'attraction' | 'experience'>
> = {
  adventurer: ['experience', 'attraction'],
  explorer: ['attraction', 'festival'],
  relaxer: ['attraction', 'experience'],
  foodie: ['festival', 'experience'],
};

/**
 * mock 전용: 유형별 여행 궁합 (best / worst) — BE 가 응답에 함께 던지는 신규
 * 필드 (각 code·title·emoji·reason). UI 가 분기 로직을 가지지 않도록 서버 응답
 * 그대로 노출. 비로그인 submit 결과에도 포함.
 */
export const travelTypeCompatibilitySeed: Record<
  TravelTypeMockCode,
  TravelTypeCompatibility
> = {
  adventurer: {
    best: {
      code: 'foodie',
      title: '맛집형 여행자',
      emoji: '🍜',
      reason: '즉흥과 발견의 호흡이 잘 맞아요. 길에서 만난 맛집에서 의기투합.',
    },
    worst: {
      code: 'relaxer',
      title: '휴식형 여행자',
      emoji: '🌿',
      reason: '액티브 코스와 느긋한 페이스가 부딪힐 수 있어요.',
    },
  },
  explorer: {
    best: {
      code: 'foodie',
      title: '맛집형 여행자',
      emoji: '🍜',
      reason: '문화 탐방과 미식 투어가 자연스럽게 이어져요.',
    },
    worst: {
      code: 'adventurer',
      title: '도전형 여행자',
      emoji: '🧗',
      reason: '꼼꼼한 계획과 즉흥의 호흡이 어긋날 수 있어요.',
    },
  },
  relaxer: {
    best: {
      code: 'explorer',
      title: '탐험형 여행자',
      emoji: '🏛️',
      reason: '한 곳을 깊게 보는 두 유형의 페이스가 잘 맞아요.',
    },
    worst: {
      code: 'adventurer',
      title: '도전형 여행자',
      emoji: '🧗',
      reason: '쉼과 도전의 균형 잡기가 어려울 수 있어요.',
    },
  },
  foodie: {
    best: {
      code: 'adventurer',
      title: '도전형 여행자',
      emoji: '🧗',
      reason: '새 장소·새 맛으로 함께 떠나기 좋아요.',
    },
    worst: {
      code: 'relaxer',
      title: '휴식형 여행자',
      emoji: '🌿',
      reason: '쉼 중심 여행과 미식 투어의 페이스가 다를 수 있어요.',
    },
  },
};
