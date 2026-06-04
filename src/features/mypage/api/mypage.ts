import { api } from '@/services/api/client';
import { safeParseResponse } from '@/lib/safe-parse-response';
import type { RegionCode } from '@/constants/regions';
import type {
  MyPageSummary,
  MyProfile,
  UpdateNicknameRequest,
} from '@/features/mypage/types';
import {
  myPageSummarySchema,
  myProfileSchema,
  stampsResponseSchema,
} from '@/features/mypage/schemas/mypage';

export type StampsResponse = {
  visited: RegionCode[];
  total: number;
};

/**
 * 마이페이지 API
 *
 * 엔드포인트 예시:
 *   GET   /mypage                — 전체 요약 (profile + saved + liked + travelType)
 *   PATCH /mypage/profile        — 닉네임 변경
 *   GET   /mypage/stamps         — 도장책 진행률
 *
 * 토너먼트 우승지 저장/삭제는 features/tournament/api/tournament.ts 에 있음.
 *
 * "전체 요약" GET /mypage 는 첫 진입 시 한 번에 가져와서 비용 줄이는 패턴.
 * 개별 섹션 무효화는 각 mutation 후 invalidateQueries로 처리.
 *
 * 응답은 safeParseResponse 로 runtime 검증 — schema mismatch 시 dev 콘솔 warn.
 * BE Swagger 도착 시 orval 생성 client + schema 로 교체.
 */
export const mypageApi = {
  getSummary: async (): Promise<MyPageSummary> => {
    const res = await api.get<unknown>('/mypage');
    return safeParseResponse(
      myPageSummarySchema,
      res.data,
      'GET /mypage',
    ) as MyPageSummary;
  },

  updateNickname: async (data: UpdateNicknameRequest): Promise<MyProfile> => {
    const res = await api.patch<unknown>('/mypage/profile', data);
    return safeParseResponse(
      myProfileSchema,
      res.data,
      'PATCH /mypage/profile',
    );
  },

  getStamps: async (): Promise<StampsResponse> => {
    const res = await api.get<unknown>('/mypage/stamps');
    return safeParseResponse(
      stampsResponseSchema,
      res.data,
      'GET /mypage/stamps',
    ) as StampsResponse;
  },
};
