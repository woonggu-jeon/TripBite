export type OnboardingState = {
  step: 1 | 2 | 3;
  conceptAcknowledged: boolean;
  locationAllowed: boolean | 'skipped';
  nickname: string;
};

export type CompleteOnboardingRequest = {
  /**
   * 사용자 닉네임 — optional.
   * 닉네임 단계가 일단 미노출이라 클라이언트가 nickname 을 보내지 않음.
   * 서버는 누락 시 기본 닉네임(예: '여행자') 자동 부여.
   */
  nickname?: string;
  /** 클라이언트가 GPS 또는 IP로 얻은 위치 (선택) */
  regionCode?: string;
};
