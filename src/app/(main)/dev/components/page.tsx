import { notFound } from 'next/navigation';
import { CatalogClient } from './_components/CatalogClient';

/**
 * 컴포넌트 카탈로그 (/dev/components)
 *
 * 정식 Storybook 대신 가벼운 라이브 카탈로그.
 * - 개발 환경에서만 접근 (운영 빌드에선 404)
 * - 디자이너 / PM 이 시각적 검토용
 *
 * 표시 컴포넌트:
 *   EmptyState / Skeleton / Toast / ConfirmDialog / OptimizedImage / Chart / Carousel
 */
export const dynamic = 'force-dynamic';

export default function DevComponentsPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <CatalogClient />;
}
