import {
  letterControllerGetV1,
  letterControllerLikeV1,
  letterControllerLikedV1,
  letterControllerReceivedV1,
  letterControllerRemoveV1,
  letterControllerSaveV1,
  letterControllerSavedV1,
  letterControllerSentV1,
} from '@/api/generated/letters/letters';
import { api } from '@/services/api/client';
import type { ComposeLetterDto, LetterDto } from '@/api/generated/schemas';

const PAGE_LIMIT = '10';

function pageParams(cursor: number) {
  // generated Params 가 string only — number → string 변환.
  return { cursor: String(cursor), limit: PAGE_LIMIT };
}

/**
 * 다섯글자 편지 API — orval 가 BE swagger 로 자동 생성한 client functions wrap.
 *
 * 서버 책임:
 *   - 본인 제외 1명에게 1회 매칭 (작성 후 15~60분 랜덤 지연)
 *   - 미저장 편지 3일 후 자동 삭제
 *
 * 엔드포인트:
 *   POST   /letters                  — 작성 (ComposeLetterDto)
 *   GET    /letters/{received|sent|liked|saved}?cursor=&limit=  → LetterPageDto
 *   GET    /letters/:id              → LetterDto
 *   POST   /letters/:id/like         → LetterDto (토글)
 *   POST   /letters/:id/save         → LetterDto (토글)
 *   DELETE /letters/:id              → 204
 */
export const letterApi = {
  /**
   * 편지 작성 (POST /v1/letters).
   *
   * Idempotency-Key (BE 합의 2026-06-23): 호출 1회 = UUID 1개 → 같은 키
   * 24h 내 동일 결과 반환 → 네트워크 재시도 / 더블 submit 시 letter 중복
   * 생성 방지. 토너먼트 `recordResult` 와 동일 규약.
   * generated `letterControllerComposeV1` 는 axios config override 불가
   * (signal 만 받음) — generated 우회 후 axios 직접 호출. 다른 endpoint 는
   * generated 그대로.
   */
  send: async (
    data: ComposeLetterDto,
    idempotencyKey?: string,
    signal?: AbortSignal,
  ): Promise<LetterDto> => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    const res = await api.post<LetterDto>('/v1/letters', data, {
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      signal,
    });
    return res.data;
  },
  listReceived: (cursor = 0) => letterControllerReceivedV1(pageParams(cursor)),
  listSent: (cursor = 0) => letterControllerSentV1(pageParams(cursor)),
  listLiked: (cursor = 0) => letterControllerLikedV1(pageParams(cursor)),
  listSaved: (cursor = 0) => letterControllerSavedV1(pageParams(cursor)),
  get: letterControllerGetV1,
  toggleLike: letterControllerLikeV1,
  toggleSave: letterControllerSaveV1,
  remove: letterControllerRemoveV1,
};
