import 'server-only';
import { cache } from 'react';
import { getPlaiceholder } from 'plaiceholder';

/**
 * 외부 이미지 URL에서 LQIP(Low Quality Image Placeholder) base64를 생성.
 *
 * Server Component에서만 호출 — 결과를 OptimizedImage의 blurDataURL prop으로 전달.
 *   const blur = await getBlurDataURL(hero);
 *   <OptimizedImage src={hero} blurDataURL={blur} priority fill sizes="100vw" />
 *
 * 동작:
 *   - fetch는 Next.js 데이터 캐시에 7일 보관 (revalidate)
 *   - 같은 요청 안에서는 React cache()로 dedupe
 *   - 실패 시 undefined 반환 → OptimizedImage가 1px 회색 fallback 사용
 *
 * LCP 임팩트:
 *   시군 hero / 토너먼트 우승지 메인 같은 LCP 후보에 적용하면
 *   원본 로드 전까지 회색 박스 대신 색감/구도가 비슷한 LQIP 표시 →
 *   체감 LCP 감소 + CLS 방지.
 */
export const getBlurDataURL = cache(
  async (src: string): Promise<string | undefined> => {
    if (!src) return undefined;
    try {
      const res = await fetch(src, {
        next: { revalidate: 60 * 60 * 24 * 7 },
      });
      if (!res.ok) return undefined;
      const buffer = Buffer.from(await res.arrayBuffer());
      const { base64 } = await getPlaiceholder(buffer, { size: 10 });
      return base64;
    } catch {
      return undefined;
    }
  },
);
