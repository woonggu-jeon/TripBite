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
    // pool 사이즈 — 매치업 진입 시 토너먼트 사이즈(M, 최대 32) 만큼 destinations 가
    // 필요하므로 최소 32 보장. 여행지 갯수(N) 대비 여유.
    const poolSize = Math.max(32, config.count * 3);
    const res = await api.get<Destination[]>('/destinations/random', {
      params: {
        themeKind: config.theme.kind,
        themeValue: config.theme.value,
        categories: config.categories.join(','),
        region: config.region,
        count: config.count,
        // 매치업 사이즈 — Play 의 tournamentSize phase 에서 결정되면 함께 전달.
        // 백엔드가 destinations 결정 시 활용 가능 (현재 mock 은 무시).
        tournamentSize: config.tournamentSize,
        pool: poolSize,
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
