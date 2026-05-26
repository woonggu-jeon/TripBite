export type OnboardingState = {
  step: 1 | 2 | 3;
  conceptAcknowledged: boolean;
  locationAllowed: boolean | 'skipped';
  nickname: string;
};

export type CompleteOnboardingRequest = {
  nickname: string;
  /** 클라이언트가 GPS 또는 IP로 얻은 위치 (선택) */
  regionCode?: string;
};
