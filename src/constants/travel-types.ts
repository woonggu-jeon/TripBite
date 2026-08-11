import type { TravelTypeCode, TravelTypeDto } from '@/types/api-domain';

/**
 * 여행 유형 4종 메타 — FE 도메인 상수(고정 콘텐츠).
 *
 * 배경: Spring 은 `GET /travel-types/me` 미지원 → 내 유형은 `GET /me`.travelType(code)
 * 로만 온다. 그 code 를 아래 메타로 재구성해 결과/엔트리 화면을 채운다.
 * (quiz submit 응답은 BE 가 동일 내용을 던지므로 shape 정합.)
 * mock seed(travelTypeMetaSeed) 도 이 상수를 재사용한다 — 단일 소스.
 */
export const TRAVEL_TYPE_META: Record<TravelTypeCode, TravelTypeDto> = {
  adventurer: {
    code: 'adventurer',
    title: '도전형 여행자',
    description:
      '낯선 길과 처음 가보는 곳에 끌리는 사람이에요. 정해진 계획보다 즉흥과 모험에서 에너지를 얻어요.',
    tags: ['#즉흥', '#모험', '#액티비티'],
    emoji: '🧗',
  },
  explorer: {
    code: 'explorer',
    title: '탐험형 여행자',
    description:
      '한 도시를 깊게 파고드는 걸 좋아해요. 역사·문화·건축물에 시간을 쓰는 사람.',
    tags: ['#역사', '#문화', '#큐레이션'],
    emoji: '🏛️',
  },
  relaxer: {
    code: 'relaxer',
    title: '휴식형 여행자',
    description:
      '여행은 곧 충전 시간. 조용한 카페·노을·풍경 속에서 잠시 멈춰가는 걸 좋아해요.',
    tags: ['#힐링', '#풍경', '#카페'],
    emoji: '🌿',
  },
  foodie: {
    code: 'foodie',
    title: '맛집형 여행자',
    description:
      '먹는 것에서 여행이 시작돼요. 시장·축제·현지 음식이 일정의 중심이에요.',
    tags: ['#로컬푸드', '#시장', '#축제'],
    emoji: '🍜',
  },
};

/** code → 도메인 TravelTypeDto (Spring TravelTypeResultDto 와 동일 shape). */
export function travelTypeFromCode(
  code: string | null | undefined,
): TravelTypeDto | null {
  if (!code || !(code in TRAVEL_TYPE_META)) return null;
  return TRAVEL_TYPE_META[code as TravelTypeCode];
}

/**
 * 여행 궁합 — Figma `TST · 유형테스트 결과 > match-section` 의 두 행 데이터.
 *
 * BE 미제공(TravelTypeResultDto 에 궁합 필드 없음) → TRAVEL_TYPE_META 와 같은
 * FE 고정 콘텐츠로 둔다. 시안에 실제 문구가 있는 건 explorer 한 종류뿐이라
 * (잘 맞는=맛집형 / 잘 안 맞는=도전형) 나머지 3종의 짝과 문구는 같은 어조로
 * 임시 작성했다 — ⚠️ 기획·디자인 검수 후 교체 대상.
 */
export type TravelTypeMatch = {
  best: { code: TravelTypeCode; reason: string };
  worst: { code: TravelTypeCode; reason: string };
};

export const TRAVEL_TYPE_MATCH: Record<TravelTypeCode, TravelTypeMatch> = {
  explorer: {
    // 시안 실측 문구
    best: {
      code: 'foodie',
      reason: '골목과 로컬 먹거리를 깊이 파고드는 둘, 여행 취향이 척척 맞아요.',
    },
    worst: {
      code: 'adventurer',
      reason:
        '천천히 음미하는 탐험형과 스릴 가득한 도전형, 여행 속도가 정반대예요.',
    },
  },
  foodie: {
    best: {
      code: 'explorer',
      reason:
        '시장 골목까지 파고드는 둘, 하루를 알차게 채우는 취향이 닮았어요.',
    },
    worst: {
      code: 'relaxer',
      reason: '북적이는 시장이 좋은 맛집형과 조용한 쉼이 좋은 휴식형이에요.',
    },
  },
  adventurer: {
    best: {
      code: 'foodie',
      reason: '어디든 일단 가보는 둘, 낯선 동네의 첫 끼부터 통해요.',
    },
    worst: {
      code: 'explorer',
      reason: '즉흥으로 움직이는 도전형과 한 곳을 오래 보는 탐험형이에요.',
    },
  },
  relaxer: {
    best: {
      code: 'explorer',
      reason: '느긋하게 걷는 둘, 한 자리에 오래 머무는 리듬이 잘 맞아요.',
    },
    worst: {
      code: 'foodie',
      reason:
        '조용한 쉼이 좋은 휴식형과 먹으러 부지런히 움직이는 맛집형이에요.',
    },
  },
};

/**
 * "이런 여행지가 어울려요" 에 쓰는 유형별 카테고리.
 *
 * BE 에 유형별 추천 엔드포인트가 없어(§5 P2-3) `GET /destinations/random` 의
 * category 필터로 대체한다. 유형 키워드(tags)와 결이 맞는 카테고리 1개.
 */
export const TRAVEL_TYPE_CATEGORY: Record<
  TravelTypeCode,
  'attraction' | 'festival' | 'experience'
> = {
  explorer: 'attraction', // #역사 #문화 #큐레이션
  foodie: 'festival', // #로컬푸드 #시장 #축제
  adventurer: 'experience', // #즉흥 #모험 #액티비티
  relaxer: 'attraction', // #힐링 #풍경 #카페
};
