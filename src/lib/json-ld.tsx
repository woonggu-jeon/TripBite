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
}

/** TouristAttraction / Festival / Place — 여행지 상세 페이지용. */
export function touristAttraction({
  name,
  type,
  addressLocality,
}: TouristAttractionOpts): JsonLdValue {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    ...(addressLocality && {
      address: {
        '@type': 'PostalAddress',
        addressLocality,
        addressRegion: '충청북도',
        addressCountry: 'KR',
      },
    }),
  };
}

/**
 * `<script type="application/ld+json">` 렌더 — Server Component.
 *
 * BLOCK_INDEXING 모드면 미렌더 (mock/QA 빌드가 검색엔진에 색인되지 않도록).
 * 여러 schema 가 동시에 필요하면 JsonLd 를 여러 번 사용해도 무방.
 */
export function JsonLd({ data }: { data: JsonLdValue }) {
  if (BLOCK_INDEXING) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
