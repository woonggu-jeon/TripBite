// Spring be/ 지원: stamps + updateMe(닉네임) + summary(GET /me 재구성) + avatar(2026-08).
// saved 목록/저장/삭제는 tournament 어댑터가 be/ 로 담당.
import {
  deleteAvatar as beDeleteAvatar,
  getMe as beGetMe,
  updateMe as beUpdateMe,
  uploadAvatar as beUploadAvatar,
} from '@/api/be/me/me';
import { getStamps as beGetStamps } from '@/api/be/mypage/mypage';
import type { RegionCode } from '@/constants/regions';
import { travelTypeFromCode } from '@/constants/travel-types';
import { api } from '@/services/api/client';
import type {
  MypageSummaryDto,
  StampsDto,
  UpdateProfileDto,
} from '@/types/api-domain';

/**
 * 마이페이지 API.
 *   - summary: Spring 은 GET /mypage 미지원(500) → GET /me 로 재구성 (mock 모드는 MSW /mypage)
 *   - 닉네임: PATCH /me (be/)
 *   - 도장책: GET /mypage/stamps (be/)
 *   - avatar: POST/DELETE /me/avatar (be/) — 응답의 avatarUrl 이 정식 source.
 */
export const mypageApi = {
  getSummary: async (signal?: AbortSignal): Promise<MypageSummaryDto> => {
    // mock 모드: MSW /mypage 핸들러 사용. real-BE: Spring 미지원이라 GET /me 로 재구성.
    if (process.env.NEXT_PUBLIC_USE_MSW === 'true') {
      return (await api.get<MypageSummaryDto>('/mypage', { signal })).data;
    }
    const res = await beGetMe(signal);
    const u = res.data;
    return {
      profile: { nickname: u?.nickname ?? '', isDefault: !u?.nickname },
      // Spring 은 travelType 을 코드 문자열로 반환 → 정적 유형맵으로 재구성.
      travelType: travelTypeFromCode(u?.travelType),
    };
  },
  updateNickname: (data: UpdateProfileDto) =>
    beUpdateMe({ nickname: data.nickname }),
  getStamps: async (signal?: AbortSignal): Promise<StampsDto> => {
    const res = await beGetStamps(signal);
    return {
      visited: (res.data?.visited ?? []) as RegionCode[],
      total: res.data?.total ?? 0,
    };
  },
  // POST /me/avatar (multipart) → ApiResponse<{ avatarUrl }>. 새 avatarUrl 반환.
  updateAvatar: async (file: File): Promise<string | null> => {
    const res = await beUploadAvatar({ file });
    return res.data?.avatarUrl ?? null;
  },
  // DELETE /me/avatar → 기본 아바타로. 응답 avatarUrl 은 null.
  removeAvatar: async (): Promise<void> => {
    await beDeleteAvatar();
  },
};
