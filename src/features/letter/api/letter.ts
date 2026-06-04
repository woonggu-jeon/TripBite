import { api } from '@/services/api/client';
import { safeParseResponse } from '@/lib/safe-parse-response';
import {
  letterPageSchema,
  letterDetailSchema,
} from '@/features/letter/schemas/letter-response';
import type {
  Letter,
  LetterPage,
  SendLetterRequest,
} from '@/features/letter/types';

const PAGE_LIMIT = 10;

async function fetchLetterPage(
  url: string,
  cursor: number,
): Promise<LetterPage> {
  const res = await api.get<unknown>(url, {
    params: { cursor, limit: PAGE_LIMIT },
  });
  return safeParseResponse(
    letterPageSchema,
    res.data,
    `GET ${url}`,
  ) as LetterPage;
}

/**
 * 다섯글자 편지 API
 *
 * 서버 책임:
 *   - 보낸 위치 추론 (geolocation 권한 동의 또는 IP)
 *   - 본인 제외 1명의 사용자에게 1회만 도착하도록 매칭
 *   - 도착 시각 큐잉 (실 도착은 랜덤 지연)
 *   - 미저장 편지 3일 후 자동 삭제
 *
 * 백엔드 엔드포인트 예시:
 *   POST   /letters                 — 편지 보내기
 *   GET    /letters/received        — 받은 편지 목록
 *   GET    /letters/sent            — 내가 보낸 편지 목록
 *   GET    /letters/:id             — 편지 상세
 *   POST   /letters/:id/like        — 좋아요 토글
 *   POST   /letters/:id/save        — 저장 토글 (또는 별도 unsave)
 *   DELETE /letters/:id             — 편지 삭제 (수신자 권한)
 */
export const letterApi = {
  // POST 응답으로 Letter 받음 → ?id= deep-link / sent 페이지 재진입 가능.
  send: async (data: SendLetterRequest): Promise<Letter> => {
    const res = await api.post<unknown>('/letters', data);
    return safeParseResponse(
      letterDetailSchema,
      res.data,
      'POST /letters',
    ) as Letter;
  },

  listReceived: (cursor = 0) => fetchLetterPage('/letters/received', cursor),
  listSent: (cursor = 0) => fetchLetterPage('/letters/sent', cursor),
  listLiked: (cursor = 0) => fetchLetterPage('/letters/liked', cursor),
  listSaved: (cursor = 0) => fetchLetterPage('/letters/saved', cursor),

  get: async (id: string): Promise<Letter> => {
    const res = await api.get<unknown>(`/letters/${id}`);
    return safeParseResponse(
      letterDetailSchema,
      res.data,
      `GET /letters/${id}`,
    ) as Letter;
  },

  toggleLike: async (id: string): Promise<Letter> => {
    const res = await api.post<unknown>(`/letters/${id}/like`);
    return safeParseResponse(
      letterDetailSchema,
      res.data,
      `POST /letters/${id}/like`,
    ) as Letter;
  },

  toggleSave: async (id: string): Promise<Letter> => {
    const res = await api.post<unknown>(`/letters/${id}/save`);
    return safeParseResponse(
      letterDetailSchema,
      res.data,
      `POST /letters/${id}/save`,
    ) as Letter;
  },

  remove: async (id: string) => {
    await api.delete(`/letters/${id}`);
  },
};
