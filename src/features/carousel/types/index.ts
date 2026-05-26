/**
 * Carousel 공통 타입
 *
 * Embla 옵션을 그대로 노출하지 않고 자주 쓰는 것만 선별.
 * 추후 라이브러리 교체 시 호출부에 영향 없음.
 */
export type CarouselOptions = {
  /** 첫/끝에서 반대편으로 wrap */
  loop?: boolean;
  /** 드래그 시 자유 스크롤 (snap 비활성화) */
  dragFree?: boolean;
  /** 시작 슬라이드 인덱스 */
  startIndex?: number;
  /** 자동 재생 간격 (ms). 미지정 = 비활성화 */
  autoplayMs?: number;
  /** 한 번에 보이는 슬라이드 수 (CSS 기반) */
  slidesPerView?: number;
  /** 슬라이드 간 간격 (px) */
  gap?: number;
};
