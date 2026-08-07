// 신규 Spring BE 지원: 편지 전체(list/detail/like/save/delete).
// compose(POST /letters)는 Idempotency-Key 헤더 위해 api.post 직접 호출.
import {
  _delete as beDelete,
  getById as beGetById,
  getLiked as beGetLiked,
  getReceived as beGetReceived,
  getSaved as beGetSaved,
  getSent as beGetSent,
  like as beLike,
  save1 as beSave,
} from '@/api/be/letter/letter';
import type {
  ApiResponseLetterDto,
  LetterDto as BeLetterDto,
  LetterPageDto as BeLetterPageDto,
} from '@/api/be/schemas';
import type {
  ComposeLetterDto,
  LetterDto,
  LetterPageDto,
} from '@/types/api-domain';
import { api } from '@/services/api/client';

const PAGE_SIZE = 10;

/** 신규 BE LetterDto(id number) → 도메인 LetterDto(id string). author 기본값 보강. */
function mapLetter(l: BeLetterDto): LetterDto {
  return {
    id: String(l.id ?? ''),
    body: l.body ?? '',
    author: {
      nickname: l.author?.nickname ?? '',
      location: l.author?.location ?? '',
    },
    arrivedAt: l.arrivedAt ?? null,
    createdAt: l.createdAt ?? '',
    isMine: l.isMine ?? false,
    liked: l.liked ?? false,
    saved: l.saved ?? false,
    likeCount: l.likeCount ?? 0,
    read: l.read ?? false,
  };
}

function mapPage(p: BeLetterPageDto | null | undefined): LetterPageDto {
  return {
    items: (p?.items ?? []).map(mapLetter),
    nextCursor: p?.nextCursor ?? null,
  };
}

/**
 * 다섯글자 편지 API — 신규 Spring BE(be/) 연동.
 *
 * 서버 책임: 본인 제외 1명 매칭(작성 후 랜덤 지연), 미저장 편지 자동 삭제.
 *
 * id 정책("실 BE 모드만 정수"): detail/like/save/remove 는 숫자 id → be/,
 * 문자열(mock seed) → 구 generated. list/compose 는 항상 be/(엔벨로프).
 */
export const letterApi = {
  /**
   * 편지 작성 (POST /letters). Idempotency-Key 유지 위해 api.post 직접 호출.
   * 도메인 ComposeLetterDto → 신규 ComposeLetterRequestDto.
   * BE 계약(2026-08-07): body(5자) + location{regionCode(필수 enum), label} + isAnonymous.
   * (구 `anonymous` 필드명 → 새 `isAnonymous`; regionCode·isAnonymous 는 non-null 필수.)
   */
  send: async (
    data: ComposeLetterDto,
    idempotencyKey?: string,
    signal?: AbortSignal,
  ): Promise<LetterDto> => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    const res = await api.post<ApiResponseLetterDto>(
      '/letters',
      {
        body: data.body,
        location: data.location
          ? { regionCode: data.location.regionCode, label: data.location.label }
          : undefined,
        isAnonymous: data.isAnonymous,
      },
      {
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        signal,
      },
    );
    return mapLetter(res.data?.data ?? {});
  },

  listReceived: async (cursor = 0): Promise<LetterPageDto> =>
    mapPage((await beGetReceived({ cursor, size: PAGE_SIZE })).data),
  listSent: async (cursor = 0): Promise<LetterPageDto> =>
    mapPage((await beGetSent({ cursor, size: PAGE_SIZE })).data),
  listLiked: async (cursor = 0): Promise<LetterPageDto> =>
    mapPage((await beGetLiked({ cursor, size: PAGE_SIZE })).data),
  listSaved: async (cursor = 0): Promise<LetterPageDto> =>
    mapPage((await beGetSaved({ cursor, size: PAGE_SIZE })).data),

  // Spring be/ 단일화 (구 NestJS 분기 제거). id 는 정수 — mock seed 도 정수 id 사용.
  get: async (id: string): Promise<LetterDto> =>
    mapLetter((await beGetById(Number(id))).data ?? {}),

  toggleLike: async (id: string): Promise<LetterDto> =>
    mapLetter((await beLike(Number(id))).data ?? {}),

  toggleSave: async (id: string): Promise<LetterDto> =>
    mapLetter((await beSave(Number(id))).data ?? {}),

  remove: async (id: string): Promise<void> => {
    await beDelete(Number(id));
  },
};
