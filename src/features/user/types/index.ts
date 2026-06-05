import type { RegionCode } from '@/constants/regions';

/**
 * 백엔드 스키마 확정 후엔 @/generated/api 에서 import 권장.
 * BE 실제 응답 (docs/API_CONTRACT.md):
 *   { id, username, nickname, email, homeRegion, isOnboarded, avatarUrl, travelType }
 */
export type User = {
  id: string;
  username: string;
  email: string;
  nickname: string;
  /** 온보딩 완료 여부 — AuthBootstrap이 false면 /onboarding으로 redirect */
  isOnboarded: boolean;
  /** 거주지/대표 위치. 충북 시군 코드. 미설정 시 BE 가 'cheongju' 기본값 채워서 보냄 */
  homeRegion: RegionCode;
  /** 프로필 아바타 URL (없으면 null) */
  avatarUrl: string | null;
  /** 여행 유형 — 테스트 완료된 경우. 미완료면 null */
  travelType: { code: string; title: string; emoji: string } | null;
};
