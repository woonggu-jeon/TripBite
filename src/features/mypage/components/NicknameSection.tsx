'use client';

/**
 * <NicknameSection />
 *
 * 닉네임 표시 + 편집 진입점.
 *
 * 사양:
 *   - 현재 닉네임 표시 (서버가 자동 할당한 default라면 약한 색상으로 구분)
 *   - "변경" 버튼 클릭 → <NicknameEditDialog /> 오픈
 *   - 첫 진입 사용자에게는 한 번 onboarding 모달 노출 추천
 *     (예: profile.isDefault === true && 다섯글자편지 첫 사용 직전)
 *
 * 닉네임 정책 (서버와 합의 필요):
 *   - 1~10자, 한글/영문/숫자
 *   - 비속어 필터링
 *   - 중복 허용 여부
 */
export function NicknameSection() {
  return null;
}
