/**
 * FE 도메인 API 타입 — 단일 소스.
 *
 * 구 NestJS `@/api/generated/schemas` 제거(2026-08) 후 대체:
 *   - Spring(be/) swagger 에 **있는** DTO → `@/api/be/schemas` 재export
 *   - Spring 에 **없는** FE 도메인 타입 → 여기 정의 (구 generated 정의 이관)
 *
 * 컴포넌트/어댑터는 이 모듈만 참조한다 (`@/types/api-domain`).
 */
import type { RegionCode } from '@/constants/regions';

export type { RegionCode } from '@/constants/regions';

// ── FE 도메인 DTO (required shape) ──
// wire(be/) 타입은 optional/nullable 이라 컴포넌트가 직접 쓰기 불편 → 어댑터가
// be/ → 아래 도메인 shape 로 coerce(?? 기본값)해서 반환. 컴포넌트는 이 타입만 사용.
export interface DestinationDto {
  category: DestinationCategory;
  region: RegionCode;
  id: string;
  name: string;
  imageUrl?: string;
}

// Spring DestinationDetailDto 파생 뷰 (필드명 Spring 그대로).
// Spring 제공: id·name·category·region·imageUrl·images·address·type·admissionFee·
//   description·tags·eventStart·eventEnd. (coords/phone/website/openingHours/
//   restDate/parking 은 Spring 미제공 — 삭제.)
export interface DestinationDetailDto {
  category: DestinationCategory;
  region: RegionCode;
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  address?: string;
  type?: string;
  admissionFee?: string;
  tags?: string[];
  images: string[];
  eventStart?: string;
  eventEnd?: string;
}

export interface LetterAuthorDto {
  nickname: string;
  location: string;
}

export interface LetterDto {
  id: string;
  body: string;
  author: LetterAuthorDto;
  arrivedAt: string | null;
  createdAt: string;
  isMine: boolean;
  liked: boolean;
  saved: boolean;
  likeCount: number;
  read: boolean;
}

export interface LetterPageDto {
  items: LetterDto[];
  nextCursor: number | null;
}

// Spring SavedTournamentDto: id·destination·savedAt (luckyColor 미제공 — 삭제).
export interface SavedTournamentDto {
  id: string;
  destination: DestinationDto;
  savedAt: string;
}

export interface StampsDto {
  visited: RegionCode[];
  total: number;
}

export interface QuizOptionDto {
  id: string;
  text: string;
}

export interface QuizQuestionDto {
  id: string;
  text: string;
  options: QuizOptionDto[];
}

// ── Spring 미지원 — FE 도메인 타입 (구 generated 이관) ──
export const DestinationCategory = {
  attraction: 'attraction',
  festival: 'festival',
  experience: 'experience',
} as const;
export type DestinationCategory =
  (typeof DestinationCategory)[keyof typeof DestinationCategory];

export const Season = {
  spring: 'spring',
  summer: 'summer',
  autumn: 'autumn',
  winter: 'winter',
} as const;
export type Season = (typeof Season)[keyof typeof Season];

export const TravelTypeCode = {
  adventurer: 'adventurer',
  explorer: 'explorer',
  relaxer: 'relaxer',
  foodie: 'foodie',
} as const;
export type TravelTypeCode =
  (typeof TravelTypeCode)[keyof typeof TravelTypeCode];

export interface RegionSummaryDto {
  code: RegionCode;
  heroImage?: string;
  description: string;
  popularity: number;
}

// Spring TravelTypeResultDto 파생 뷰: code·title·emoji·description·tags.
// (recommended·compatibility 는 Spring 미제공 — 삭제. keywords→tags.)
export interface TravelTypeDto {
  code: TravelTypeCode;
  title: string;
  description: string;
  emoji: string;
  tags: string[];
}

export interface LetterLocationDto {
  label: string;
  region?: string;
  regionCode?: string;
  lat?: number;
  latitude?: number;
  lng?: number;
  longitude?: number;
  accuracy?: number;
}

export interface ComposeLetterDto {
  body: string;
  location: LetterLocationDto;
  isAnonymous?: boolean;
}

// Spring UserResponseDto 파생 뷰 — FE 소비 필드만.
// (homeRegion·isOnboarded·avatarUrl·travelType(brief) 는 Spring 미제공/미표시 — 삭제.
//  아바타는 Spring 미지원이라 닉네임 이니셜 fallback 사용.)
export interface UserDto {
  id: string;
  username: string;
  nickname: string;
  email: string;
}

export interface ProfileDto {
  nickname: string;
  isDefault: boolean;
}

export interface MypageSummaryDto {
  profile: ProfileDto;
  travelType: TravelTypeDto | null;
}

export interface UpdateProfileDto {
  nickname: string;
}

// 인앱 알림 — 도메인 shape (id 는 string). be/ AppNotificationDto(id:number)를
// notification 어댑터가 이 shape 로 정규화.
export const AppNotificationType = {
  letterreceived: 'letter.received',
  letterliked: 'letter.liked',
  letterdelivered: 'letter.delivered',
  tournamentshared: 'tournament.shared',
  event: 'event',
  security: 'security',
} as const;
export type AppNotificationType =
  (typeof AppNotificationType)[keyof typeof AppNotificationType];

export interface AppNotificationDto {
  type: AppNotificationType;
  id: string;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationListDto {
  items: AppNotificationDto[];
  unreadCount: number;
  nextCursor: number | null;
}

// ── auth 폼 DTO ──
export interface LoginDto {
  username: string;
  password: string;
}
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
export interface FindIdDto {
  email: string;
}
export interface ForgotPasswordDto {
  username: string;
  email: string;
}
export interface ResetPasswordDto {
  token: string;
  password: string;
}

export interface RegionContentDto {
  type: DestinationCategory;
  region: RegionCode;
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

// Spring TournamentSummaryDto: id·winnerName·tournamentSize·category·completedAt.
// (winnerRegion·theme·winnerId 는 Spring 미제공 — 삭제. count→tournamentSize.)
export interface TournamentHistoryItemDto {
  category: DestinationCategory;
  id: string;
  tournamentSize: number;
  winnerName: string;
  completedAt: string;
}
export interface TournamentHistoryPageDto {
  items: TournamentHistoryItemDto[];
  nextCursor: number | null;
}
