import { api } from '@/services/api/client';
import type {
  Destination,
  SavedTournament,
  TournamentConfig,
} from '@/features/tournament/types';

/**
 * 토너먼트 API
 *
 * 백엔드 엔드포인트 예시 (실제 스펙에 맞춰 수정):
 *   GET  /destinations/random           — 조건에 맞는 랜덤 N개
 *   POST /tournaments                   — 토너먼트 결과 기록 (랭킹용)
 *   POST /mypage/tournaments            — 마이페이지 저장
 *   GET  /mypage/tournaments            — 저장 목록
 *   DELETE /mypage/tournaments/:id      — 삭제
 */
export const tournamentApi = {
  fetchCandidates: async (config: TournamentConfig): Promise<Destination[]> => {
    const res = await api.get<Destination[]>('/destinations/random', {
      params: {
        themeKind: config.theme.kind,
        themeValue: config.theme.value,
        categories: config.categories.join(','),
        region: config.region,
        count: config.count,
      },
    });
    return res.data;
  },

  recordResult: async (winnerId: string) => {
    await api.post('/tournaments', { winnerId });
  },

  saveToMypage: async (winnerId: string): Promise<SavedTournament> => {
    const res = await api.post<SavedTournament>('/mypage/tournaments', {
      destinationId: winnerId,
    });
    return res.data;
  },

  listSaved: async (): Promise<SavedTournament[]> => {
    const res = await api.get<SavedTournament[]>('/mypage/tournaments');
    return res.data;
  },

  removeSaved: async (id: string) => {
    await api.delete(`/mypage/tournaments/${id}`);
  },
};
