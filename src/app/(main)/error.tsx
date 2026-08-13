'use client';

/**
 * (main) 그룹 에러 경계 — 자체 error.tsx 가 없는 하위 세그먼트(notifications,
 * destination/[id] 등)의 렌더 throw 를 여기서 잡는다.
 *
 * 이게 없으면 루트 error.tsx 로 버블돼 헤더/BottomNav 같은 앱 셸까지 통째로
 * 교체된다(부분 복구 불가). 그룹 경계에서 잡으면 (main)/layout 의 셸은 살아있어
 * 사용자가 다른 메뉴로 이동 가능 → 부분 복구. UI 는 공통 컴포넌트 재사용.
 */
export { SegmentError as default } from '@/components/feedback/SegmentError';
