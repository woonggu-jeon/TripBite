/**
 * 마이페이지 도메인 type — orval generated DTO alias.
 *
 * 호출처는 도메인 명 (`MyPageSummary`/`MyProfile`/`UpdateNicknameRequest`) 그대로,
 * 진실의 원천은 generated DTO. BE swagger 변경 시 자동 반영.
 */
import type {
  MypageSummaryDto,
  ProfileDto,
  UpdateProfileDto,
} from '@/api/generated/schemas';

export type MyProfile = ProfileDto;
export type MyPageSummary = MypageSummaryDto;
export type UpdateNicknameRequest = UpdateProfileDto;
