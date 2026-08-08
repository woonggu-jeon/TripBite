import type { TravelTypeCode, TravelTypeDto } from '@/types/api-domain';

/**
 * 여행 유형 4종 메타 — FE 도메인 상수(고정 콘텐츠).
 *
 * 배경: Spring 은 `GET /travel-types/me` 미지원 → 내 유형은 `GET /me`.travelType(code)
 * 로만 온다. 그 code 를 아래 메타로 재구성해 결과/엔트리 화면을 채운다.
 * (quiz submit 응답은 BE 가 동일 내용을 던지므로 shape 정합.)
 * mock seed(travelTypeMetaSeed) 도 이 상수를 재사용한다 — 단일 소스.
 */
export const TRAVEL_TYPE_META: Record<
  TravelTypeCode,
  Omit<TravelTypeDto, 'recommended' | 'compatibility'>
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

/** code → 도메인 TravelTypeDto (recommended 는 별도 소스, 기본 빈배열). */
export function travelTypeFromCode(
  code: string | null | undefined,
): TravelTypeDto | null {
  if (!code || !(code in TRAVEL_TYPE_META)) return null;
  return {
    ...TRAVEL_TYPE_META[code as TravelTypeCode],
    recommended: [],
  };
}
