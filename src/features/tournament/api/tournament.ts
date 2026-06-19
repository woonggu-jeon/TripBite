import {
  destinationControllerDetailV1,
  destinationControllerRandomV1,
  destinationControllerRelatedV1,
} from '@/api/generated/destinations/destinations';
import {
  mypageControllerHistoryV1,
  mypageControllerListSavedV1,
  mypageControllerRemoveSavedV1,
  mypageControllerSaveV1,
} from '@/api/generated/mypage/mypage';
import { tournamentControllerGetV1 } from '@/api/generated/tournaments/tournaments';
import { api } from '@/services/api/client';
import {
  normalizeImageField,
  normalizePhotosField,
} from '@/lib/secure-image-url';
import type {
  DestinationDto,
  DestinationDetailDto,
  TournamentRecordDto,
} from '@/api/generated/schemas';
import type { TournamentConfig } from '@/features/tournament/types';

/**
 * 토너먼트 API — orval generated client wrap.
 *
 * 엔드포인트:
 *   GET    /destinations/random   — 매치업 후보 (DestinationDto[])
 *   GET    /destinations/:id      — 상세 (DestinationDetailDto)
 *   GET    /destinations/:id/related — 같은 시군 6
 *   POST   /tournaments           — 결과 기록 (선택 인증 — 비로그인은 게스트 익명 기록)
 *   GET    /tournaments/:id       — record 복원 (deep-link, 공개)
 *   GET    /mypage/tournaments    — 저장 목록
 *   POST   /mypage/tournaments    — 저장
 *   DELETE /mypage/tournaments/:id — 삭제
 *   GET    /mypage/tournament-history — 누적 기록 (cursor)
 */
export const tournamentApi = {
  getDestinationDetail: async (id: string): Promise<DestinationDetailDto> => {
    const res = await destinationControllerDetailV1(id);
    return normalizePhotosField(normalizeImageField(res));
  },

  getRelatedDestinations: async (id: string): Promise<DestinationDto[]> => {
    const res = await destinationControllerRelatedV1(id);
    return res.map(normalizeImageField);
  },

  fetchCandidates: async (
    config: TournamentConfig,
  ): Promise<DestinationDto[]> => {
    const res = await destinationControllerRandomV1({
      themeKind: config.theme.kind,
      themeValue: config.theme.value,
      categories: config.categories.join(','),
      regions: config.selectedRegions?.join(','),
      tournamentSize:
        config.tournamentSize === 4 ||
        config.tournamentSize === 8 ||
        config.tournamentSize === 16 ||
        config.tournamentSize === 32
          ? config.tournamentSize
          : undefined,
    });
    return res.map(normalizeImageField);
  },

  /**
   * 토너먼트 결과 기록.
   *
   * Idempotency-Key (BE 합의 2026-06-19): 호출 1회 = UUID 1개 → 같은 키 24h 내
   * 동일 결과 반환 → 네트워크 재시도 / 더블탭에도 랭킹 이중 카운트 방지.
   * generated `tournamentControllerRecordV1` 는 axios config override 불가
   * (signal 만 받음) — generated 우회 후 axios 직접 호출. 다른 endpoint 는
   * generated 그대로.
   */
  recordResult: async (
    input: {
      winnerId: string;
      runnerUpId: string | null;
      matchesPlayed: number;
      tournamentSize: number;
    },
    idempotencyKey?: string,
    signal?: AbortSignal,
  ): Promise<TournamentRecordDto> => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    const res = await api.post<TournamentRecordDto>(
      '/v1/tournaments',
      {
        winnerId: input.winnerId,
        runnerUpId: input.runnerUpId ?? undefined,
        matchesPlayed: input.matchesPlayed,
        tournamentSize: input.tournamentSize,
      },
      {
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        signal,
      },
    );
    return res.data;
  },

  getRecord: (id: string) => tournamentControllerGetV1(id),

  saveToMypage: (winnerId: string) =>
    mypageControllerSaveV1({ destinationId: winnerId }),

  listSaved: () => mypageControllerListSavedV1(),

  removeSaved: (savedId: string) => mypageControllerRemoveSavedV1(savedId),

  listHistory: () => mypageControllerHistoryV1(),
};
