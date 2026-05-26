'use client';

/**
 * 세그먼트별 에러 경계
 *
 * 이 흐름에서 에러가 발생해도 헤더/네비/홈은 살아있어
 * 사용자가 다른 메뉴로 이동할 수 있음 → 부분 복구.
 *
 * UI 는 공통 컴포넌트 재사용 — 일관성 + 코드 중복 방지.
 */
export { SegmentError as default } from '@/components/feedback/SegmentError';
