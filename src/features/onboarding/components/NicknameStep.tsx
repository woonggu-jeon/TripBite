'use client';

/**
 * <NicknameStep />
 *
 * 온보딩 step 컴포넌트. 구현 시 features/onboarding 의 디자인 시스템 토큰 사용.
 *
 * 권장 props:
 *   - onNext()      다음 step
 *   - onPrev()      이전 step (1번 step은 X)
 *   - onSkip()      이 step 건너뛰기 (선택 step만)
 *   - onSubmit()    마지막 step에서 완료
 */
export function NicknameStep(_props: {
  onNext?: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  onSubmit?: (...args: never[]) => void;
}) {
  return null;
}
