/**
 * JSON-LD (schema.org) factory + 렌더 헬퍼.
 *
 * 사용 패턴 (Server Component):
 *
 *   import { JsonLd, breadcrumbList, touristAttraction } from '@/lib/json-ld';
 *
 *   <JsonLd data={breadcrumbList([
 *     { name: '홈', url: '/' },
 *     { name: '시군', url: '/region' },
 *     { name: '청주', url: '/region/cheongju' },
 *   ])} />
 *
 * 정합 규칙:
 *   - `url` 은 site origin 을 자동 prefix (절대 URL). 호출 측은 path 만 넘김.
 *   - BLOCK_INDEXING (`NEXT_PUBLIC_USE_MSW` / `BLOCK_INDEXING`) 모드면 JsonLd 가 미렌더.
 *   - schema.org 의 @context 는 factory 가 자동 부여.
 *
 * next-seo 같은 외부 lib 대신 native — App Router 의 inline `<script>` 으로 충분.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trip-bite-mxue.vercel.app';

const BLOCK_INDEXING =
  process.env.NEXT_PUBLIC_USE_MSW === 'true' ||
  process.env.NEXT_PUBLIC_BLOCK_INDEXING === 'true';

const abs = (path: string): string =>
  path.startsWith('http')
    ? path
    : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export type JsonLdValue = Record<string, unknown>;

export interface BreadcrumbItem {
  /** 표시 라벨 (이미 i18n 변환된 문자열). */
  name: string;
  /** site-relative path (예: `/region/cheongju`). 절대 URL 도 그대로 전달 가능. */
  url: string;
}

/** BreadcrumbList — SERP breadcrumb 표시. */
export function breadcrumbList(items: BreadcrumbItem[]): JsonLdValue {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.url),
    })),
  };
}

/** WebSite + Organization @graph — 루트 layout 1회용. */
export function webSiteOrganization(opts: {
  name: string;
  inLanguage: string[];
  logoPath: string;
}): JsonLdValue {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: opts.name,
        url: abs('/'),
        inLanguage: opts.inLanguage,
      },
      {
        '@type': 'Organization',
        name: opts.name,
        url: abs('/'),
        logo: abs(opts.logoPath),
      },
    ],
  };
}

export interface TouristAttractionOpts {
  name: string;
  /** 'TouristAttraction' | 'Festival' | 'Place' (카테고리별 매핑). */
  type: string;
  /** 시군 한글명 (예: '청주시'). 없으면 address 자체 omit. */
  addressLocality?: string;
  /**
   * 축제 일정 (ISO 8601 YYYY-MM-DD).
   * `type === 'Festival'` 이고 startDate 가 있을 때만 Event schema 로 변형.
   * Google SERP 의 "이벤트 카드" rich result 조건 (Event + name + startDate).
   */
  startDate?: string;
  endDate?: string;
}

/**
 * TouristAttraction / Festival / Place — 여행지 상세 페이지용.
 *
 * Festival + startDate 가 있으면 Event subtype (schema.org Festival is-a Event)
 * 으로 변형 — startDate/endDate/location 포함.
 */
export function touristAttraction({
  name,
  type,
  addressLocality,
  startDate,
  endDate,
}: TouristAttractionOpts): JsonLdValue {
  const address = addressLocality && {
    '@type': 'PostalAddress',
    addressLocality,
    addressRegion: '충청북도',
    addressCountry: 'KR',
  };

  if (type === 'Festival' && startDate) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Festival',
      name,
      startDate,
      ...(endDate && { endDate }),
      ...(addressLocality && {
        location: {
          '@type': 'Place',
          name: addressLocality,
          ...(address && { address }),
        },
      }),
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    ...(address && { address }),
  };
}

/**
 * JSON-LD 안전 직렬화 — `<script>` 안 dangerouslySetInnerHTML 용.
 *
 * data 가 사용자 입력 (BE 응답의 destination name, letter body 등) 을 포함하면
 * `</script>` / `<` / `>` / `&` 가 그대로 들어가 script tag 가 깨지거나 XSS 가
 * 가능. Google JSON-LD 가이드 + OWASP 권장 — 다음 문자를 unicode escape:
 *   - LT/GT → script tag boundary 보호
 *   - AMP → HTML entity 회피
 *   - U+2028 / U+2029 (line/paragraph separator) → JSON parser 안전망
 *
 * 결과는 JSON-LD spec 상 valid (JSON 의 unicode escape 는 허용).
 */
export function serializeJsonLd(data: JsonLdValue): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * `<script type="application/ld+json">` 렌더 — Server Component.
 *
 * BLOCK_INDEXING 모드면 미렌더 (mock/QA 빌드가 검색엔진에 색인되지 않도록).
 * 여러 schema 가 동시에 필요하면 JsonLd 를 여러 번 사용해도 무방.
 *
 * XSS 안전망: serializeJsonLd 가 LT/GT/AMP/U+2028/U+2029 를 unicode escape.
 */
export function JsonLd({ data }: { data: JsonLdValue }) {
  if (BLOCK_INDEXING) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
