import { api } from '@/services/api/client';
import { safeParseResponse } from '@/lib/safe-parse-response';
import {
  normalizeImageField,
  normalizePhotosField,
} from '@/lib/secure-image-url';
import { destinationDetailSchema } from '@/features/tournament/schemas/destination';
import type {
  Destination,
  DestinationDetail,
  SavedTournament,
  TournamentConfig,
  TournamentRecord,
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
    const res = await api.get<unknown>(`/destinations/${id}`);
    const parsed = safeParseResponse(
      destinationDetailSchema,
      res.data,
      `GET /destinations/${id}`,
    ) as DestinationDetail;
    // TourAPI 원본 http URL → https 정규화 (imageUrl + photos[])
    return normalizePhotosField(normalizeImageField(parsed));
  },

  /**
   * 관련 여행지 — 같은 시군의 다른 destination 6개.
   * 실 BE 는 사용자 선호 / 카테고리 균형 등 고려.
   */
  getRelatedDestinations: async (id: string): Promise<Destination[]> => {
    const res = await api.get<Destination[]>(`/destinations/${id}/related`);
    return res.data.map(normalizeImageField);
  },

  /**
   * 토너먼트 매치업 후보 fetch.
   *
   * 합의된 BE spec:
   *   - themeKind / themeValue / categories: filter
   *   - regions (comma): map phase 에서 FE 가 random pick 한 N 시군 코드 (필수)
   *     → BE 는 이 시군들 안에서만 destination 추출
   *   - tournamentSize ∈ {4, 8, 16, 32}: 응답 destination 갯수 (strict)
   *   - 응답: 정확히 tournamentSize 개 + 시군 다양성 (regions 안에서 균형 분배,
   *     tournamentSize > regions.length 인 경우 같은 시군 다른 destination 추가)
   *
   * count / pool / region(단일) param 폐기.
   */
  fetchCandidates: async (config: TournamentConfig): Promise<Destination[]> => {
    const res = await api.get<Destination[]>('/destinations/random', {
      params: {
        themeKind: config.theme.kind,
        themeValue: config.theme.value,
        categories: config.categories.join(','),
        regions: config.selectedRegions?.join(','),
        tournamentSize: config.tournamentSize,
      },
    });
    return res.data.map(normalizeImageField);
  },

  /**
   * 토너먼트 결과 기록 — Play 종료 시 fire-and-forget. 응답으로 record id 받음.
   * deep-link / result 페이지 재진입 시 이 id 로 GET 가능.
   */
  recordResult: async (input: {
    winnerId: string;
    runnerUpId: string | null;
    matchesPlayed: number;
    tournamentSize: number;
  }): Promise<TournamentRecord> => {
    const res = await api.post<TournamentRecord>('/tournaments', input);
    return res.data;
  },

  /** Deep-link 진입 (`/tournament/result?id=...`) 시 record 복원. */
  getRecord: async (id: string): Promise<TournamentRecord> => {
    const res = await api.get<TournamentRecord>(`/tournaments/${id}`);
    return res.data;
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

  /** 저장 우승지 삭제 — /mypage/saved-tournaments 상세에서 하트 클릭 시. */
  removeSaved: async (savedId: string): Promise<void> => {
    await api.delete(`/mypage/tournaments/${savedId}`);
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
