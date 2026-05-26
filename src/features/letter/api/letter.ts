import { api } from '@/services/api/client';
import type { Letter, SendLetterRequest } from '@/features/letter/types';

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
  send: async (data: SendLetterRequest) => {
    await api.post('/letters', data);
  },

  listReceived: async (): Promise<Letter[]> => {
    const res = await api.get<Letter[]>('/letters/received');
    return res.data;
  },

  listSent: async (): Promise<Letter[]> => {
    const res = await api.get<Letter[]>('/letters/sent');
    return res.data;
  },

  get: async (id: string): Promise<Letter> => {
    const res = await api.get<Letter>(`/letters/${id}`);
    return res.data;
  },

  toggleLike: async (id: string): Promise<Letter> => {
    const res = await api.post<Letter>(`/letters/${id}/like`);
    return res.data;
  },

  toggleSave: async (id: string): Promise<Letter> => {
    const res = await api.post<Letter>(`/letters/${id}/save`);
    return res.data;
  },

  remove: async (id: string) => {
    await api.delete(`/letters/${id}`);
  },
};
