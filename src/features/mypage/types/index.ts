import type { Letter } from '@/features/letter/types';
import type { SavedTournament } from '@/features/tournament/types';
import type { TravelType } from '@/features/ranking/types';

export type MyProfile = {
  nickname: string;
  /** 기본 여부 (서버가 자동 생성한 닉네임이면 true) */
  isDefault?: boolean;
};

export type MyPageSummary = {
  profile: MyProfile;
  savedTournaments: SavedTournament[];  // 최대 10
  savedLetters: Letter[];
  likedLetters: Letter[];
  travelType: TravelType | null;
};

export type UpdateNicknameRequest = {
  nickname: string; // 1~10자 권장 (서버 검증)
};
