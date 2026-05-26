import type { RegionCode } from '@/constants/regions';

/**
 * 백엔드 스키마 확정 후엔 @/generated/api 에서 import 권장.
 * 여기서는 fallback 타입.
 */
export type User = {
  id: string;
  email: string;
  nickname: string;
  /** 온보딩 완료 여부 — AuthBootstrap이 false면 /onboarding으로 redirect */
  isOnboarded?: boolean;
  /** 거주지/대표 위치 (선택). 충북 시군 코드. */
  homeRegion?: RegionCode;
  /** 여행 유형 코드 (테스트 완료 시) */
  travelTypeCode?: string;
  role?: 'user' | 'admin';
  createdAt?: string;
};
