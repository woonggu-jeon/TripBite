/**
 * 외부 이미지 URL 의 http → https 정규화.
 *
 * 배경: 한국관광공사 TourAPI 가 `http://tong.visitkorea.or.kr/...` URL 을 발급.
 * 우리 CSP `img-src https://tong.visitkorea.or.kr` + next.config `remotePatterns`
 * 의 `protocol: 'https'` 가 https 만 허용 → http URL 은 mixed content / CSP block.
 *
 * BE 가 sync 시점에 변환하는 게 정석이지만 (EXTERNAL_APIS.md §4-6 참조), FE
 * 안전망으로 동일 변환 적용 — BE 누락 / 다른 도메인 추가 시에도 견디게.
 *
 * Allowlist 정책:
 *   - 신뢰 가능한 외부 host 만 http→https 자동 변환 (open redirect/MITM 우회 회피)
 *   - 그 외 도메인의 http 는 변환 X — 호출부가 의도적으로 처리
 *
 * 사용:
 *   const safe = secureImageUrl(letter.imageUrl);
 *   const fixed = normalizeContent(content);   // RegionContent 일괄
 */

const HTTPS_FORCE_HOSTS = ['tong.visitkorea.or.kr'];

export function secureImageUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url) return undefined;
  if (!url.startsWith('http://')) return url;
  try {
    const u = new URL(url);
    if (HTTPS_FORCE_HOSTS.includes(u.hostname)) {
      u.protocol = 'https:';
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

/**
 * RegionContent / Destination 등 imageUrl 필드를 가진 객체 일괄 정규화.
 * 원본을 변경하지 않고 새 객체 반환.
 */
export function normalizeImageField<T extends { imageUrl?: string | null }>(
  obj: T,
): T {
  if (!obj.imageUrl) return obj;
  const fixed = secureImageUrl(obj.imageUrl);
  if (fixed === obj.imageUrl) return obj;
  return { ...obj, imageUrl: fixed };
}

/**
 * DestinationDetail 등 `images: string[]` 배열을 가진 객체 일괄 정규화.
 * 배열 항목 중 하나라도 변환 대상이면 새 객체 반환, 아니면 원본 reference.
 */
export function normalizeImagesField<T extends { images?: string[] | null }>(
  obj: T,
): T {
  if (!obj.images || obj.images.length === 0) return obj;
  let changed = false;
  const next = obj.images.map((p) => {
    const fixed = secureImageUrl(p);
    if (fixed !== p) changed = true;
    return fixed ?? p;
  });
  if (!changed) return obj;
  return { ...obj, images: next };
}
