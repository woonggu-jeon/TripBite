import { api } from '@/services/api/client';
import type {
  MyPageSummary,
  MyProfile,
  UpdateNicknameRequest,
} from '@/features/mypage/types';

/**
 * 마이페이지 API
 *
 * 엔드포인트 예시:
 *   GET   /mypage                — 전체 요약 (profile + saved + liked + travelType)
 *   PATCH /mypage/profile        — 닉네임 변경
 *   GET   /mypage/letters/saved  — 저장한 편지 목록
 *   GET   /mypage/letters/liked  — 좋아요한 편지 목록
 *
 * 토너먼트 우승지 저장/삭제는 features/tournament/api/tournament.ts 에 있음.
 *
 * "전체 요약" GET /mypage 는 첫 진입 시 한 번에 가져와서 비용 줄이는 패턴.
 * 개별 섹션 무효화는 각 mutation 후 invalidateQueries로 처리.
 */
export const mypageApi = {
  getSummary: async (): Promise<MyPageSummary> => {
    const res = await api.get<MyPageSummary>('/mypage');
    return res.data;
  },

  updateNickname: async (data: UpdateNicknameRequest): Promise<MyProfile> => {
    const res = await api.patch<MyProfile>('/mypage/profile', data);
    return res.data;
  },
};
