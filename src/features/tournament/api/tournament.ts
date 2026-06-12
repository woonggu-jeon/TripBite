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
import {
  tournamentControllerGetV1,
  tournamentControllerRecordV1,
} from '@/api/generated/tournaments/tournaments';
import {
  normalizeImageField,
  normalizePhotosField,
} from '@/lib/secure-image-url';
import type {
  DestinationDto,
  DestinationDetailDto,
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

  recordResult: (input: {
    winnerId: string;
    runnerUpId: string | null;
    matchesPlayed: number;
    tournamentSize: number;
  }) =>
    tournamentControllerRecordV1({
      winnerId: input.winnerId,
      runnerUpId: input.runnerUpId ?? undefined,
      matchesPlayed: input.matchesPlayed,
      tournamentSize: input.tournamentSize,
    }),

  getRecord: (id: string) => tournamentControllerGetV1(id),

  saveToMypage: (winnerId: string) =>
    mypageControllerSaveV1({ destinationId: winnerId }),

  listSaved: () => mypageControllerListSavedV1(),

  removeSaved: (savedId: string) => mypageControllerRemoveSavedV1(savedId),

  listHistory: () => mypageControllerHistoryV1(),
};
