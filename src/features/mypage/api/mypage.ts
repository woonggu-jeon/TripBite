// Spring be/ 지원: stamps + updateMe(닉네임) + summary(GET /me 재구성).
// avatar 는 Spring 미지원 → 직접 api 호출(MSW mock). saved 목록/저장/삭제는
// tournament 어댑터가 be/ 로 담당 → mypageApi 에선 미사용이라 제거.
import { getMe as beGetMe, updateMe as beUpdateMe } from '@/api/be/me/me';
import { getStamps as beGetStamps } from '@/api/be/mypage/mypage';
import { api } from '@/services/api/client';
import type {
  MypageSummaryDto,
  StampsDto,
  TravelTypeDto,
  UpdateProfileDto,
} from '@/types/api-domain';
import type { RegionCode } from '@/constants/regions';

/**
 * 마이페이지 API.
 *   - summary: Spring 은 GET /mypage 미지원(500) → GET /me 로 재구성 (mock 모드는 MSW /mypage)
 *   - 닉네임: PATCH /me (be/)
 *   - 도장책: GET /mypage/stamps (be/)
 *   - avatar: POST/DELETE /me/avatar — ⚠️ Spring 미지원, MSW mock (BE 추가 필요)
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
      travelType: u?.travelType
        ? ({ code: u.travelType } as TravelTypeDto)
        : null,
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
  // ⚠️ Spring 미지원 (me/avatar) — MSW mock. BE 추가 필요 (BE_REQUEST 참조).
  updateAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/me/avatar', fd).then((r) => r.data);
  },
  removeAvatar: () => api.delete('/me/avatar').then((r) => r.data),
};
