import type { RegionCode } from '@/constants/regions';
import type {
  DestinationCategory,
  SavedTournament,
} from '@/features/tournament/types';
import { destinationSeeds, tourSeedId } from './destinations';

/**
 * 토너먼트 기록 시드 — 15회.
 *
 * winnerRegion 은 도장책 derive 에 사용 (mock /mypage/stamps).
 * 11 시군 중 일부만 반복해 도장 진행률 시각화 (5–6 시군 도장).
 * winnerId / winnerName 은 destinationSeeds 에서 실제 일치하는 항목으로 매핑 —
 * 우승지명 노출 + 클릭 시 destination 상세 페이지로 deep-link 가능 위함.
 */
const REGION_CYCLE: RegionCode[] = [
  'cheongju',
  'chungju',
  'jecheon',
  'boeun',
  'danyang',
  'cheongju',
  'chungju',
  'goesan',
  'jecheon',
  'cheongju',
  'boeun',
  'okcheon',
  'cheongju',
  'eumseong',
  'jincheon',
];

const CATEGORY_CYCLE = [
  'local',
  'festival',
  'attraction',
  'experience',
] as const;

export const tournamentHistorySeeds = Array.from({ length: 15 }, (_, i) => {
  const region = REGION_CYCLE[i] as RegionCode;
  const category = CATEGORY_CYCLE[i % 4];
  // 시군 + 카테고리 일치 destination — 없으면 시군 일치 destination, 둘 다 없으면 첫 시드.
  // destinationSeeds 는 11 시군 × 4 카테고리 × 2 = 88개 → 항상 매칭. 컴파일 만족 위한 fallback.
  const match = destinationSeeds.find(
    (d) => d.region === region && d.category === category,
  ) ??
    destinationSeeds.find((d) => d.region === region) ??
    destinationSeeds[0] ?? {
      id: 'unknown',
      name: '미상',
      region,
      category,
    };
  return {
    id: `t-${i + 1}`,
    theme: (['spring', 'summer', 'autumn', 'winter'] as const)[i % 4],
    category,
    count: ([4, 8, 16, 32] as const)[i % 4],
    winnerId: match.id,
    winnerName: match.name,
    winnerRegion: region,
    completedAt: new Date(Date.now() - i * 86400 * 1000).toISOString(),
  };
});

/**
 * 저장한 토너먼트 우승지 시드 — 7개.
 *
 * 실 destinationSeeds 에서 다양한 시군 / 카테고리 / luckyColor 조합으로 추출.
 * 마이페이지 미리보기 (최신 3) + 전체보기 페이지 양쪽이 같은 데이터 노출.
 *
 * savedAt 은 최신 → 오래된 순으로 설정 — slice(0, PREVIEW_COUNT) 가
 * 자연스럽게 "최근 저장" 순.
 */
// region+category+idx → tourSeedId() 가 destinations seed 와 동일 id 산출.
const SAVED_PICKS: Array<{
  region: RegionCode;
  category: DestinationCategory;
  idx: number;
  color: string;
  chance: number;
}> = [
  {
    region: 'cheongju',
    category: 'festival',
    idx: 1,
    color: '#F472B6',
    chance: 88,
  },
  {
    region: 'danyang',
    category: 'attraction',
    idx: 1,
    color: '#60A5FA',
    chance: 92,
  },
  {
    region: 'chungju',
    category: 'experience',
    idx: 1,
    color: '#34D399',
    chance: 71,
  },
  {
    region: 'jecheon',
    category: 'attraction',
    idx: 1,
    color: '#A78BFA',
    chance: 80,
  },
  { region: 'boeun', category: 'local', idx: 1, color: '#FBBF24', chance: 65 },
  {
    region: 'goesan',
    category: 'festival',
    idx: 1,
    color: '#FB7185',
    chance: 77,
  },
  {
    region: 'okcheon',
    category: 'attraction',
    idx: 1,
    color: '#22D3EE',
    chance: 83,
  },
];

export const savedTournamentSeeds: SavedTournament[] = SAVED_PICKS.flatMap(
  (pick, i) => {
    const id = tourSeedId(pick.region, pick.category, pick.idx);
    const dest = destinationSeeds.find((d) => d.id === id);
    if (!dest) return [];
    return [
      {
        id: `saved-${dest.id}`,
        destination: dest,
        luckyColor: pick.color,
        meetChance: pick.chance,
        savedAt: new Date(Date.now() - i * 86400 * 1000 * 2).toISOString(),
      },
    ];
  },
);
