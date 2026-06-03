import type { RegionCode } from '@/constants/regions';
import type { SavedTournament } from '@/features/tournament/types';
import { destinationSeeds } from './destinations';

/**
 * 토너먼트 기록 시드 — 15회.
 *
 * winnerRegion 은 도장책 derive 에 사용 (mock /mypage/stamps).
 * 11 시군 중 일부만 반복해 도장 진행률 시각화 (5–6 시군 도장).
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

export const tournamentHistorySeeds = Array.from({ length: 15 }, (_, i) => ({
  id: `t-${i + 1}`,
  theme: (['spring', 'summer', 'autumn', 'winter'] as const)[i % 4],
  category: (['local', 'festival', 'attraction', 'experience'] as const)[i % 4],
  count: ([4, 8, 16, 32] as const)[i % 4],
  winnerId: `dest-${i + 100}`,
  winnerRegion: REGION_CYCLE[i] as RegionCode,
  completedAt: new Date(Date.now() - i * 86400 * 1000).toISOString(),
}));

/**
 * 저장한 토너먼트 우승지 시드 — 7개.
 *
 * 실 destinationSeeds 에서 다양한 시군 / 카테고리 / luckyColor 조합으로 추출.
 * 마이페이지 미리보기 (최신 3) + 전체보기 페이지 양쪽이 같은 데이터 노출.
 *
 * savedAt 은 최신 → 오래된 순으로 설정 — slice(0, PREVIEW_COUNT) 가
 * 자연스럽게 "최근 저장" 순.
 */
const SAVED_PICKS: Array<{ destId: string; color: string; chance: number }> = [
  { destId: 'cheongju-festival-1', color: '#F472B6', chance: 88 },
  { destId: 'danyang-attraction-1', color: '#60A5FA', chance: 92 },
  { destId: 'chungju-experience-1', color: '#34D399', chance: 71 },
  { destId: 'jecheon-attraction-1', color: '#A78BFA', chance: 80 },
  { destId: 'boeun-local-1', color: '#FBBF24', chance: 65 },
  { destId: 'goesan-festival-1', color: '#FB7185', chance: 77 },
  { destId: 'okcheon-attraction-1', color: '#22D3EE', chance: 83 },
];

export const savedTournamentSeeds: SavedTournament[] = SAVED_PICKS.flatMap(
  (pick, i) => {
    const dest = destinationSeeds.find((d) => d.id === pick.destId);
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
