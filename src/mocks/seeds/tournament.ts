import type { RegionCode } from '@/constants/regions';

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
