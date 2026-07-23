// 신규 Spring BE 지원: 상세(getDetail) + random. (related 는 미지원 → 구 generated mock 유지)
import { getDetail, getRandom } from '@/api/be/destination/destination';
// 신규 Spring BE 지원: 저장 목록/저장/삭제 + history. (record 는 shape 비호환 → 구 generated mock 유지)
import {
  getList as beListSaved,
  getRecentTournaments as beHistory,
  save as beSave,
  delete1 as beDeleteSaved,
} from '@/api/be/mypage/mypage';
import type {
  ApiResponseTournamentSummaryDto,
  GetRandomCategory,
  GetRandomRegion,
  GetRandomSeason,
} from '@/api/be/schemas';
import {
  destinationControllerDetailV1,
  destinationControllerRelatedV1,
} from '@/api/generated/destinations/destinations';
import {
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
  SavedTournamentDto,
  TournamentHistoryItemDto,
  TournamentHistoryPageDto,
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
  // 실 BE 모드: 정수 id → be getDetail (엔벨로프 unwrap + new→old shape 매핑, images→photos).
  // mock(문자열 복합 id) → 구 generated. new BE 는 coords/phone/website/영업시간 등 미제공(상세 정보량 감소).
  getDestinationDetail: async (id: string): Promise<DestinationDetailDto> => {
    if (/^\d+$/.test(id)) {
      const res = await getDetail(Number(id));
      const d = res.data ?? {};
      const mapped = {
        id: String(d.id ?? id),
        name: d.name ?? '',
        category: d.category,
        region: d.region,
        description: d.description ?? undefined,
        imageUrl: d.imageUrl ?? undefined,
        address: d.address,
        photos: d.images ?? [],
        eventStart: d.eventStart ?? undefined,
        eventEnd: d.eventEnd ?? undefined,
      } as unknown as DestinationDetailDto;
      return normalizePhotosField(normalizeImageField(mapped));
    }
    const res = await destinationControllerDetailV1(id);
    return normalizePhotosField(normalizeImageField(res));
  },

  // related 는 새 BE 미지원 → 구 generated mock 유지.
  getRelatedDestinations: async (id: string): Promise<DestinationDto[]> => {
    const res = await destinationControllerRelatedV1(id);
    return res.map(normalizeImageField);
  },

  // 신규 Spring BE: GET /destinations/random — 단일 category/region/season + size.
  // theme·멀티 category/region 필터는 새 BE 미지원 → season 은 theme.value, category/region 은
  // 단일 선택일 때만 전달(복수면 omit → 혼합), size 는 tournamentSize.
  fetchCandidates: async (
    config: TournamentConfig,
  ): Promise<DestinationDto[]> => {
    const res = await getRandom({
      season: config.theme.value as GetRandomSeason,
      category:
        config.categories.length === 1
          ? (config.categories[0] as GetRandomCategory)
          : undefined,
      region:
        config.selectedRegions?.length === 1
          ? (config.selectedRegions[0] as GetRandomRegion)
          : undefined,
      size: config.tournamentSize,
    });
    return (res.data ?? []).map((d) =>
      normalizeImageField({
        id: String(d.id),
        name: d.name ?? '',
        category: d.category,
        region: d.region,
        imageUrl: d.imageUrl ?? undefined,
      } as unknown as DestinationDto),
    );
  },

  /**
   * 토너먼트 결과 기록 — 신규 Spring BE: POST /mypage/tournament-history.
   *
   * 새 RecordTournamentRequestDto 는 winnerName 필수 + region/category → 호출부가
   * winner destination 정보를 전달. runnerUp/matchesPlayed 는 새 BE 미지원(랭킹/기록엔
   * winner 중심) → 미전송(결과 화면은 store 로 표시). 응답은 thin TournamentSummaryDto →
   * 정상 플로우는 store 사용, 여기선 id 만 사용(딥링크 cache key / ?id=).
   *
   * Idempotency-Key: api.post 로 직접 호출해 헤더 유지 (더블탭/재시도 이중 카운트 방지).
   */
  recordResult: async (
    input: {
      winnerId: string;
      runnerUpId: string | null;
      matchesPlayed: number;
      tournamentSize: number;
      winnerName?: string;
      region?: string;
      category?: string;
    },
    idempotencyKey?: string,
    signal?: AbortSignal,
  ): Promise<TournamentRecordDto> => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    const res = await api.post<ApiResponseTournamentSummaryDto>(
      '/mypage/tournament-history',
      {
        // 실 BE(정수 id)면 전송, mock(문자열 복합 id)이면 winnerName 기준.
        winnerId: /^\d+$/.test(input.winnerId)
          ? Number(input.winnerId)
          : undefined,
        winnerName: input.winnerName ?? '',
        region: input.region,
        category: input.category,
        tournamentSize: input.tournamentSize,
      },
      {
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        signal,
      },
    );
    const d = res.data?.data;
    // 정상 플로우는 store 사용 — 여기선 id 만 필요(딥링크 cache key).
    return { id: String(d?.id ?? '') } as unknown as TournamentRecordDto;
  },

  // getRecord(GET /tournaments/{id}) 딥링크 — 새 BE 무대응 → 구 generated mock 유지.
  // 실 BE 모드에선 cold 딥링크 복원 미지원(결과 화면이 store fallback, store 없으면 안내).
  getRecord: (id: string) => tournamentControllerGetV1(id),

  // 저장 목록 — 신규 Spring BE(엔벨로프) → 도메인 SavedTournamentDto[] 매핑.
  // 새 BE 는 luckyColor 미제공 → '' (SavedTournamentCard accentDot 비활성).
  listSaved: async (): Promise<SavedTournamentDto[]> => {
    const res = await beListSaved();
    return (res.data ?? []).map(
      (s) =>
        ({
          id: String(s.id),
          destination: normalizeImageField({
            id: String(s.destination?.id ?? ''),
            name: s.destination?.name ?? '',
            category: s.destination?.category,
            region: s.destination?.region,
            imageUrl: s.destination?.imageUrl ?? undefined,
          } as unknown as DestinationDto),
          luckyColor: '',
          savedAt: s.savedAt ?? '',
        }) as SavedTournamentDto,
    );
  },

  // 저장/삭제 — 실 BE 모드(정수 id)면 be/, mock(문자열 복합 id)이면 구 generated.
  saveToMypage: async (winnerId: string): Promise<void> => {
    if (/^\d+$/.test(winnerId)) {
      await beSave({ destinationId: Number(winnerId) });
    } else {
      await mypageControllerSaveV1({ destinationId: winnerId });
    }
  },

  removeSaved: async (savedId: string): Promise<void> => {
    if (/^\d+$/.test(savedId)) {
      await beDeleteSaved(Number(savedId));
    } else {
      await mypageControllerRemoveSavedV1(savedId);
    }
  },

  // history — 신규 Spring BE(TournamentSummaryDto flat) → 구 페이지 shape({items,nextCursor}) 매핑.
  // 소비처(TournamentHistorySection)는 id/category/completedAt/count/winnerName 만 사용.
  // 새 BE 는 winnerRegion/winnerId/theme 미제공(소비처 미사용) + cursor 없음(nextCursor null).
  listHistory: async (): Promise<TournamentHistoryPageDto> => {
    const res = await beHistory();
    const items = (res.data ?? []).map(
      (t) =>
        ({
          id: String(t.id),
          winnerName: t.winnerName ?? '',
          category: t.category,
          count: t.tournamentSize ?? 0,
          completedAt: t.completedAt ?? '',
          theme: null,
          winnerId: '',
        }) as unknown as TournamentHistoryItemDto,
    );
    return { items, nextCursor: null } as unknown as TournamentHistoryPageDto;
  },
};
