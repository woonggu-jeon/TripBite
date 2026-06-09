'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tournamentApi } from '@/features/tournament/api/tournament';
import { CACHE } from '@/lib/cache';
import type {
  DestinationCategory,
  SavedTournament,
  TournamentConfig,
  TournamentCount,
  TournamentTheme,
} from '@/features/tournament/types';

/**
 * Candidates query key — BE 호출에 실제 영향 주는 param 만 포함.
 * count 는 UI 표시용 (지도 시군 갯수) 이라 cache scope 와 무관.
 */
type CandidateKeyShape = {
  theme: TournamentTheme;
  categories: DestinationCategory[];
  regions: string[] | undefined;
  tournamentSize: TournamentCount | undefined;
};

export const tournamentKeys = {
  all: ['tournament'] as const,
  candidates: (config: CandidateKeyShape) =>
    [...tournamentKeys.all, 'candidates', config] as const,
  saved: () => [...tournamentKeys.all, 'saved'] as const,
  history: () => [...tournamentKeys.all, 'history'] as const,
  record: (id: string) => [...tournamentKeys.all, 'record', id] as const,
  destinationDetail: (id: string) =>
    [...tournamentKeys.all, 'destination', id] as const,
  destinationRelated: (id: string) =>
    [...tournamentKeys.all, 'destination', id, 'related'] as const,
};

/**
 * 설정에 맞는 후보 여행지 풀 조회
 *
 * enabled: **tournamentSize 까지 결정된 후에만** fetch.
 *   theme/categories/count/region 외에 tournamentSize 도 BE 쿼리에 영향
 *   (매치업 size 만큼 destinations 필요) → 미결정 상태에서 미리 fetch 하면
 *   부족한 pool 받을 위험. 사용자가 play phase 의 tournamentSize 선택 후
 *   setTournamentSize 호출 → enabled true → fetch 1회.
 *
 * tournamentSize 는 query key 에 포함 — 다른 size 선택 시 새 fetch.
 * (사용자가 다른 size 로 토너먼트 다시 시작하는 시나리오 지원)
 */
export function useTournamentCandidates(config: TournamentConfig | null) {
  // fetch 조건 — 둘 다 필요:
  //   1) selectedRegions: map phase 에서 N 시군 결정 후 set
  //   2) tournamentSize: tournamentSize phase 에서 M 선택 후 set
  // 둘 다 충족돼야 BE 한테 의미 있는 query 됨.
  const hasRegions =
    !!config &&
    Array.isArray(config.selectedRegions) &&
    config.selectedRegions.length > 0;
  const hasSize =
    !!config &&
    typeof config.tournamentSize === 'number' &&
    config.tournamentSize > 0;
  const enabled = hasRegions && hasSize;
  return useQuery({
    queryKey:
      config && enabled
        ? tournamentKeys.candidates({
            theme: config.theme,
            categories: config.categories,
            regions: config.selectedRegions,
            tournamentSize: config.tournamentSize,
          })
        : ['tournament', 'candidates', 'idle'],
    queryFn: () => tournamentApi.fetchCandidates(config!),
    enabled,
    ...CACHE.session, // 한 세션 동안 고정 (Infinity + 1h gc)
  });
}

export function useSavedTournaments() {
  return useQuery({
    queryKey: tournamentKeys.saved(),
    queryFn: tournamentApi.listSaved,
    ...CACHE.user, // 본인 저장 목록
  });
}

/**
 * 토너먼트 결과 기록 — Play 종료 시 fire-and-forget mutation.
 * 응답 record 는 store / URL ?id= 에 사용 가능.
 *
 * 선택 인증 (BE Swagger §Tournament): 쿠키 있으면 계정 귀속 (히스토리/충북 마스터),
 * 없으면 게스트 익명 기록 (랭킹 집계엔 반영). 401 응답 없음 — useRequireAuth 불필요.
 *
 * 실패해도 결과 화면 진입 자체를 막지 않음 (silent fail). retry 정책 없음.
 */
export function useRecordTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tournamentApi.recordResult,
    onSuccess: (record) => {
      qc.setQueryData(tournamentKeys.record(record.id), record);
      qc.invalidateQueries({ queryKey: tournamentKeys.history() });
    },
  });
}

/**
 * Deep-link 진입 시 record 조회 — `/tournament/result?id=...`.
 * id 없으면 disabled.
 */
export function useTournamentRecord(id: string | null | undefined) {
  return useQuery({
    queryKey: id ? tournamentKeys.record(id) : ['tournament', 'record', 'idle'],
    queryFn: () => tournamentApi.getRecord(id!),
    enabled: !!id,
    ...CACHE.slow,
  });
}

export function useSaveTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tournamentApi.saveToMypage,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tournamentKeys.saved() });
    },
  });
}

/**
 * 저장 우승지 삭제 — 마이페이지 저장 목록 상세에서 하트 클릭 시.
 * Optimistic: 즉시 cache 에서 제거 → 사용자 피드백 즉각. 실패 시 invalidate 로 원복.
 */
export function useUnsaveTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tournamentApi.removeSaved,
    onMutate: async (savedId: string) => {
      await qc.cancelQueries({ queryKey: tournamentKeys.saved() });
      const previous = qc.getQueryData<SavedTournament[]>(
        tournamentKeys.saved(),
      );
      qc.setQueryData<SavedTournament[]>(tournamentKeys.saved(), (old) =>
        (old ?? []).filter((s) => s.id !== savedId),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        qc.setQueryData(tournamentKeys.saved(), context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: tournamentKeys.saved() });
    },
  });
}

/**
 * 여행지 상세(풍부한 메타) — 우승자 화면 등에서 부가 정보 노출용.
 *
 * - id 유효할 때만 enabled
 * - CACHE.slow: 상세는 자주 안 바뀌므로 길게 (30min stale)
 * - 응답 필드 모두 optional → UI 는 있는 것만 렌더
 */
export function useDestinationDetail(id: string | undefined) {
  return useQuery({
    queryKey: id
      ? tournamentKeys.destinationDetail(id)
      : ['tournament', 'destination', 'idle'],
    queryFn: () => tournamentApi.getDestinationDetail(id!),
    enabled: !!id,
    ...CACHE.slow,
  });
}

/**
 * 관련 여행지 — 같은 시군의 다른 destination 6개.
 * Destination 상세 페이지 하단 "이 시군의 다른 여행지" 섹션에서 사용.
 */
export function useRelatedDestinations(id: string | undefined) {
  return useQuery({
    queryKey: id
      ? tournamentKeys.destinationRelated(id)
      : ['tournament', 'destination', 'idle', 'related'],
    queryFn: () => tournamentApi.getRelatedDestinations(id!),
    enabled: !!id,
    ...CACHE.slow,
  });
}

/**
 * 토너먼트 기록 — 사용자의 누적 토너먼트 결과 목록.
 *
 * mypage 의 "토너먼트 기록" 섹션에서 사용 (InfiniteList).
 * 백엔드: GET /mypage/tournament-history → `{ items, nextCursor }`.
 * 현재 mock 은 단일 페이지 반환 (cursor 미지원) — BE 도입 시 InfiniteList 로 확장.
 */
export function useTournamentHistory() {
  return useQuery({
    queryKey: tournamentKeys.history(),
    queryFn: tournamentApi.listHistory,
    ...CACHE.user,
  });
}
