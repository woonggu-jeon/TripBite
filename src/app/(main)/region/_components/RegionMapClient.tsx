'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CHUNGBUK_REGIONS } from '@/constants/regions';

/**
 * 충북 지도 클라이언트
 *
 * 컴포넌트 분할 (features/region/components):
 *   - <ChungbukSvgMap onSelect={(code) => router.push(...)} />
 *     · SVG path 11개로 시군 영역 표현
 *     · path 에 data-region={code} + onClick
 *     · 활성 시 fill 컬러 변경
 *   - <RegionList />
 *     · 보조 — 지도 아래 그리드/리스트 표시
 *
 * 성능:
 *   - SVG는 단일 React 컴포넌트로 인라인 (네트워크 요청 0)
 *   - 클릭 핸들러는 useCallback 으로 안정화 (path 11개 메모이즈)
 */
export function RegionMapClient() {
  const router = useRouter();
  const tRegion = useTranslations('region.names');

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* TODO: <ChungbukSvgMap onSelect={(code) => router.push(`/region/${code}`)} /> */}
      <div
        style={{
          aspectRatio: '4 / 3',
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--color-muted)',
        }}
      >
        충북 SVG 지도 (11개 시군 path)
      </div>

      {/* 보조 그리드 */}
      <ul
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
          gap: '0.5rem',
          listStyle: 'none',
        }}
      >
        {CHUNGBUK_REGIONS.map((r) => (
          <li key={r.code}>
            <button
              type="button"
              onClick={() => router.push(`/region/${r.code}`)}
              style={{
                width: '100%',
                padding: '0.875rem 0.5rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                background: 'var(--color-bg)',
              }}
            >
              {/* i18n: region.names.<code> 키로 매핑 */}
              {tRegion(r.code as Parameters<typeof tRegion>[0])}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
