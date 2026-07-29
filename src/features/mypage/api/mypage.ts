// 신규 Spring BE 지원: stamps + updateMe(닉네임). (summary/avatar 는 미지원 → 구 generated mock 유지)
import { updateMe as beUpdateMe } from '@/api/be/me/me';
import { getStamps as beGetStamps } from '@/api/be/mypage/mypage';
import {
  meControllerRemoveAvatarV1,
  meControllerUploadAvatarV1,
} from '@/api/generated/me/me';
import {
  mypageControllerListSavedV1,
  mypageControllerRemoveSavedV1,
  mypageControllerSaveV1,
  mypageControllerSummaryV1,
} from '@/api/generated/mypage/mypage';
import type { UpdateProfileDto } from '@/api/generated/schemas';
import type { StampsDto } from '@/api/generated/schemas';
import type { RegionCode } from '@/constants/regions';

/**
 * 마이페이지 API — orval 가 BE swagger 로 자동 생성한 client functions wrap.
 *
 * 엔드포인트:
 *   GET    /mypage                       — summary (profile + saved + liked + travelType)
 *   PATCH  /mypage/profile                — 닉네임 변경 (UpdateProfileDto)
 *   GET    /mypage/stamps                 — 도장책 진행률 (StampsDto)
 *   GET    /mypage/tournaments            — 저장 우승지 목록
 *   POST   /mypage/tournaments            — 저장
 *   DELETE /mypage/tournaments/:id        — 삭제
 *   POST   /me/avatar (multipart, file)   — 프로필 이미지 업로드 (AvatarResponseDto)
 *   DELETE /me/avatar                     — 프로필 이미지 제거 (AvatarResponseDto)
 *
 * 마이그 패턴 (얕은): hook 의 mutationFn / queryFn 만 generated 함수 호출로 교체.
 * onSuccess (cache invalidate / toast) 등 FE 흐름은 hook 안에 유지.
 */
export const mypageApi = {
  getSummary: mypageControllerSummaryV1,
  // 신규 Spring BE: PATCH /me (UpdateMeRequestDto). 닉네임만 전달.
  updateNickname: (data: UpdateProfileDto) =>
    beUpdateMe({ nickname: data.nickname }),
  // 신규 Spring BE: GET /mypage/stamps — ApiResponse<StampsDto>. visited 는 region code 배열(구/신 동일).
  getStamps: async (signal?: AbortSignal): Promise<StampsDto> => {
    const res = await beGetStamps(signal);
    return {
      visited: (res.data?.visited ?? []) as RegionCode[],
      total: res.data?.total ?? 0,
    };
  },
  listSaved: mypageControllerListSavedV1,
  saveTournament: mypageControllerSaveV1,
  removeSaved: mypageControllerRemoveSavedV1,
  // multipart — generated 가 FormData 생성 + 'multipart/form-data' Content-Type 자동.
  updateAvatar: (file: File) => meControllerUploadAvatarV1({ file }),
  removeAvatar: meControllerRemoveAvatarV1,
};
