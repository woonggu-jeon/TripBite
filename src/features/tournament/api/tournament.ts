import { api } from '@/services/api/client';
import type {
  Destination,
  DestinationDetail,
  SavedTournament,
  TournamentConfig,
} from '@/features/tournament/types';

/**
 * 토너먼트 API
 *
 * 백엔드 엔드포인트 예시 (실제 스펙에 맞춰 수정):
 *   GET  /destinations/random           — 조건에 맞는 랜덤 N개
 *   GET  /destinations/:id              — 여행지 상세 (Detail)
 *   POST /tournaments                   — 토너먼트 결과 기록 (랭킹용)
 *   POST /mypage/tournaments            — 마이페이지 저장
 *   GET  /mypage/tournaments            — 저장 목록
 *   DELETE /mypage/tournaments/:id      — 삭제
 */
export const tournamentApi = {
  /**
   * 여행지 상세 — 토너먼트 결과 화면 등에서 풍부한 메타가 필요할 때 호출.
   * 응답 필드는 모두 optional. 백엔드가 점진적으로 채우는 시나리오 가정.
   */
  getDestinationDetail: async (id: string): Promise<DestinationDetail> => {
    const res = await api.get<DestinationDetail>(`/destinations/${id}`);
    return res.data;
  },

  /**
   * 관련 여행지 — 같은 시군의 다른 destination 6개.
   * 실 BE 는 사용자 선호 / 카테고리 균형 등 고려.
   */
  getRelatedDestinations: async (id: string): Promise<Destination[]> => {
    const res = await api.get<Destination[]>(`/destinations/${id}/related`);
    return res.data;
  },

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

  /**
   * 토너먼트 기록 — 사용자의 누적 토너먼트 결과 (각 토너먼트의 winner / 진행
   * 횟수 등 메타). mypage 의 "토너먼트 기록" 섹션에서 사용.
   *
   * 응답 형태: `{ items: TournamentHistoryItem[]; nextCursor?: string | null }`.
   * mock 은 단일 페이지 — BE 도입 시 InfiniteList 패턴으로 확장.
   */
  listHistory: async () => {
    const res = await api.get('/mypage/tournament-history');
    return res.data as { items: unknown[]; nextCursor?: string | null };
  },
};
