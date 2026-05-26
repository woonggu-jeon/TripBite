/**
 * Carousel feature — Public API
 *
 * 호출부:
 *   import { Carousel } from '@/features/carousel';
 *
 * 사용처 예시:
 *   - 홈 히어로 슬라이드 (오늘의 추천 여행지 N개 자동 재생)
 *   - 토너먼트 결과 — 우승 여행지 사진 캐러셀
 *   - 마이페이지 저장된 우승 여행지 가로 스크롤
 *   - 여행 유형 테스트 — 질문 하나씩 슬라이드 진행
 *
 * 성능:
 *   - embla-carousel-react + autoplay 플러그인은 동적 import (별도 청크)
 *   - main bundle에 미포함 → 캐러셀이 있는 페이지에서만 로드
 */
export { Carousel } from './components/Carousel';
export type { CarouselProps } from './components/Carousel';
export type { CarouselOptions } from './types';
