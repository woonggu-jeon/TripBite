// 신규 Spring BE 지원: 편지 전체(list/detail/like/save/delete).
// compose(POST /letters)는 Idempotency-Key 헤더 위해 api.post 직접 호출.
import {
  getReceived as beGetReceived,
  getSent as beGetSent,
  getLiked as beGetLiked,
  getSaved as beGetSaved,
  getById as beGetById,
  like as beLike,
  save1 as beSave,
  _delete as beDelete,
} from '@/api/be/letter/letter';
import type {
  ApiResponseLetterDto,
  LetterDto as BeLetterDto,
  LetterPageDto as BeLetterPageDto,
} from '@/api/be/schemas';
// mock(문자열 복합 id) 경로용 — 실 BE 모드(정수 id)는 be/, mock 은 구 generated.
import {
  letterControllerGetV1,
  letterControllerLikeV1,
  letterControllerRemoveV1,
  letterControllerSaveV1,
} from '@/api/generated/letters/letters';
import { api } from '@/services/api/client';
import type {
  ComposeLetterDto,
  LetterDto,
  LetterPageDto,
} from '@/api/generated/schemas';

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
   * 도메인 ComposeLetterDto → 신규 ComposeLetterRequestDto (isAnonymous → anonymous,
   * location → { regionCode, label }).
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
        anonymous: data.isAnonymous,
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

  get: async (id: string): Promise<LetterDto> =>
    /^\d+$/.test(id)
      ? mapLetter((await beGetById(Number(id))).data ?? {})
      : letterControllerGetV1(id),

  toggleLike: async (id: string): Promise<LetterDto> =>
    /^\d+$/.test(id)
      ? mapLetter((await beLike(Number(id))).data ?? {})
      : letterControllerLikeV1(id),

  toggleSave: async (id: string): Promise<LetterDto> =>
    /^\d+$/.test(id)
      ? mapLetter((await beSave(Number(id))).data ?? {})
      : letterControllerSaveV1(id),

  remove: async (id: string): Promise<void> => {
    if (/^\d+$/.test(id)) await beDelete(Number(id));
    else await letterControllerRemoveV1(id);
  },
};
