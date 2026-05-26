'use client';

/**
 * <TravelTypeShareCard />
 *
 * 여행 유형 결과 공유 카드
 *
 * 사양:
 *   - 정사각형(1080x1080) 또는 9:16 카드 형태로 결과 시각화
 *   - 유형 코드 + 타이틀 + 핵심 키워드 + 일러스트
 *   - 다운로드 / 공유 (Web Share API)
 *     - navigator.share 미지원 환경엔 이미지 저장 fallback
 *
 * 구현 옵션:
 *   - DOM → html2canvas 또는 dom-to-image로 PNG 추출
 *   - 또는 서버에서 OG 이미지 생성 후 URL 제공
 */
export function TravelTypeShareCard() {
  return null;
}
