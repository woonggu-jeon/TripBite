/**
 * 토너먼트 기록 시드 — 15회
 */
export const tournamentHistorySeeds = Array.from({ length: 15 }, (_, i) => ({
  id: `t-${i + 1}`,
  theme: (['spring', 'summer', 'autumn', 'winter'] as const)[i % 4],
  category: (['festival', 'attraction', 'experience'] as const)[i % 3],
  count: ([8, 16, 32] as const)[i % 3],
  winnerId: `dest-${i + 100}`,
  completedAt: new Date(Date.now() - i * 86400 * 1000).toISOString(),
}));
